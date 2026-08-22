# v0.12.8 Setup, decision diagnostics, and draft grades

## Architecture boundary

All v0.12.8 recommendation snapshots and grade functions are defined after the frozen `renderHistory` boundary. They read existing model outputs but never feed Draft Strength, survival, recommendation labels, simulated choice, owner profiles, or live adaptation. The tier-cliff/denial value remains diagnostic-only with a strategy contribution of zero.

Frozen SHA-256 values:

- football data: `20072848f67de32d2448ff896f0c023407b0dedce7082600536f2c92d091c24a`
- recommendation model: `4580193cce84afbf9f4782fd21829969d6e39cb08cdc348d62643122f223a40b`
- 331-player pool: `c46dffa9c92c851957ad52f4b9543b9028d05e1e63fdc09fffbd5690ffac6b06`

## Randomize Setup

The explicit Setup action shuffles the ten default active 2026 room presets and independently shuffles Cards 1–10. It applies the existing preset function, saves immediately, keeps No Chumps as the sole `my: true` team even when its row moves, and leaves every field editable. It fails visibly when the default pool is not exactly ten usable presets or when a draft already has picks.

Default 2026 room:

1. No Chumps
2. Kickers Are People Too
3. Jerry-Rigged
4. Cam + Guy
5. DA BRONCOS
6. El Pacifesta
7. Pimpin since '99
8. Pelota Negro
9. R Kelly's Golden Showers
10. URINE TROUBLE

The full historical profile catalog remains available in Setup. Custom and replacement owners remain supported and neutral unless explicitly linked.

## Decision snapshot schema

`diagnosticsVersion: 1` adds a top-level `decisionSnapshots` array. One snapshot is captured before each No Chumps pick and contains:

- sequence, ISO timestamp, normalized source (`manual`, `sim`, or `emergency`), raw source, selected player, and whether it was in the displayed top ten;
- pick, round, slot, card, team, and picks until the next No Chumps decision;
- pre-pick roster counts and player IDs, bye distribution, and every intervening owner/card/profile;
- exactly ten ordered candidates with player identity, recommendation rank/label, STR, SURV, planning ADP, and market confidence;
- the exact 57/10/22/11 Draft Strength inputs and contributions;
- decomposed roster utility: position count/redundancy, RB-WR soft balance, contingent value, scarcity, starter timing/completion, and bye adjustment;
- owner-hazard and tier urgency inputs plus the diagnostic-only tier-cliff output and explicit zero strategy contribution.

Emergency picks snapshot the normal listed-player board before the unlisted player is recorded. Undo removes the matching snapshot. Older imports default to an empty optional array.

## Grade model

The deterministic best-lineup evaluator fills 1 QB, 2 RB, 2 WR, 1 TE, 1 RB/WR/TE flex, 1 K, and 1 D/ST from each roster, then grades the remaining bench. Final grades are created only at 170 picks and are read-only.

Component weights:

| Component | Weight |
| --- | ---: |
| Starter Strength | 24% |
| Positional Balance | 12% |
| Bench Depth | 12% |
| Value vs ADP | 14% |
| Scarcity Captured | 8% |
| Upside | 8% |
| Bye Management | 8% |
| Roster Efficiency | 6% |
| Lineup Legality | 6% |
| Waiver Readiness | 2% |

The raw weighted score is retained in every record. The displayed numeric score uses the fixed calibration `80 + (raw - 71.35) × 3`, clamped to 0–100. This calibration changes neither component values nor team ordering. Conventional plus/minus letters use 97/93/90, 87/83/80, 77/73/70, 67/63/60 thresholds.

Every completed team record includes owner/team/profile/preset identity, a stable aggregation key, card, My Team flag, draft ID, completion timestamp, numeric and letter grades, league rank, all component scores, waiver pressure, positional counts, confidence, best value, biggest reach, and a deterministic explanation.

## External aggregation

`aggregate_mock_grades.mjs` reads a directory of completed exports without modifying them. It groups by profile, then preset, then normalized owner name—never by team name alone. It reports numeric score statistics, ranks, top/bottom frequencies, components, score/letter distributions, cards, and waiver pressure. `--actual` adds owner-by-owner actual-vs-mock comparisons and the requested No Chumps highlights.

## Validation

- Initial paired strategy audit: 500 active-self-profile vs 500 neutral-self-profile drafts, identical seeds, **0 selection mismatches**.
- Calibrated grade audit: 500 completed profile-driven drafts / 5,000 team-grade records.
- Displayed numeric score: mean 80.234, median 80.768, standard deviation 5.723, range 57.252–95.650.
- Letter distribution: A 21, A- 115, B+ 400, B 1,160, B- 1,065, C+ 887, C 808, C- 290, D+ 171, D 58, D- 16, F 9.
- No Chumps: average displayed score 86.508 and average league rank 2.232 across 500 mocks.
- Starter legality: 100% in the 500-mock strategy arm.
- Browser: 412×915 portrait and 915×412 landscape; zero horizontal overflow, all Setup labels and Grades navigation usable, 10 final grade cards rendered, no console warnings/errors.
- Automated acceptance: Node and Python suites cover randomization, identity filtering, snapshots, manual/sim/emergency pick and Undo, v0.12.4 migration, deterministic grades, export aggregation/actual comparison, PWA update safety, hashes, and the unchanged 331-player pool.

The calibrated score distribution and component correlations are stored in `v0128-grade-calibration-500.json`.
