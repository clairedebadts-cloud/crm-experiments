# Design Decisions

A running log of the non-obvious calls made while building this, and why. Kept deliberately short per entry — the point is the reasoning, not the exposition.

---

**Aggregate existing open-source lists rather than discover domains from scratch.**
Several actively maintained projects already track disposable domains (disposable-email-domains/disposable-email-domains, disposable/disposable-email-domains, groundcat/disposable-email-domain-list, eramitgupta/disposable-email). Re-solving "is this domain disposable" from zero every week would be redundant effort spent on the least differentiated part of the problem. The interesting work is the enrichment layer on top — format, country, duration — which none of the upstream lists track.

**Status is two states, not three.**
First draft included an `archived` tier for domains dead long enough that historical customer data might still reference them. Cut it: disposable-email providers relapse — domains lapse and get re-registered, services go down for maintenance and come back. A one-way `active → inactive → archived` transition would silently prevent a genuinely-revived domain from ever being marked active again, which is a worse failure mode than the problem it was solving. `verify.py` re-checks fresh every run with no memory of prior state beyond the current row.

**Two separate date columns, not one.**
`date_added` (set once, immutable) and `last_updated` (touched every run) answer different questions — "how long has this been tracked" versus "how fresh is this row" — and collapsing them into one field would lose one of the two answers.

**Merge on domain across sources rather than keeping duplicate rows.**
Most disposable domains appear in multiple upstream lists. One row per domain with a combined `source` field keeps the dataset queryable and avoids the ambiguity of "which of these five identical rows is authoritative."

**Model routing by task, not one model for everything.**
`enrich.py` (inferring format/country/duration for new domains) needs judgement and is worth Sonnet's capability, especially since it's writing data that persists. `collect.py`, `verify.py`, and `access_control.py` are mechanical read/diff/write operations with no interpretation required — Haiku is enough, and cheaper for a job that runs every week indefinitely. No step uses Fable 5; nothing in this pipeline needs that level of capability.

**Fallback degrades gracefully instead of failing the whole run.**
If Sonnet is unavailable for enrichment, the pipeline falls back to Haiku and flags the run as degraded in the commit message, rather than blocking the week's refresh entirely. A stale dataset with no signal about why is a worse outcome than an imperfect one with a clear flag on it.

**Access control is manual-by-request, not a built API gateway.**
Considered building a keyed API gateway (Option B in the spec) so third parties could query the dataset programmatically. Deliberately scoped this out for now: building multi-tenant auth infrastructure for an audience of zero actual requesters is effort spent on the least visible, least interesting part of the project, and once someone else's product depends on your weekly cron job, that's an ongoing liability you should only take on when someone actually asks. Manual repo-collaborator access covers the real need today; the gateway design is documented and ready to build if that changes.

**Simplified the schema to four columns after seeing real numbers.** First draft included `email_format`, `country_iso`, and `duration` as enrichment fields. Running `collect.py` against the actual upstream feed pulled in 74,417 domains in one pass — at that volume, per-domain judgement-based enrichment for format/country/duration isn't remotely realistic to do meaningfully for the full set; the overwhelming majority would sit at `unknown` indefinitely, which adds the appearance of precision without the substance of it. Cut to four columns that the pipeline can actually stand behind: `domain`, `status`, `date_added`, `last_updated`. This also removed the only step in the pipeline that needed a reasoning model — both `collect.py` and `verify.py` are now Haiku-tier mechanical tasks (fetch/diff/write, DNS lookup), no Sonnet call needed anywhere.

**Parallelized `verify.py` after measuring, not guessing.** A sequential first draft checked 100 domains in ~20 seconds — extrapolated to 74k+ domains, that's roughly 4 hours, which is wasteful and pushes against GitHub Actions runtime limits. Since each check is I/O-bound (waiting on DNS, not computing), a thread pool was the obvious fix. Measured again after the change: 2,000 domains in 37 seconds with 50 concurrent workers, projecting to roughly 23 minutes for the full dataset — a controlled, evidence-based decision rather than a design choice made in the abstract.

**MX record presence is a proxy signal, not a guarantee.**
Confirms a domain *can* receive mail — it does not confirm the domain is actually being used as a disposable-email service today. This is a known limitation of the verification method, not a solved problem (see README limitations section).
