# v0.12.9 NFL-team Affinity Diagnostic

## Executive conclusion

- Repository history contains 71 usable owner-season draft records and 1207 draft slots; 99.8% were mapped to a season-correct NFL team using nflverse Week 1 rosters.
- Historical numeric ADP is not retained, so genuine reach-vs-market analysis is **not available**. The adjusted baseline is a lower-confidence, leave-one-owner-out season/position mix of players drafted by the rest of this league.
- Known-positive validation: AMERICAS TEAM → DAL: strongest detected affinity; Pelota Negro → LV: strongest detected affinity; DA BRONCOS → DEN: weak/non-detected.
- Strong discovery signals meeting the predeclared multi-season threshold: Jerry-Rigged → DET, Cam + Guy → TB, Cam + Guy → BAL, R Kelly's Golden Showers → SF, URINE TROUBLE → DEN, SHOW ME YOUR TDS → MIA, Go Diego Go!!! → NO.
- Recommendation: **proceed only to a shadow/offline implementation experiment**; no production affinity values or hazard changes are justified by this diagnostic alone.
- Production commit: **c6576753f6848cf6031baf618cc8d3a6664aae3a**.

## Source-data audit

| Profile | Owner | Season | Class | Source | Slots | Mapped | Coverage | Acquisition evidence |
|---|---|---:|---|---|---:|---:|---:|---|
| No Chumps | Rick Dauven | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| No Chumps | Rick Dauven | 2022 | A | EXACT_2022_PHOTO | 17 | 17 | 100.0% | drafted player |
| No Chumps | Rick Dauven | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| No Chumps | Rick Dauven | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| No Chumps | Rick Dauven | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| Kickers Are People Too | Lane Ewton | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| Jerry-Rigged | Andrew Morales | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Jerry-Rigged | Andrew Morales | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Jerry-Rigged | Andrew Morales | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| Cam + Guy | Guy/Cam | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Cam + Guy | Guy/Cam | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Cam + Guy | Guy/Cam | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Cam + Guy | Guy/Cam | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Cam + Guy | Guy/Cam | 2025 | E | missing historical_drafts row | 0 | 0 | — | unknown |
| DA BRONCOS | Al McGirl | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| DA BRONCOS | Al McGirl | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| DA BRONCOS | Al McGirl | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| DA BRONCOS | Al McGirl | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| DA BRONCOS | Al McGirl | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| El Pacifesta | Jesse Herrera | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| El Pacifesta | Jesse Herrera | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| Pimpin since '99 | Dylan Walker | 2022 | B | INFERRED_ADP_CARD | 17 | 16 | 94.1% | reconstructed drafted player |
| Pimpin since '99 | Dylan Walker | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Pimpin since '99 | Dylan Walker | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Pimpin since '99 | Dylan Walker | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| Pelota Negro | Daniel | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Pelota Negro | Daniel | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Pelota Negro | Daniel | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Pelota Negro | Daniel | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Pelota Negro | Daniel | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| R Kelly's Golden Showers | Kelly Hoffman | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| R Kelly's Golden Showers | Kelly Hoffman | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| R Kelly's Golden Showers | Kelly Hoffman | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| R Kelly's Golden Showers | Kelly Hoffman | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| R Kelly's Golden Showers | Kelly Hoffman | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| URINE TROUBLE | Todd Lopezi | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| URINE TROUBLE | Todd Lopezi | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| URINE TROUBLE | Todd Lopezi | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| URINE TROUBLE | Todd Lopezi | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| URINE TROUBLE | Todd Lopezi | 2025 | A | EXACT_2025 | 17 | 17 | 100.0% | drafted player |
| Dee Tee | Dameion Taylor | 2025 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| SHOW ME YOUR TDS | Brent Garris | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| SHOW ME YOUR TDS | Brent Garris | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| SHOW ME YOUR TDS | Brent Garris | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| SHOW ME YOUR TDS | Brent Garris | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| SHOW ME YOUR TDS | Brent Garris | 2025 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| AMERICAS TEAM | Alejandro Tovar | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| AMERICAS TEAM | Alejandro Tovar | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| AMERICAS TEAM | Alejandro Tovar | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| AMERICAS TEAM | Alejandro Tovar | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| AMERICAS TEAM | Alejandro Tovar | 2025 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Easy-E Dubs | Eddie Zuniga | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Easy-E Dubs | Eddie Zuniga | 2025 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Lumber Jack | Jack McGirl | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Lumber Jack | Jack McGirl | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Lumber Jack | Jack McGirl | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Lumber Jack | Jack McGirl | 2025 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Blonx Bombers | Guy | 2021 | B | INFERRED_ADP_CARD | 17 | 16 | 94.1% | reconstructed drafted player |
| Blonx Bombers | Guy | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Blonx Bombers | Guy | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Blonx Bombers | Guy | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Blonx Bombers | Guy | 2025 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Go Diego Go!!! | Diego Ruiz | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Go Diego Go!!! | Diego Ruiz | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Go Diego Go!!! | Diego Ruiz | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Go Diego Go!!! | Diego Ruiz | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| Go Diego Go!!! | Diego Ruiz | 2025 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| NALGATORZ | Raul Urias | 2021 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| NALGATORZ | Raul Urias | 2022 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| NALGATORZ | Raul Urias | 2023 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| NALGATORZ | Raul Urias | 2024 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |
| NALGATORZ | Raul Urias | 2025 | B | INFERRED_ADP_CARD | 17 | 17 | 100.0% | reconstructed drafted player |

Class totals: B=61, A=10, E=1. No Week 1 or final **fantasy** rosters, waiver markers, trade markers, historical player-team fields, or historical numeric ADP values exist in the repository.
The external nflverse Week 1 roster files were used only to map a historical player name to that season's NFL team. Current 2026 team and ADP data were not back-applied.
Position audit: 80 of 1205 mapped names (6.6%) disagree with the same-index embedded position sequence, so the season-correct roster position—not the misaligned position array—is used for controls. 2 player rows remain unresolved and are listed in the JSON.

## Methodology

1. Treat each embedded `historical_drafts` row as draft evidence, classifying `EXACT_*` as A and `INFERRED_ADP_CARD` as B.
2. Map player names to season-specific Week 1 NFL teams and positions; map D/ST rows from their explicit franchise names. The mapped position is used because embedded player and position arrays are not reliably aligned.
3. For each owner-season, calculate raw NFL-team counts and shares.
4. Estimate expected counts from the other owners' mapped drafted players that season, matched within fantasy position. This controls position mix but is not a true ADP-weighted player-pool baseline.
5. Aggregate observed, expected, excess slots, ratios, standardized residuals, persistence, recency, source quality, and skill-position-only evidence across seasons.
6. Apply a conservative multiple-comparison discovery gate: at least five observed players, three positive seasons, two top-three seasons, three usable seasons, HIGH confidence, ratio ≥1.75, excess ≥3, and z ≥2.5.
7. Reach metrics remain null because pick slots exist but historical market ADP does not.

## Known-positive validation

| Validation | Stored owner | Rank | Obs | Share | Expected | Ratio | Excess | z | Positive seasons | Skill ratio | Reach evidence | Confidence | Result |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|---|---|
| AMERICAS TEAM → DAL | Alejandro Tovar | 1 | 13 | 15.3% | 2.779 | 4.678x | +10.221 | 6.278 | 5/5 | 4.445x | unavailable | HIGH (92.6) | strongest detected affinity |
| Pelota Negro → LV | Daniel | 1 | 15 | 17.6% | 2.186 | 6.862x | +12.814 | 8.897 | 5/5 | 5.484x | unavailable | HIGH (94.1) | strongest detected affinity |
| DA BRONCOS → DEN | Al McGirl | 13 | 4 | 4.7% | 3.296 | 1.214x | +0.704 | 0.400 | 3/5 | 1.303x | unavailable | HIGH (74.1) | weak/non-detected |

Methodology weakness: DA BRONCOS → DEN was not independently detected in the top three; the historical evidence/baseline did not recover the supplied positive case.

## All-owner summary

| Profile | Owner | Seasons | Slots | Distinct NFL teams | Avg max concentration | Top association | Obs/expected | z | Confidence | Meaningful signal |
|---|---|---:|---:|---:|---:|---|---:|---:|---|---|
| No Chumps | Rick Dauven | 5/5 | 85 | 32 | 12.9% | ARI | 2.220x | 2.073 | HIGH | none |
| Kickers Are People Too | Lane Ewton | 1/1 | 17 | 13 | 17.6% | LAR | 8.500x | 3.678 | MEDIUM | none |
| Jerry-Rigged | Andrew Morales | 3/3 | 51 | 26 | 11.8% | DET | 2.784x | 2.694 | HIGH | DET |
| Cam + Guy | Guy/Cam | 4/5 | 68 | 27 | 14.7% | TB | 4.203x | 4.243 | HIGH | TB, BAL |
| DA BRONCOS | Al McGirl | 5/5 | 85 | 27 | 15.3% | BUF | 2.420x | 2.664 | HIGH | none |
| El Pacifesta | Jesse Herrera | 2/2 | 34 | 18 | 14.7% | GB | 4.640x | 2.985 | HIGH | none |
| Pimpin since '99 | Dylan Walker | 4/4 | 67 | 28 | 16.4% | DAL | 2.434x | 2.314 | HIGH | none |
| Pelota Negro | Daniel | 5/5 | 85 | 27 | 17.6% | LV | 6.862x | 8.897 | HIGH | LV, MIN |
| R Kelly's Golden Showers | Kelly Hoffman | 5/5 | 85 | 30 | 15.3% | SF | 4.129x | 5.229 | HIGH | SF |
| URINE TROUBLE | Todd Lopezi | 5/5 | 85 | 27 | 17.6% | DEN | 3.793x | 4.647 | HIGH | DEN |
| Dee Tee | Dameion Taylor | 1/1 | 17 | 11 | 17.6% | SF | 4.798x | 3.065 | MEDIUM | none |
| SHOW ME YOUR TDS | Brent Garris | 5/5 | 85 | 30 | 14.1% | MIA | 3.278x | 4.086 | HIGH | MIA |
| AMERICAS TEAM | Alejandro Tovar | 5/5 | 85 | 28 | 17.6% | DAL | 4.678x | 6.278 | HIGH | DAL, PIT |
| Easy-E Dubs | Eddie Zuniga | 2/2 | 34 | 19 | 20.6% | MIN | 6.355x | 5.301 | MEDIUM | none |
| Lumber Jack | Jack McGirl | 4/4 | 68 | 28 | 13.2% | JAX | 2.318x | 1.987 | HIGH | none |
| Blonx Bombers | Guy | 5/5 | 84 | 29 | 15.5% | LAR | 2.568x | 2.462 | HIGH | none |
| Go Diego Go!!! | Diego Ruiz | 5/5 | 85 | 28 | 11.8% | NO | 3.115x | 2.999 | HIGH | NO |
| NALGATORZ | Raul Urias | 5/5 | 85 | 28 | 16.5% | CAR | 5.515x | 3.883 | HIGH | none |

## Top five adjusted associations per owner

- **No Chumps:** ARI 6/2.702 (2.220x, 7.1%, present 4/5, raw leader 2/5, z 2.073, 3/5 positive seasons, HIGH); IND 4/1.565 (2.556x, 4.7%, present 3/5, raw leader 0/5, z 1.987, 3/5 positive seasons, HIGH); NE 4/1.824 (2.194x, 4.7%, present 3/5, raw leader 1/5, z 1.667, 3/5 positive seasons, HIGH); TEN 4/1.817 (2.201x, 4.7%, present 3/5, raw leader 1/5, z 1.649, 3/5 positive seasons, HIGH); HOU 4/1.909 (2.096x, 4.7%, present 3/5, raw leader 1/5, z 1.548, 3/5 positive seasons, HIGH)
- **Kickers Are People Too:** LAR 2/0.235 (8.500x, 11.8%, present 1/1, raw leader 0/1, z 3.678, 1/1 positive seasons, MEDIUM); CHI 2/0.303 (6.599x, 11.8%, present 1/1, raw leader 0/1, z 3.123, 1/1 positive seasons, MEDIUM); DEN 3/0.728 (4.123x, 17.6%, present 1/1, raw leader 1/1, z 2.749, 1/1 positive seasons, INSUFFICIENT); CAR 1/0.112 (8.900x, 5.9%, present 1/1, raw leader 0/1, z 2.678, 1/1 positive seasons, INSUFFICIENT); NYG 1/0.400 (2.501x, 5.9%, present 1/1, raw leader 0/1, z 0.967, 1/1 positive seasons, INSUFFICIENT)
- **Jerry-Rigged:** DET 6/2.155 (2.784x, 11.8%, present 3/3, raw leader 3/3, z 2.694, 3/3 positive seasons, HIGH); DAL 4/1.966 (2.035x, 7.8%, present 3/3, raw leader 1/3, z 1.486, 3/3 positive seasons, HIGH); HOU 3/1.548 (1.938x, 5.9%, present 3/3, raw leader 0/3, z 1.201, 3/3 positive seasons, HIGH); SF 3/1.751 (1.714x, 5.9%, present 2/3, raw leader 1/3, z 0.968, 2/3 positive seasons, MEDIUM); PHI 3/1.767 (1.698x, 5.9%, present 3/3, raw leader 0/3, z 0.951, 3/3 positive seasons, HIGH)
- **Cam + Guy:** TB 7/1.665 (4.203x, 10.3%, present 4/4, raw leader 1/4, z 4.243, 4/4 positive seasons, HIGH); BAL 7/2.410 (2.904x, 10.3%, present 3/4, raw leader 3/4, z 3.053, 3/4 positive seasons, HIGH); BUF 6/2.570 (2.334x, 8.8%, present 3/4, raw leader 2/4, z 2.203, 3/4 positive seasons, HIGH); SEA 4/2.394 (1.671x, 5.9%, present 4/4, raw leader 0/4, z 1.078, 4/4 positive seasons, HIGH); ATL 3/1.713 (1.751x, 4.4%, present 2/4, raw leader 0/4, z 1.003, 2/4 positive seasons, HIGH)
- **DA BRONCOS:** BUF 8/3.306 (2.420x, 9.4%, present 5/5, raw leader 1/5, z 2.664, 5/5 positive seasons, HIGH); PIT 6/2.444 (2.455x, 7.1%, present 4/5, raw leader 1/5, z 2.330, 4/5 positive seasons, HIGH); NYG 4/1.536 (2.604x, 4.7%, present 4/5, raw leader 0/5, z 2.038, 4/5 positive seasons, HIGH); ARI 6/2.997 (2.002x, 7.1%, present 4/5, raw leader 1/5, z 1.806, 3/5 positive seasons, HIGH); WAS 4/1.776 (2.253x, 4.7%, present 2/5, raw leader 1/5, z 1.712, 2/5 positive seasons, HIGH)
- **El Pacifesta:** GB 3/0.647 (4.640x, 8.8%, present 2/2, raw leader 1/2, z 2.985, 2/2 positive seasons, HIGH); DAL 4/1.267 (3.156x, 11.8%, present 2/2, raw leader 1/2, z 2.485, 2/2 positive seasons, MEDIUM); CLE 3/0.820 (3.658x, 8.8%, present 1/2, raw leader 1/2, z 2.454, 1/2 positive seasons, MEDIUM); KC 4/1.368 (2.925x, 11.8%, present 2/2, raw leader 1/2, z 2.323, 2/2 positive seasons, MEDIUM); CHI 3/1.143 (2.625x, 8.8%, present 1/2, raw leader 1/2, z 1.778, 1/2 positive seasons, MEDIUM)
- **Pimpin since '99:** DAL 6/2.465 (2.434x, 9.0%, present 4/4, raw leader 1/4, z 2.314, 4/4 positive seasons, HIGH); DET 6/2.628 (2.283x, 9.0%, present 2/4, raw leader 2/4, z 2.136, 2/4 positive seasons, HIGH); NE 3/1.317 (2.278x, 4.5%, present 2/4, raw leader 0/4, z 1.505, 2/4 positive seasons, HIGH); KC 5/2.643 (1.892x, 7.5%, present 3/4, raw leader 1/4, z 1.490, 3/4 positive seasons, HIGH); LAC 3/1.692 (1.773x, 4.5%, present 2/4, raw leader 1/4, z 1.028, 2/4 positive seasons, HIGH)
- **Pelota Negro:** LV 15/2.186 (6.862x, 17.6%, present 5/5, raw leader 5/5, z 8.897, 5/5 positive seasons, HIGH); MIN 7/2.279 (3.072x, 8.2%, present 4/5, raw leader 2/5, z 3.206, 4/5 positive seasons, HIGH); JAX 6/2.345 (2.559x, 7.1%, present 4/5, raw leader 1/5, z 2.438, 4/5 positive seasons, HIGH); PHI 6/2.470 (2.429x, 7.1%, present 3/5, raw leader 1/5, z 2.301, 3/5 positive seasons, HIGH); CIN 5/3.036 (1.647x, 5.9%, present 3/5, raw leader 1/5, z 1.161, 3/5 positive seasons, HIGH)
- **R Kelly's Golden Showers:** SF 11/2.664 (4.129x, 12.9%, present 5/5, raw leader 3/5, z 5.229, 5/5 positive seasons, HIGH); SEA 6/2.751 (2.181x, 7.1%, present 4/5, raw leader 1/5, z 2.024, 4/5 positive seasons, HIGH); PIT 5/2.406 (2.078x, 5.9%, present 4/5, raw leader 0/5, z 1.710, 4/5 positive seasons, HIGH); CIN 5/2.956 (1.691x, 5.9%, present 3/5, raw leader 1/5, z 1.222, 3/5 positive seasons, HIGH); DET 5/3.166 (1.580x, 5.9%, present 4/5, raw leader 1/5, z 1.066, 4/5 positive seasons, HIGH)
- **URINE TROUBLE:** DEN 10/2.637 (3.793x, 11.8%, present 5/5, raw leader 2/5, z 4.647, 5/5 positive seasons, HIGH); LV 8/2.653 (3.015x, 9.4%, present 4/5, raw leader 2/5, z 3.356, 4/5 positive seasons, HIGH); BUF 7/3.350 (2.090x, 8.2%, present 4/5, raw leader 1/5, z 2.046, 4/5 positive seasons, HIGH); NYJ 5/2.332 (2.144x, 5.9%, present 2/5, raw leader 2/5, z 1.786, 2/5 positive seasons, HIGH); WAS 4/1.835 (2.180x, 4.7%, present 3/5, raw leader 0/5, z 1.637, 3/5 positive seasons, HIGH)
- **Dee Tee:** SF 3/0.625 (4.798x, 17.6%, present 1/1, raw leader 1/1, z 3.065, 1/1 positive seasons, MEDIUM); BAL 2/0.357 (5.601x, 11.8%, present 1/1, raw leader 0/1, z 2.786, 1/1 positive seasons, INSUFFICIENT); PHI 2/0.524 (3.814x, 11.8%, present 1/1, raw leader 0/1, z 2.088, 1/1 positive seasons, INSUFFICIENT); ARI 2/0.578 (3.460x, 11.8%, present 1/1, raw leader 0/1, z 1.915, 1/1 positive seasons, INSUFFICIENT); DET 2/0.860 (2.326x, 11.8%, present 1/1, raw leader 0/1, z 1.268, 1/1 positive seasons, INSUFFICIENT)
- **SHOW ME YOUR TDS:** MIA 10/3.050 (3.278x, 11.8%, present 5/5, raw leader 3/5, z 4.086, 5/5 positive seasons, HIGH); LAC 4/1.950 (2.051x, 4.7%, present 4/5, raw leader 0/5, z 1.502, 4/5 positive seasons, HIGH); BAL 5/2.985 (1.675x, 5.9%, present 4/5, raw leader 0/5, z 1.200, 3/5 positive seasons, HIGH); PHI 4/2.592 (1.543x, 4.7%, present 2/5, raw leader 1/5, z 0.895, 2/5 positive seasons, HIGH); CLE 4/2.784 (1.437x, 4.7%, present 3/5, raw leader 1/5, z 0.748, 3/5 positive seasons, HIGH)
- **AMERICAS TEAM:** DAL 13/2.779 (4.678x, 15.3%, present 5/5, raw leader 4/5, z 6.278, 5/5 positive seasons, HIGH); PIT 7/2.151 (3.255x, 8.2%, present 4/5, raw leader 0/5, z 3.384, 4/5 positive seasons, HIGH); TEN 4/1.704 (2.347x, 4.7%, present 4/5, raw leader 0/5, z 1.796, 4/5 positive seasons, HIGH); ATL 4/2.051 (1.950x, 4.7%, present 3/5, raw leader 1/5, z 1.389, 3/5 positive seasons, HIGH); LV 5/2.964 (1.687x, 5.9%, present 4/5, raw leader 1/5, z 1.217, 4/5 positive seasons, HIGH)
- **Easy-E Dubs:** MIN 6/0.944 (6.355x, 17.6%, present 2/2, raw leader 1/2, z 5.301, 2/2 positive seasons, MEDIUM); NYJ 3/1.028 (2.919x, 8.8%, present 2/2, raw leader 0/2, z 1.992, 2/2 positive seasons, MEDIUM); NE 2/0.572 (3.495x, 5.9%, present 2/2, raw leader 0/2, z 1.922, 2/2 positive seasons, MEDIUM); WAS 3/1.109 (2.704x, 8.8%, present 2/2, raw leader 0/2, z 1.837, 2/2 positive seasons, MEDIUM); GB 2/0.888 (2.251x, 5.9%, present 2/2, raw leader 0/2, z 1.201, 2/2 positive seasons, MEDIUM)
- **Lumber Jack:** JAX 5/2.157 (2.318x, 7.4%, present 3/4, raw leader 2/4, z 1.987, 3/4 positive seasons, HIGH); DEN 5/2.341 (2.136x, 7.4%, present 2/4, raw leader 2/4, z 1.783, 2/4 positive seasons, HIGH); NYJ 4/2.330 (1.717x, 5.9%, present 2/4, raw leader 2/4, z 1.123, 2/4 positive seasons, HIGH); CIN 4/2.349 (1.703x, 5.9%, present 2/4, raw leader 1/4, z 1.107, 2/4 positive seasons, HIGH); LV 4/2.381 (1.680x, 5.9%, present 3/4, raw leader 1/4, z 1.081, 3/4 positive seasons, HIGH)
- **Blonx Bombers:** LAR 6/2.337 (2.568x, 7.1%, present 3/5, raw leader 1/5, z 2.462, 3/5 positive seasons, HIGH); IND 4/1.524 (2.625x, 4.8%, present 3/5, raw leader 1/5, z 2.048, 3/5 positive seasons, HIGH); HOU 4/1.826 (2.190x, 4.8%, present 3/5, raw leader 1/5, z 1.644, 3/5 positive seasons, HIGH); TB 4/2.473 (1.618x, 4.8%, present 3/5, raw leader 1/5, z 0.997, 3/5 positive seasons, HIGH); MIA 5/3.300 (1.515x, 6.0%, present 3/5, raw leader 1/5, z 0.963, 3/5 positive seasons, HIGH)
- **Go Diego Go!!!:** NO 6/1.926 (3.115x, 7.1%, present 4/5, raw leader 2/5, z 2.999, 4/5 positive seasons, HIGH); WAS 5/1.998 (2.502x, 5.9%, present 4/5, raw leader 1/5, z 2.172, 4/5 positive seasons, HIGH); IND 4/1.548 (2.583x, 4.7%, present 3/5, raw leader 1/5, z 2.009, 3/5 positive seasons, HIGH); NYG 4/1.585 (2.523x, 4.7%, present 3/5, raw leader 1/5, z 1.959, 3/5 positive seasons, HIGH); LAC 4/1.936 (2.067x, 4.7%, present 2/5, raw leader 2/5, z 1.517, 2/5 positive seasons, HIGH)
- **NALGATORZ:** CAR 4/0.725 (5.515x, 4.7%, present 3/5, raw leader 0/5, z 3.883, 3/5 positive seasons, HIGH); DEN 6/3.087 (1.944x, 7.1%, present 4/5, raw leader 1/5, z 1.702, 4/5 positive seasons, HIGH); TB 5/2.491 (2.007x, 5.9%, present 3/5, raw leader 0/5, z 1.631, 3/5 positive seasons, HIGH); MIN 5/2.530 (1.976x, 5.9%, present 3/5, raw leader 1/5, z 1.591, 3/5 positive seasons, HIGH); CLE 5/2.709 (1.845x, 5.9%, present 3/5, raw leader 1/5, z 1.429, 3/5 positive seasons, HIGH)

## Strongest detected affinity signals

- Jerry-Rigged: historical roster affinity toward DET; 6 players (11.8%) vs 2.155 expected, 2.784x, 3/3 positive seasons, HIGH; historical reach evidence unavailable.
- Cam + Guy: historical roster affinity toward TB; 7 players (10.3%) vs 1.665 expected, 4.203x, 4/4 positive seasons, HIGH; historical reach evidence unavailable.
- Cam + Guy: historical roster affinity toward BAL; 7 players (10.3%) vs 2.410 expected, 2.904x, 3/4 positive seasons, HIGH; historical reach evidence unavailable.
- R Kelly's Golden Showers: historical roster affinity toward SF; 11 players (12.9%) vs 2.664 expected, 4.129x, 5/5 positive seasons, HIGH; historical reach evidence unavailable.
- URINE TROUBLE: historical roster affinity toward DEN; 10 players (11.8%) vs 2.637 expected, 3.793x, 5/5 positive seasons, HIGH; historical reach evidence unavailable.
- SHOW ME YOUR TDS: historical roster affinity toward MIA; 10 players (11.8%) vs 3.050 expected, 3.278x, 5/5 positive seasons, HIGH; historical reach evidence unavailable.
- Go Diego Go!!!: historical roster affinity toward NO; 6 players (7.1%) vs 1.926 expected, 3.115x, 4/5 positive seasons, HIGH; historical reach evidence unavailable.

## Position-controlled detail for validation and discovery signals

| Profile / NFL team | QB obs/exp | RB obs/exp | WR obs/exp | TE obs/exp | K obs/exp | D/ST obs/exp | Skill-only ratio |
|---|---:|---:|---:|---:|---:|---:|---:|
| AMERICAS TEAM → DAL | 2/0.277 | 1/0.845 | 4/0.968 | 3/0.159 | 0/0.376 | 3/0.153 | 4.445x |
| Pelota Negro → LV | 2/0.160 | 3/0.589 | 3/0.569 | 3/0.688 | 2/0.180 | 2/0.000 | 5.484x |
| DA BRONCOS → DEN | 0/0.354 | 1/0.760 | 1/0.566 | 1/0.622 | 0/0.522 | 1/0.472 | 1.303x |
| Jerry-Rigged → DET | 2/0.268 | 2/0.508 | 0/0.741 | 2/0.256 | 0/0.211 | 0/0.171 | 3.384x |
| Cam + Guy → TB | 1/0.174 | 1/0.274 | 4/0.887 | 1/0.153 | 0/0.125 | 0/0.053 | 4.705x |
| Cam + Guy → BAL | 2/0.392 | 2/0.683 | 0/0.608 | 0/0.175 | 2/0.113 | 1/0.439 | 2.153x |
| R Kelly's Golden Showers → SF | 2/0.351 | 2/0.408 | 3/1.151 | 1/0.271 | 0/0.239 | 3/0.244 | 3.666x |
| URINE TROUBLE → DEN | 0/0.269 | 5/0.562 | 1/0.619 | 1/0.480 | 2/0.196 | 1/0.510 | 3.627x |
| SHOW ME YOUR TDS → MIA | 1/0.357 | 2/0.671 | 4/1.019 | 1/0.296 | 2/0.255 | 0/0.452 | 3.414x |
| Go Diego Go!!! → NO | 0/0.223 | 1/0.916 | 2/0.545 | 1/0.063 | 0/0.000 | 2/0.180 | 2.290x |

## Negative / possible avoidance signals

No pairing cleared the conservative negative-affinity threshold.

## ADP/reach and source-confidence caveats

- Pick round, card, and reconstructed order exist, but season-specific numeric ADP does not. Average pick-minus-ADP, median reach, 5+/10+ reach rates, and early/late reach affinity are therefore null in the JSON.
- `INFERRED_ADP_CARD` indicates how many draft orders were reconstructed, but does not retain the numeric ADP used. Reverse-engineering that ADP would invent precision.
- The leave-one-owner-out league-drafted baseline controls season and position, but collective league preferences can contaminate it and it does not represent the full draftable player pool.
- Exact draft evidence and reconstructed draft evidence are kept separate in the inventory and confidence model.
- Neutral / No History receives no inferred affinity because it has no historical rows.

## Potential future owner-hazard architecture

Do not implement yet. A validated signal could later enter only the opponent selection probability:

`ownerPlayerHazard × affinityMultiplier(owner, player.nfl_team)`

It must not change intrinsic value, No Chumps Draft Strength, situation score, ADP, or scarcity. Required safeguards:

- shrink small samples toward 1.0;
- weight by diagnostic confidence and source quality;
- cap the multiplier;
- reduce the effect after the owner already drafts several players from that NFL team;
- prevent double-counting with live adaptation;
- let current-draft evidence override history;
- use 1.0 for Neutral / No History;
- shadow-test against held-out seasons before production consideration.

## Live-adaptation interaction

Current live adaptation responds to positional selection and roster construction. It can notice that an owner drafted two WRs, but it has no NFL-team-specific state and cannot distinguish two Cowboys from two WRs on unrelated teams. A future affinity signal would add team-specific player hazard only. Live evidence should dominate because it is more current; historical affinity should remain a small prior and decay as current-room evidence accumulates.

## Recommendation

Evidence is adequate for a separate offline/shadow hazard experiment, but not for production. At least two known-positive cases were recovered in the top three and player-team mapping coverage exceeded 90%; historical ADP reach evidence is still absent, so any experiment must use conservative shrinkage and held-out validation.

No production file, profile, football datum, grade, recommendation, hazard, live-adaptation rule, export path, or PWA artifact was changed.
