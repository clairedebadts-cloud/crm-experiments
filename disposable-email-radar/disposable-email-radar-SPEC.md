# Disposable Email Radar — Project Build Spec

Owner: Claire de Badts
Purpose: Maintain a weekly-refreshed, enriched dataset of disposable/temporary email domains, gated behind an authorisation step before third parties can query it via API.

This document is the spec to hand to Claude Code to scaffold the repo. It is not the code itself.

---

## 1. Don't start from zero — aggregate existing feeds

Several actively maintained open-source lists already track disposable domains. The agent should aggregate + de-duplicate these as its seed/refresh source, then layer your enrichment on top (format, country, duration, dates), rather than trying to "discover" the whole internet from scratch every week:

| Source | What it gives you | Update cadence |
|---|---|---|
| `disposable-email-domains/disposable-email-domains` | Curated, PR-reviewed, lowest false-positive rate | Community PRs, not daily |
| `disposable/disposable-email-domains` | ~5,000+ domains, includes MX-checked variant, JSON + TXT | Daily |
| `groundcat/disposable-email-domain-list` | Already does exactly your "verify MX weekly, cache inactive" pattern — worth reading their approach directly | Weekly (Mondays) |
| `eramitgupta/disposable-email` | Largest aggregation (~110k domains), merges multiple sources | Daily |
| Kickbox API (`open.kickbox.com/v1/disposable/{domain}`) | Free live lookup API, useful as a secondary verification signal | Real-time |

None of these track **country**, **email format**, or **duration** — that's your differentiator. Treat them as the "is this domain disposable at all" input, and build your own enrichment pass on top.

---

## 2. Repo structure

```
disposable-email-radar/
├── README.md                           # portfolio-facing: what it does, limitations, "what I'd do at scale"
├── DECISIONS.md                        # short log of the non-obvious design calls and why
├── data/
│   └── disposable_domains.csv          # the canonical dataset
├── scripts/
│   ├── collect.py                      # pulls + merges source feeds, adds new domains
│   ├── enrich.py                       # fills in format/country/duration for new entries
│   ├── verify.py                       # weekly MX/DNS check, flips status active↔inactive
│   └── access_control.py               # manages the authorised-requester allowlist
├── access/
│   ├── allowlist.csv                   # approved requesters (see §5)
│   └── requests_log.csv                # audit trail of who asked, when, decision
├── .github/
│   └── workflows/
│       └── weekly-refresh.yml          # cron job: collect → enrich → verify → commit
└── LICENSE
```

---

## 3. Data schema — `data/disposable_domains.csv`

| Column | Format | Notes |
|---|---|---|
| `domain` | string | second-level domain, lowercase, no `@` |
| `email_format` | string | e.g. `random@domain`, `word+word@domain`, `custom-alias@domain` — inferred from provider's signup page where determinable, else `unknown` |
| `status` | `active` \| `inactive` | flipped weekly by `verify.py` |
| `country_iso` | ISO 3166-1 alpha-2 | country the provider is associated with/registered in; `XX` if undeterminable |
| `date_added` | `DD-MM-YYYY` | when the domain first entered the consolidated list — set once, never changes |
| `duration` | string | how long a generated inbox lasts, e.g. `10 minutes`, `1 hour`, `24 hours`, `unknown` |
| `last_updated` | `DD-MM-YYYY` | most recent weekly run that touched this row, whether or not status changed |
| `source` | string | which upstream feed(s) it came from; merge into one list if multiple sources agree on the same domain, don't duplicate the row |

Example row:
```
mailinator.com,random@mailinator.com,active,US,02-07-2026,unlimited (public inbox),02-07-2026,disposable/disposable-email-domains
```

**Status is two-state and non-permanent by design:** `active` = the provider/format can generate a working inbox right now; `inactive` = it can't, as of the most recent check. There is no third "archived" tier — `verify.py` re-checks MX fresh every run and sets status accordingly each time. A domain that goes `inactive` can flip back to `active` in a later run if it starts resolving again (providers relapse, get re-registered, or come back from maintenance) — no one-way transitions, no permanent archiving.

---

## 4. Weekly agent workflow

1. **Collect** — pull the upstream feeds in §1, normalise to second-level domains, diff against `data/disposable_domains.csv` to find genuinely new domains.
2. **Enrich** — for each *new* domain only (not the whole file, to keep this cheap): attempt to determine email format, duration, and country from the provider's own site/docs via web search; mark `unknown` where not confidently determinable rather than guessing. Set `date_added` = run date.
3. **Verify** — for *every* domain already in the file: DNS/MX lookup (matching `groundcat`'s approach is a solid reference implementation). No MX record across resolvers → `status = inactive`. MX confirmed → `status = active`. This flips freely in either direction each run — a previously inactive domain goes back to `active` the moment it resolves again. Update `last_updated` regardless of outcome.
4. **Commit** — GitHub Action commits the updated CSV with a summary in the commit message (`+N new, M flipped inactive`).

### `.github/workflows/weekly-refresh.yml` (skeleton)
```yaml
name: Weekly disposable domain refresh
on:
  schedule:
    - cron: '0 6 * * 1'   # Mondays 06:00 UTC
  workflow_dispatch: {}    # manual trigger option

jobs:
  refresh:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: pip install -r requirements.txt
      - run: python scripts/collect.py
      - run: python scripts/enrich.py
      - run: python scripts/verify.py
      - run: |
          git config user.name "disposable-email-radar-bot"
          git config user.email "actions@github.com"
          git add data/disposable_domains.csv
          git diff --cached --quiet || git commit -m "Weekly refresh: $(date +%d-%m-%Y)"
          git push
```

---

## 5. Access control — gating API use behind your approval

Since the file itself lives in a repo, "gating API access" really means **two separate things**, and it's worth deciding which one you want:

**Option A — Private repo + manual GitHub collaborator invite**
Simplest to build. Data lives in a *private* repo. Someone emails you, you reply approving, you add them as a repo collaborator (or generate a fine-grained GitHub PAT scoped to that repo for them). They pull the CSV directly from the GitHub API. No extra infrastructure — but access is "pull the whole file," not a queryable API.

**Option B — Lightweight API gateway (recommended if you want true "API requests")**
- Data repo stays private.
- A small serverless endpoint (Cloudflare Worker or similar) reads the CSV and serves it as JSON, e.g. `GET /v1/check/{domain}`.
- Requesters email you at your personal address → you approve → you (or `access_control.py`) generate an API key, hash it, and append a row to `access/allowlist.csv` (requester email, approved date, key hash, status).
- The gateway checks the incoming request's key against the allowlist before responding; unlisted keys get `403`.
- This gets you real usage/rate-limit control per requester, not just repo access.

**For this build: go with Option A.** As a portfolio piece, building multi-tenant auth infrastructure for an audience of zero actual requesters spends effort on the least visible part of the project. Option B is documented here and worth revisiting if someone actually asks to consume this programmatically — until then, README should state plainly that access is manual-by-request.

`access/requests_log.csv` should log every access request regardless of outcome (requester, date, decision, decided-by) so you have an audit trail.

---

## 6. Model routing

No step here needs a frontier model — this is a cheap, weekly, well-bounded pipeline, so route by task rather than defaulting everything to the most capable model:

| Step | Model | Why |
|---|---|---|
| `collect.py` — merge/dedupe feeds | Haiku | Mechanical: normalise domains, diff against existing rows, merge `source` lists. No real reasoning required. |
| `enrich.py` — infer format/country/duration for *new* domains only | Sonnet | Needs to read provider sites/search results and make a judgement call, including correctly returning `unknown` rather than guessing. Worth the extra capability since it's writing data that persists. |
| `verify.py` — MX/DNS check + status flip | Haiku | Pure lookup-and-write logic, no interpretation needed. |
| `access_control.py` — logging requests, writing approved keys | Haiku | Structured writes only; you make every actual approval decision yourself, per the guardrails below. |

**Fallback:** if the primary model for a step is unavailable or errors out (rate limit, timeout, outage), fall back one tier rather than failing the whole run — Sonnet steps fall back to Haiku with a note in the commit message that enrichment ran in degraded mode (some new rows may need a manual pass later), Haiku steps retry once before failing loudly. The weekly Action should never fail silently: a failed run should still commit whatever succeeded and flag what didn't, rather than leaving the dataset stale with no signal.

---

## 7. Guardrails

Scoped deliberately narrow, per your instruction — the agent's job is limited to:
- Running the weekly collect → enrich → verify → commit cycle
- Flipping `status` between `active`/`inactive` based on DNS/MX evidence only (never inferring status from anything else)
- Logging access requests to `requests_log.csv`
- **Never** auto-approving or auto-granting access — every entry in `allowlist.csv` requires your explicit sign-off; the agent's role in access control is limited to logging requests and, once *you've* approved one, mechanically generating/recording the key.
- **Never** modifying `email_format`, `country_iso`, or `duration` for existing rows without a new verification source — only ever fill these in for genuinely new domains, to avoid silent data drift on entries you've already reviewed.

---

## 8. Handing this to Claude Code

Suggested first prompt once you open this in Claude Code:
> "Scaffold the repo structure and files described in disposable-email-radar-SPEC.md. Start with `collect.py` pulling from the `disposable/disposable-email-domains` JSON feed, get a working end-to-end pipeline with a handful of real domains, then layer in `enrich.py` and `verify.py`."

Building it in that order (collect → working pipeline → enrich → verify → access control) means you have something runnable early rather than debugging four scripts at once.
