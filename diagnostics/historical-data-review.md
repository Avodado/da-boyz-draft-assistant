# Historical data collection and comparison

Research only. Live algorithm, breakout weights and deployment are unchanged.

## Collected sources

- Fantasy Football Calculator PPR ADP for 2022–2025, including provider metadata. Despite the request for 10 teams, the responses identify 12-team, 15-round samples. The window ends September 4, 2022; September 1, 2023; September 1, 2024; and September 1, 2025. These cannot serve as August 28 snapshots.
- DynastyProcess FantasyPros PPR redraft consensus rankings, pinned to Git commits on or before each of the 2022–2024 ADP cutoffs. Each accepted row also requires a scrape date no later than cutoff. Dynasty, best-ball and non-PPR pages are excluded.
- nflverse weekly outcomes for 2021–2024. Prior-year production includes carries, targets, PPR totals and stat-record games. Outcome evaluation uses regular-season weeks 1–17 only, with four-point passing touchdowns as provided by nflverse. These are generic PPR outcomes, not a reconstruction of every DA BOYZ scoring rule.
- nflverse depth charts for 2022–2025 were inspected but excluded from predictors. The 2022–2024 files contain regular-season weeks without publication timestamps. The nominal 2025 file contains 2026 timestamps. Neither provides verified pre-draft roles at the requested cutoff.
- The attempted 2025 weekly player-stat URL returned 404; 2025 is excluded from the benchmark.

Collection scripts retain response hashes and commit provenance. Raw downloads stay in the ignored `diagnostics/historical-data/` directory; result JSON contains source URLs and hashes. This avoids publishing a large upstream data mirror. Source metadata gives retrospective preseason dating; it is not proof of an immutable contemporary capture of ADP. Historical statistics may reflect later corrections.

## Reproduction

1. Run `python diagnostics/collect-historical-data.py`.
2. Run `python diagnostics/collect-historical-rankings.py`.
3. Run `python diagnostics/compare-historical-adp.py`.

The analysis checks source hashes, commit cutoffs, row scrape dates, and that ADP windows end before opening kickoff. Name aliases are explicit; ambiguous identities fail closed. Unmatched records are reported rather than assigned invented outcomes.

## Descriptive benchmark

Cohort: all matched QB/RB/WR/TE with ADP at most 180, not a list selected from known successes or failures. There are 146 player-seasons in 2022, 177 in 2023, and 177 in 2024: 500 total. One 2024 ADP record, Elijah Mitchell, lacks a matching ECR row and is explicitly excluded from the common comparison; this is a limitation, especially because he was a zero-game player. His August 27 injured-reserve transaction is documented at https://49ers.1rmg.com/news-releases/49ers-announce-roster-moves-8-27-24/ and his zero-game season is recorded in the 2025 Chiefs media guide at https://static.www.nfl.com/league/apps/league-site/media-guides/2025/KC.pdf. He must not be silently treated as a successful draft pick or evidence of low risk.

Metric: mean absolute error between predicted position rank and actual PPR position rank within the common cohort. Lower is better. Overall figures are weighted averages of position-specific errors, not cross-position raw-point rankings.

| Season | Player-seasons | ADP rank error | PPR consensus rank error |
|---|---:|---:|---:|
| 2022 | 146 | 9.71 | 9.69 |
| 2023 | 177 | 11.61 | 11.28 |
| 2024 | 177 | 11.97 | 11.63 |

Consensus has slightly lower descriptive rank error in these samples. This is not a significance claim, a new model, or proof that role-risk features improve forecasts. Per-position correlations and top-N PPR totals are in `historical-benchmark-results.json`. No coefficients were fitted or selected after viewing outcomes.

## Original-model and research-model comparison status

The original app reads provisional breakout scores; it contains no algorithm that generates them. Historical frozen breakout/bust/environment scores, situation and confidence inputs, and draft-state contexts do not exist in the supplied repository. Dated market rankings and public game statistics cannot reconstruct those discretionary values. Setting them to neutral values would test a different model. Calling consensus ECR the original model would also be incorrect.

The research layer only adds categorical evidence annotations. It does not yet output a calibrated downside probability or a changed player ranking. Its current live-strategy effect is exactly zero. A numerical performance gain over the original model is therefore not estimable from these artifacts. The output explicitly records both comparisons as unavailable, rather than inventing accuracy metrics.

Remaining requirements: an original scoring specification or archived pre-draft rating sheets for historical cohorts; dated preseason role, competition and health coverage across the cohort; and a numerical research scoring specification fixed before held-out testing. A reconstructed research model can be developed from available prior-season production and dated market data, but must be labeled reconstructed rather than the original model. The current benchmark seasons have now been inspected and cannot be presented as an untouched holdout for subsequent tuning. Reserve additional seasons before fitting any new scoring rule.

The full breakout-model backtest remains incomplete. Do not merge, activate or change weights based on this descriptive benchmark.
