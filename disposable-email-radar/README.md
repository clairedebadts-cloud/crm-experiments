# Disposable Email Radar

A small agentic pipeline that maintains a weekly-refreshed, enriched dataset of disposable/temporary email domains — aggregated from open-source sources, verified against live DNS, and enriched with metadata (email format, country, inbox duration) that the upstream lists don't track.

Built as a self-contained demonstration of an autonomous, scheduled agent workflow: source aggregation → judgement-based enrichment → mechanical verification → commit, running unattended on a weekly cadence via GitHub Actions, with graceful degradation when a step fails rather than silent staleness.

## Why this exists

I wanted a small, real, running system to point to in conversations about agentic workflows — not a slide describing the concept, something that's actually been executing on its own schedule. See [`DECISIONS.md`](./DECISIONS.md) for the reasoning behind the specific design choices.

## Example

```
domain,email_format,status,country_iso,date_added,duration,last_updated,source
mailinator.com,random@mailinator.com,active,US,02-07-2026,unlimited (public inbox),02-07-2026,disposable/disposable-email-domains
```

## How it works

1. **Collect** — pull and merge upstream open-source disposable-domain feeds, de-duplicated by domain.
2. **Enrich** — for genuinely new domains only, infer email format / country / duration, or mark `unknown` where not confidently determinable.
3. **Verify** — weekly MX/DNS check against every domain in the dataset; status flips freely between `active` and `inactive` based on the current result, no permanent archiving.
4. **Commit** — GitHub Action commits the diff with a summary of what changed.

Model routing: Sonnet for the enrichment step (needs judgement), Haiku for collection, verification, and access logging (mechanical read/write). Full reasoning in `DECISIONS.md`.

## Access

The dataset is currently accessible on request — contact me and I'll add you as a repository collaborator. There's no public API; see `DECISIONS.md` for why that's a deliberate scope decision rather than an oversight.

## Limitations

Being specific about where this would break in production, rather than glossing over it:

- **MX-record presence is a proxy, not proof.** A domain resolving to a mail server confirms it *can* receive mail — not that it's currently operating as a disposable-email service, or that a provider hasn't quietly changed its inbox duration or address format since the last enrichment pass.
- **Upstream lists carry their own lag and bias.** This project's freshness is bounded by how quickly the community-maintained sources it aggregates pick up new providers. A genuinely new disposable-email service can exist for some time before appearing anywhere in this pipeline.
- **Country and format enrichment are best-effort, not verified facts.** Where a source doesn't clearly state country of registration or the exact address format, the value is marked `unknown` rather than guessed — but "not obviously wrong" isn't the same as "confirmed correct."
- **No real-time signal.** This refreshes weekly. A domain that goes disposable mid-week won't be flagged until the following Monday's run at the earliest.
- **False positives have real cost.** Any consumer of this dataset blocking signups on `status = active` should treat it as one signal among several, not a sole source of truth — legitimate small providers can occasionally resemble disposable ones, and this pipeline has no dispute/appeal mechanism.

## What I'd do differently at scale

A production version serving real third-party traffic would need: a proper API layer with per-requester rate limiting rather than manual repo access, a confidence score per domain based on source agreement rather than a flat boolean, a feedback loop for reported false positives, and verification more frequent than weekly for high-traffic consumers. Deliberately out of scope here — see `DECISIONS.md` for why.
