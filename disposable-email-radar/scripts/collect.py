"""
collect.py — pull upstream disposable-domain feeds, merge into data/disposable_domains.csv

Schema: domain, status, date_added, last_updated

Mechanical task — fetch, diff, merge. No reasoning required, so no LLM call
belongs in this step.

New domains are added with status "active" (provisional) — verify.py confirms
that for real with an MX check on the next run.
"""

import csv
import json
import os
import urllib.request
from datetime import datetime, timezone

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "disposable_domains.csv")

FIELDNAMES = ["domain", "status", "date_added", "last_updated"]

SOURCES = [
    ("disposable/disposable-email-domains",
     "https://raw.githubusercontent.com/disposable/disposable-email-domains/master/domains.json",
     "json_array"),
]


def fetch_source(name, url, parser_key):
    try:
        with urllib.request.urlopen(url, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
    except Exception as e:
        print(f"  [WARN] Failed to fetch {name}: {e}")
        return set()

    if parser_key == "json_array":
        try:
            domains = json.loads(raw)
            return {d.strip().lower() for d in domains if d.strip()}
        except json.JSONDecodeError as e:
            print(f"  [WARN] Failed to parse {name} as JSON array: {e}")
            return set()

    print(f"  [WARN] Unknown parser_key '{parser_key}' for {name}")
    return set()


def load_existing():
    if not os.path.exists(DATA_PATH):
        return {}
    with open(DATA_PATH, newline="", encoding="utf-8") as f:
        return {row["domain"]: row for row in csv.DictReader(f)}


def main():
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")
    existing = load_existing()
    print(f"Loaded {len(existing)} existing domains from {DATA_PATH}")

    all_domains = set()
    for name, url, parser_key in SOURCES:
        print(f"Fetching {name} ...")
        domains = fetch_source(name, url, parser_key)
        print(f"  -> {len(domains)} domains")
        all_domains |= domains

    added = 0
    for domain in all_domains:
        if domain not in existing:
            existing[domain] = {
                "domain": domain,
                "status": "active",  # provisional, verify.py confirms
                "date_added": today,
                "last_updated": today,
            }
            added += 1

    with open(DATA_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        for domain in sorted(existing.keys()):
            writer.writerow(existing[domain])

    print(f"Done. {added} new domains added. Total tracked: {len(existing)}")


if __name__ == "__main__":
    main()
