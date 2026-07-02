"""
verify.py — weekly MX/DNS check against every domain in the dataset.

Schema: domain, status, date_added, last_updated

Status is two-state and non-permanent (see DECISIONS.md): a domain flips freely
between active/inactive based on the current check only. A domain that lapses
and later comes back is expected to flip back to active on its own.

Parallelized with a thread pool since this is I/O-bound (waiting on DNS), not
CPU-bound — sequential checks against ~74k domains would take hours; this
brings it down to minutes. Mechanical task, no LLM call needed.
"""

import csv
import os
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone

import dns.resolver
import dns.exception

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "disposable_domains.csv")
FIELDNAMES = ["domain", "status", "date_added", "last_updated"]

MAX_WORKERS = 50  # concurrent DNS lookups

# If more than this fraction of *checked* domains come back inactive in a
# single run, treat it as a broken environment (e.g. CI runner with no/blocked
# outbound DNS) rather than real data, and refuse to write the file. A mass
# extinction of disposable-email providers in one week is not plausible;
# a DNS-blind sandbox producing that exact signature is.
MAX_PLAUSIBLE_INACTIVE_FRACTION = 0.90


def has_mx_record(domain):
    """True/False if resolvable either way, None if the check was inconclusive."""
    resolver = dns.resolver.Resolver()
    resolver.timeout = 5
    resolver.lifetime = 5
    try:
        answers = resolver.resolve(domain, "MX")
        return len(answers) > 0
    except (dns.resolver.NXDOMAIN, dns.resolver.NoAnswer, dns.exception.Timeout,
            dns.resolver.NoNameservers):
        return False
    except Exception:
        return None  # inconclusive — leave the row untouched rather than guess


def main(limit=None):
    if not os.path.exists(DATA_PATH):
        print(f"No dataset found at {DATA_PATH} — run collect.py first.")
        sys.exit(1)

    with open(DATA_PATH, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    to_check = rows if limit is None else rows[:limit]
    today = datetime.now(timezone.utc).strftime("%d-%m-%Y")

    flipped_active, flipped_inactive, unchanged, skipped = 0, 0, 0, 0
    results = {}

    with ThreadPoolExecutor(max_workers=MAX_WORKERS) as executor:
        futures = {executor.submit(has_mx_record, row["domain"]): row["domain"] for row in to_check}
        done = 0
        for future in as_completed(futures):
            domain = futures[future]
            results[domain] = future.result()
            done += 1
            if done % 2000 == 0:
                print(f"  checked {done}/{len(to_check)} ...")

    for row in to_check:
        result = results.get(row["domain"])
        if result is None:
            skipped += 1
            continue

        new_status = "active" if result else "inactive"
        if new_status != row["status"]:
            if new_status == "active":
                flipped_active += 1
            else:
                flipped_inactive += 1
            row["status"] = new_status
        else:
            unchanged += 1
        row["last_updated"] = today

    checked = flipped_active + flipped_inactive + unchanged
    # unchanged includes rows that were already inactive and stayed inactive —
    # what we actually care about here is: of everything we got a real answer
    # for this run, what fraction ended up inactive right now.
    inactive_now = sum(1 for row in to_check
                        if results.get(row["domain"]) is False)

    if checked > 0 and (inactive_now / checked) > MAX_PLAUSIBLE_INACTIVE_FRACTION:
        print(f"\n[ABORT] {inactive_now}/{checked} domains ({inactive_now/checked:.0%}) "
              f"came back inactive this run — that's above the "
              f"{MAX_PLAUSIBLE_INACTIVE_FRACTION:.0%} plausibility threshold.")
        print("This almost certainly means DNS resolution is broken or blocked "
              "in this environment, not that this many providers actually died "
              "in one week. Refusing to write data/disposable_domains.csv this run.")
        sys.exit(1)

    with open(DATA_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=FIELDNAMES)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Done. {flipped_active} flipped to active, {flipped_inactive} flipped to inactive, "
          f"{unchanged} unchanged, {skipped} skipped (inconclusive).")


if __name__ == "__main__":
    limit_arg = int(sys.argv[1]) if len(sys.argv) > 1 else None
    main(limit=limit_arg)
