# Disposable Email Radar

A small agentic pipeline that maintains a weekly-refreshed dataset of disposable/temporary email domains — aggregated from open-source sources and verified against live DNS on a rolling weekly cycle.

Built as a self-contained demonstration of an autonomous, scheduled agent workflow: source aggregation → mechanical DNS verification → commit, running unattended on a weekly cadence via GitHub Actions, with graceful degradation when a step fails rather than silent staleness.

## Why this exists

I wanted a small, real, running system to point to in conversations about agentic workflows — not a slide describing the concept, something that's actually been executing on its own schedule. See [`DECISIONS.md`](./DECISIONS.md) for the reasoning behind the specific design choices, including why the schema is deliberately lean rather than more elaborate.

## Example

```
domain,status,date_added,last_updated
mailinator.com,active,02-07-2026,02-07-2026
```

Three things, kept deliberately minimal: is this `@domain.tld` currently disposable, when did we first start tracking it, and when did we last confirm that. Earlier drafts of this schema included email format, country, and inbox duration — cut once real data showed that at aggregation scale (74k+ domains from a single upstream feed), those fields would sit at "unknown" for the overwhelming majority of rows and add more apparent precision than the pipeline could actually deliver. See `DECISIONS.md`.

## How it works

1. **Collect** — pull upstream open-source disposable-domain feeds, de-duplicated by domain. New domains are added with a provisional `active` status.
2. **Verify** — weekly MX/DNS check against every domain in the dataset, parallelized across ~50 concurrent lookups since this is I/O-bound. Status flips freely between `active` and `inactive` based on the current result each run — no permanent archiving.
3. **Commit** — GitHub Action commits the diff with a summary of what changed.

Model routing: both steps are mechanical (fetch/diff/write, DNS lookup) with no judgement calls required, so both run on Haiku-tier. Full reasoning in `DECISIONS.md`.

## Access

The dataset is currently accessible on request — contact me and I'll add you as a repository collaborator. 

## Limitations

Being specific about where this would break in production, rather than glossing over it:

- **Upstream lists carry their own lag and bias.** This project's freshness is bounded by how quickly the community-maintained sources it aggregates pick up new providers. A genuinely new disposable-email service can exist for some time before appearing anywhere in this pipeline.
- **No real-time signal.** This refreshes weekly. A domain that goes disposable mid-week won't be flagged until the following Monday's run at the earliest.
- **Single upstream source currently.** The pipeline is built to aggregate multiple feeds but currently pulls from one (`disposable/disposable-email-domains`). Adding a second source would surface any disagreement between feeds, which is useful signal not yet being captured.
- **False positives have real cost.** Any consumer of this dataset blocking signups on `status = active` should treat it as one signal among several, not a sole source of truth — this pipeline has no dispute/appeal mechanism.

## What I'd do differently at scale

A production version serving real third-party traffic would need: a proper API layer with per-requester rate limiting rather than manual repo access, a confidence score per domain based on multi-source agreement, a feedback loop for reported false positives, and verification more frequent than weekly for high-traffic consumers. Deliberately out of scope here — see `DECISIONS.md` for why.
