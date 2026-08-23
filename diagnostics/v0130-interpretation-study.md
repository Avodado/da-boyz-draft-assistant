# v0.13.0 interpretation-layer validation

## Scope and method

This study validates the optional draft-night interpretation layer in PR #10. It does not change Draft Strength, Survival, recommendation labels, the simulator, player data, or the selected player.

`v0130-interpretation-study.mjs` ran 500 complete 170-pick mocks with deterministic seeds `130000..130499`. No Chumps occupied each draft card exactly 50 times. At each of its 17 picks, the runner recorded the frozen core simulator's selection and the top five candidates, then applied the interpretation layer. This produced 8,500 decision contexts and 85,000 total selections.

Reproduce the full study (the JSON is intentionally not committed):

```powershell
node diagnostics/v0130-interpretation-study.mjs --mocks 500 --workers 10 --output v0130-interpretation-study-500.json
```

The first pass found two advisory false-positive paths: generic roster utility duplicated a component already represented in Draft Strength, and general bye advice could lean from a skill player to a kicker or defense. Those paths were removed. The immutable recorded contexts were then reinterpreted with:

```powershell
node diagnostics/v0130-interpretation-study.mjs --reprocess v0130-interpretation-study-500.json --output v0130-interpretation-study-500-corrected.json
```

The original and corrected files have identical selection records. All 8,500 recorded No Chumps selections equal candidate #1. Reprocessing therefore changed only advisory labels.

## Corrected results

| Interpretation | Decisions | Rate |
|---|---:|---:|
| CLEAR | 3,502 | 41.20% |
| TIE | 2,457 | 28.91% |
| CLOSE | 1,688 | 19.86% |
| REQUIRED | 570 | 6.71% |
| LEAN_ALT | 283 | 3.33% |

The alternative was candidate #2 in 241 cases, #3 in 35, and #4 in 7. No advisory reached candidate #5 in this run. Mean Draft Strength gap was 1.025; maximum was 1.997, inside the documented inclusive 2.0 threshold. Twenty-one cases combined more than one specific rule.

| Advisory reason | Count | Share of 8,500 decisions |
|---|---:|---:|
| Bye concentration (Round 9+) | 171 | 2.01% |
| Second K/DST | 32 | 0.38% |
| RB5 needs WR | 31 | 0.36% |
| Early K/DST | 19 | 0.22% |
| Late zero TE | 19 | 0.22% |
| Backup same-position bye coverage | 17 | 0.20% |
| WR7 to contingent RB5 | 15 | 0.18% |

Reason counts can exceed advisory count because rules may stack. The correction removed all 141 generic roster-utility reasons and 22 net advisories. It also prevents any skill-player #1 from being displaced by K/DST. Required endgame K/DST remains authoritative.

## Human review sample

Twenty contexts were read against the entering roster, top five, Draft Strength (DS), Survival (SV), bye context, and stated reason. Candidate notation below is `name position DS/SV/bye`; roster notation gives position counts and its largest bye clusters. Five first-pass cases that motivated the correction are included so the false-positive judgment is auditable.

### Five obviously good advisories

| Seed/card/round | Roster entering pick | Top five candidates | Why it fired | Judgment |
|---|---|---|---|---|
| 130012/3/R12 | QB2 RB3 WR5 TE1; B5/B6/B7/B10 ×2 | Rams D/ST 54.4/22/B11; Jake Ferguson TE 53.3/39/B14; Aaron Jones RB 52.6/43/B6; Vikings D/ST 51.9/22/B6; J. Croskey-Merritt RB 51.9/51/B7 | Early D/ST; Ferguson #2, gap 1.15 | **GOOD ADVISORY** — preserves skill upside. |
| 130044/5/R10 | QB1 RB5 WR3 TE0; B7 ×3, B6/B10/B11 ×2 | Justin Herbert QB 60.3/5/B7; Travis Kelce TE 59.8/29/B5; Alec Pierce WR 58.3/20/B13; Jaxson Dart QB 57.1/20/B8; Quentin Johnston WR 55.7/22/B7 | Empty TE late; Kelce #2, gap 0.47 | **GOOD ADVISORY** — meaningful lineup/scarcity need. |
| 130060/1/R16 | QB2 RB5 WR5 TE2 K1; B10/B11 ×3, B5/B7/B13 ×2 | Jake Bates K 55.0/15/B6; D. Stribling WR 53.2/24/B8; 49ers D/ST 51.4/23/B8; Packers D/ST 50.2/24/B11; Tyler Allgeier RB 50.1/26/B14 | Would be K2; Stribling #2, gap 1.72 | **GOOD ADVISORY** — avoids a discretionary second kicker. |
| 130084/5/R16 | QB2 RB4 WR6 TE1 K1 D/ST1; B7 ×4, B6 ×3 | Rashid Shaheed WR 58.3/21/B11; Tyler Allgeier RB 56.6/26/B14; Alvin Kamara RB 55.1/27/B8; D. Stribling WR 55.1/27/B8; Jake Bates K 54.6/21/B6 | WR7 vs contingent RB5; Allgeier #2, gap 1.68 | **GOOD ADVISORY** — useful upside diversification. |
| 130160/1/R17 | QB2 RB4 WR6 TE2 K1 D/ST1; B6/B7/B10/B11/B14 ×2 | Rashid Shaheed WR 56.5/50/B11; Tyjae Spears RB 56.2/50/B9; D. Stribling WR 54.0/50/B8; Tyler Allgeier RB 53.5/50/B14; Jayden Higgins WR 52.2/50/B8 | WR7 vs contingent RB5; Spears #2, gap 0.32 | **GOOD ADVISORY** — true endgame near tie. |

### Five close or ambiguous advisories

| Seed/card/round | Roster entering pick | Top five candidates | Why it fired | Judgment |
|---|---|---|---|---|
| 130256/7/R13 | QB2 RB4 WR4 TE1; B7/B11/B13 ×2 | Jake Ferguson TE 56.6/19/B14; Isaiah Likely TE 55.2/31/B8; Dalton Kincaid TE 54.8/23/B7; Rachaad White RB 54.4/32/B7; Xavier Worthy WR 51.6/41/B5 | TE2 bye coverage; Likely #2, gap 1.45 | **REASONABLE BUT OPTIONAL** — $5 waiver cost supports depth, but manager preference can decide. |
| 130396/7/R14 | QB1 RB4 WR6 TE2; B7 ×4, B11 ×3, B10 ×2 | Rachaad White RB 57.1/13/B7; Xavier Worthy WR 55.2/19/B5; Patriots D/ST 53.8/16/B11; Steelers D/ST 53.1/24/B9; Eagles D/ST 52.6/30/B10 | Bye concentration; Worthy #2, gap 1.91 | **REASONABLE BUT OPTIONAL** — near the boundary, clearly displayed. |
| 130097/8/R13 | QB1 RB5 WR4 TE1; B10 ×4, B6/B14 ×2 | Bo Nix QB 56.8/32/B10; Matthew Golden WR 54.9/44/B11; Isaiah Likely TE 54.1/40/B8; Cameron Dicker K 51.2/49/B7; Jordan Mason RB 50.8/48/B6 | Bye concentration; Golden #2, gap 1.89 | **REASONABLE BUT OPTIONAL** — subjective cross-position comparison. |
| 130213/4/R9 | QB2 RB2 WR4 TE0; B6 ×3 | Sam LaPorta TE 61.4/0/B6; Tony Pollard RB 60.9/1/B9; Rico Dowdle RB 57.7/3/B9; J.K. Dobbins RB 55.8/22/B10; Seahawks D/ST 52.3/4/B11 | Bye concentration; Pollard #2, gap 0.49 | **REASONABLE BUT OPTIONAL** — Round 9 gate prevents an early firing, but TE need argues for #1. |
| 130499/10/R13 | QB2 RB5 WR3 TE2; B11 ×3, B6/B7 ×2 | Matthew Golden WR 51.7/89/B11; Deebo Samuel WR 49.8/93/B8; Xavier Worthy WR 49.6/92/B5; Romeo Doubs WR 49.2/91/B11; Lions D/ST 46.0/94/B6 | Bye concentration; Deebo #2, gap 1.92 | **REASONABLE BUT OPTIONAL** — same-position tiebreak at the edge. |

### Five potentially bad first-pass advisories

| Seed/card/round | Roster entering pick | Top five candidates | Why it fired in pass one | Judgment / correction |
|---|---|---|---|---|
| 130044/5/R15 | QB2 RB5 WR5 TE2; B7 ×4, B6/B10/B11 ×3 | Romeo Doubs WR 60.8/1/B11; Lions D/ST 58.9/2/B6; Fairbairn K 58.4/2/B8; Jalen Coker WR 56.7/4/B5; Chargers D/ST 52.1/6/B7 | Bye + generic utility leaned Lions #2, gap 1.83 | **NEEDS RULE CHANGE** — a healthy skill #1 should not yield to D/ST. Corrected to CLOSE. |
| 130080/1/R15 | QB2 RB5 WR4 TE2 D/ST1; B11 ×4, B6/B7 ×2 | Rashid Shaheed WR 53.9/36/B11; Chargers D/ST 53.5/28/B7; D. Stribling WR 51.5/44/B8; Jake Bates K 51.0/32/B6; Harrison Mevis K 50.1/31/B11 | Bye leaned Chargers #2, gap 0.39 | **NEEDS RULE CHANGE** — skill-to-specialist false positive. Corrected to TIE. |
| 130456/7/R16 | QB2 RB5 WR5 TE2 K1; B11 ×4, B7 ×3, B6/B8/B10 ×2 | Rashid Shaheed WR 58.5/12/B11; Jake Bates K 56.5/8/B6; D. Stribling WR 53.9/17/B8; Tyjae Spears RB 52.7/18/B9; Tyler Allgeier RB 52.0/19/B14 | Bye leaned Bates #2, gap 1.98 | **NEEDS RULE CHANGE** — would create K2 over a skill #1. Corrected to CLOSE. |
| 130169/10/R16 | QB2 RB5 WR5 TE2 K1; B11/B10/B7 ×3 | Zach Charbonnet RB 56.3/21/B11; Jake Bates K 54.5/23/B6; Tyjae Spears RB 52.7/36/B9; Chris Rodriguez RB 51.8/38/B7; Tyler Allgeier RB 51.4/38/B14 | Bye leaned Bates #2, gap 1.83 | **NEEDS RULE CHANGE** — same skill-to-specialist defect. Corrected to CLOSE. |
| 130221/2/R8 | QB1 RB2 WR4 TE1; B10 ×3 | Rome Odunze WR 63.7/0/B10; Parker Washington WR 63.2/0/B7; Marvin Harrison WR 61.9/1/B14; Brian Thomas WR 61.2/2/B7; Chuba Hubbard RB 55.7/12/B5 | Early bye + duplicated utility leaned Parker #2, gap 0.54 | **NEEDS RULE CHANGE** — too early and double-counted utility. Corrected to TIE. |

### Five unusual edge cases after correction

| Seed/card/round | Roster entering pick | Top five candidates | Why it fired | Judgment |
|---|---|---|---|---|
| 130172/3/R12 | QB2 RB4 WR4 TE1; B6 ×3, B5/B7/B8/B10 ×2 | Rams D/ST 54.5/24/B11; Brandon Aubrey K 54.2/32/B14; Dallas Goedert TE 53.1/38/B10; J. Croskey-Merritt RB 52.4/45/B7; Jake Ferguson TE 50.5/38/B14 | Early D/ST; skipped K and surfaced Goedert #3, gap 1.35 | **GOOD ADVISORY** — demonstrates bounded #3 scan. |
| 130044/5/R8 | QB0 RB4 WR3 TE0; B7/B11 ×2 | Bhayshul Tuten RB 65.9/0/B7; Mike Evans WR 65.9/0/B8; Caleb Williams QB 59.9/10/B10; Courtland Sutton WR 58.2/16/B10; Kyle Pitts TE 57.7/12/B11 | RB5 needs WR; Evans #2, gap 0.01 | **GOOD ADVISORY** — not a hard quota because only a true tie qualifies. |
| 130208/9/R13 | QB2 RB5 WR3 TE2; B8/B10/B11 ×3 | J. Croskey-Merritt RB 52.5/57/B7; Xavier Worthy WR 52.3/71/B5; Cameron Dicker K 49.5/74/B7; Deebo Samuel WR 49.3/75/B8; Patriots D/ST 48.8/66/B11 | RB5 needs WR; Worthy #2, gap 0.28 | **GOOD ADVISORY** — late balance without specialist interference. |
| 130316/7/R10 | QB1 RB5 WR3 TE0; B8/B11 ×2 | Justin Herbert QB 60.5/2/B7; Travis Kelce TE 60.4/17/B5; Alec Pierce WR 58.8/11/B13; Trevor Lawrence QB 58.0/6/B7; Makai Lemon WR 57.7/16/B10 | Empty TE late; Kelce #2, gap 0.12 | **GOOD ADVISORY** — QB2-versus-TE1 edge case is narrowly supported. |
| 130172/3/R15 | QB2 RB5 WR5 TE1 D/ST1; B6/B7/B8 ×3 | Eagles D/ST 53.7/54/B10; Rashid Shaheed WR 52.2/69/B11; Hunter Henry TE 51.6/65/B11; Jake Bates K 48.1/67/B6; D. Stribling WR 44.7/76/B8 | Would be D/ST2; Shaheed #2, gap 1.57 | **GOOD ADVISORY** — avoids discretionary second defense. |

No corrected sampled case contradicted a required K/DST, exceeded the 2.0-point boundary, or altered the actual pick. The most subjective remaining cases are late cross-position bye prompts and rank-4 alternatives; the UI must therefore continue to show the model's #1, the alternative's rank and gap, and advisory wording rather than an override.

## Acceptance conclusion

The layer is narrow enough for draft-night use after the two corrections: it speaks on 3.33% of decisions, preserves every frozen-core choice, fails open, and confines alternative searches to the top five and a 2.0 Draft Strength gap. The raw JSON is generated/reproducible and should remain outside Git; this runner and report are the retained methodology and compact results.
