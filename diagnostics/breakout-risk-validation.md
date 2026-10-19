# Role security, downside and confidence review

Implemented October 18, 2026. Status: shadow evaluation; not promoted to scoring.

The existing breakout coefficient, intrinsic-confidence shrinkage, player pool and compressed core are unchanged. The new panel presents separate role security, risk flags, evidence coverage and confidence for the 16 rated candidates. It never writes draft state or alters player inputs, predictions, grades or historical archives.

`breakout-risk.js` rejects evidence after an explicit draft cutoff, missing dates, missing sources and unknown values. Backup, reserve and specialist roles are contingent; known unavailability is separately identified. Committee competition and health uncertainty receive independent flags. A missing bust score never means documented safety. Confidence distinguishes incomplete evidence from documented but uncalibrated evidence; it is not a numerical success probability.

`breakout-evidence.js` preserves the distinction between dated reporting and retrospective analyst interpretations of the repository's preseason inputs. Prior rows are not verified evidence. No candidate has a fully sourced production case, so none receives a fully documented confidence designation. The August 28 cutoff is a calendar-date cutoff, not an intraday guarantee; any future evidence ingestion needs publication timestamps for same-day items.

## Historical replay

Run `node diagnostics/backtest-breakout-risk.mjs diagnostics/breakout-risk-results.json`.

Six selected cases span 2023 and 2024. Four known unavailable players receive availability flags: Jonathan Taylor and Kyler Murray in 2023, Nick Chubb and J.J. McCarthy in 2024. Jaxon Smith-Njigba's 2023 wrist recovery remains uncertainty rather than automatic unavailability; he played 17 games. Sam Darnold's 2024 starting opportunity is accepted without inventing production certainty. Outcomes are joined only after evaluation and are never inputs to the evaluator.

These are retrospectively selected sanity checks, not an unbiased backtest or evidence that the model beats ADP. They test health and availability, not predictive accuracy of committee or replacement risk. There are no historical frozen breakout ratings, complete as-of role histories or matching ADP cohorts in this repository. Previous diagnostic runs are simulations of the 2026 app, not prior-season predictive validation. Baseline, proposed-model and ADP performance metrics are therefore explicitly null.

## Promotion requirements

Before changing recommendations or weights, assemble a complete cohort rather than selecting known failures. Each season must contain player identity, position, draft-time ADP, timestamped preseason role/competition/health/production evidence, frozen original scores and full weekly PPR outcomes. Fix success and bust definitions before analysis and measure results by draft price and position. Run chronological train/validation/test seasons, report missed breakouts as well as costly misses, and compare against both the original model and ADP-only. Report calibration and uncertainty intervals. Avoid counting correlated role evidence twice through both situation and breakout inputs.

Until those inputs are available, no performance improvement or calibrated bust probability is claimed and no breakout weight changes are supported.
