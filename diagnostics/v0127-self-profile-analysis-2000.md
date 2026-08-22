# v0.12.7 No Chumps self-profile diagnosis

## Conclusion and root cause

The exported `profilePrediction` was mistaken for a recommendation component. It is a post-selection diagnostic snapshot captured by `recordPick`; it records what the historical profile expected and how closely the actual pick adhered. It is not read by Draft Strength, recommendation ordering, or the My Team simulated-pick selector.

The recent Jalen Hurts and Colston Loveland examples actually demonstrate disagreement with the No Chumps historical model: the log expected WR, while the selected position was QB or TE. Low adherence is evidence that the selection departed from history, not that history caused it.

v0.12.6 already separated the practical paths through call topology. v0.12.7 makes the boundary explicit and future-proof: `ownerPickDistribution(sp)` returns the generic room distribution whenever `sp.card` is My Team, while opponents still use the complete historical and live-adaptation model. `profilePredictionSnapshot` continues to call the historical base distribution directly for diagnostic logging.

## Exact call and data flow

### Opponent prediction and simulation

`team.profileId` → `profileForCard` → `ROOM_PROFILES` → `ownerPickDistributionBase`

- applies phase share, roster target/need, historical bias, pace, exact-sequence light prior, first-position timing, reliability, and profile strength;
- `ownerPickDistribution` then applies `livePositionMultiplier` from observed-vs-expected current-draft picks;
- `chooseOpponentSimulatedPlayer` uses that distribution against the generic room distribution to tilt market-first opponent choices.

### SURV, tier urgency, and Draft Strength

`interveningPicks` → `ownerPickDistribution` for each scheduled opponent → `ownerHazard(position)` →

- `survivalProbability`: market/ADP uncertainty + room pressure + opponent hazard;
- `tierInfo`: remaining same-tier players + expected opponent positional demand;
- `draftStrength`: 57% intrinsic + 10% situation + 22% roster utility + 11% urgency.

`interveningPicks` starts after the current No Chumps selection when No Chumps is on the clock and stops before the following No Chumps selection. The current and following No Chumps picks are excluded. Therefore SURV asks only which opponents pick before No Chumps returns.

### No Chumps recommendation and mock selection

`chooseMyTeamSimulatedPlayer` → legal available players → `draftStrength` → market-ADP tie break.

No owner-profile distribution is consulted for the self pick. The explicit v0.12.7 guard additionally makes any direct `ownerPickDistribution` request for My Team generic, preventing future callers from accidentally introducing self imitation.

### Roster and recommendation layers

- Intrinsic value, current situation, roster marginal value, redundancy, contingent RB upside, bye impact, starter completion, and positional scarcity contain no owner-profile input.
- `TAKE NOW`, `LEAN TAKE`, `WAIT LIKELY`, and the other labels depend only on Draft Strength, SURV, and starter-completion state.
- `playerSort(..., "strength")` orders solely by Draft Strength.

### Diagnostic prediction and live adaptation

`recordPick` → `profilePredictionSnapshot` → `ownerPickDistributionBase` → saved `pick.profilePrediction`.

This path is diagnostic. `liveOwnerStats(card)` later reads those snapshots only when predicting that same card through the opponent distribution. Opponent adaptation remains active. The v0.12.7 My Team guard prevents both historical self tendency and self-adaptation from entering strategy, while roster state and observed opponent behavior still matter.

## Hurts at overall 81 reproduction

Card 3 was reconstructed through pick 80 with this No Chumps roster: Christian McCaffrey, Jaxon Smith-Njigba, Trey McBride, Drake London, David Montgomery, RJ Harvey, Jayden Daniels, and Colston Loveland. Jalen Hurts remained available at pick 81.

The active-self-profile and neutral-self-profile recommendation orders and every component were identical. Top results:

| Rank | Candidate | Pos | STR | Intrinsic | Situation | Roster | SURV | Tier urgency | Label |
|---:|---|---|---:|---:|---:|---:|---:|---:|---|
| 1 | Wan'Dale Robinson | WR | 62.877 | 56.979 | 64.960 | 59.0 | 0.998% | 100.000 | TAKE NOW |
| 2 | Rhamondre Stevenson | RB | 62.822 | 58.467 | 79.920 | 49.7 | 0.692% | 88.590 | TAKE NOW |
| 3 | Jonathon Brooks | RB | 62.296 | 56.235 | 65.895 | 59.8 | 1.646% | 88.590 | TAKE NOW |
| 4 | Jalen Hurts | QB | 61.769 | 55.491 | 87.400 | 47.5 | 0.666% | 100.000 | TAKE NOW |
| 5 | Chuba Hubbard | RB | 58.278 | 51.027 | 71.142 | 54.04 | 5.642% | 88.590 | LEAN TAKE |
| 6 | D.K. Metcalf | WR | 57.630 | 48.052 | 72.103 | 59.0 | 12.340% | 100.000 | LEAN TAKE |

Hurts' historical diagnostic changed, but his strategy components did not:

| Item | Self profile active | Self profile neutral | Strategy delta |
|---|---:|---:|---:|
| Historical predicted WR probability | 72.230% | 38.955% generic | diagnostic only |
| Historical predicted QB probability | 10.212% | 14.282% generic | diagnostic only |
| Intrinsic | 55.491 | 55.491 | 0 |
| Situation | 87.400 | 87.400 | 0 |
| Roster utility | 47.500 | 47.500 | 0 |
| SURV | 0.666% | 0.666% | 0 |
| Tier urgency | 100.000 | 100.000 | 0 |
| Draft Strength | 61.769 | 61.769 | 0 |
| Recommendation rank | 4 | 4 | 0 |

The reconstructed board is close rather than identical to the exported draft because the export's other 72 opponent selections were not supplied. It nonetheless reproduces the specified roster, card, pick number, and Hurts availability.

## Diagnostic-only tier cliff / denial signal

The new report contains:

- candidate tier;
- available players remaining in that tier and position;
- next-lower numeric tier and its size;
- expected opponent positional demand before the next No Chumps pick;
- estimated Draft Strength drop to the best available player in the next tier;
- an optional denial/scarcity signal.

For Hurts at pick 81:

| Diagnostic | Value |
|---|---:|
| Candidate tier | 3 |
| Tier 3 QBs remaining | 1 |
| Next tier | 4 |
| Tier 4 QBs available | 4 |
| Expected opponent QB selections before next No Chumps pick | 2.630 |
| Estimated STR drop to best Tier 4 QB | 7.447 |
| Denial/scarcity signal | 17.916 |
| Alters Draft Strength | No |

The calculation is displayed in Draft Intelligence but is not called by `draftStrength`, `recommendation`, or either simulated-pick selector.

## Paired 2,000-draft validation

Both arms used seeds 10,001–12,000. Opponent historical profiles and live adaptation were active in both. The only arm difference was whether My Team retained the No Chumps historical profile. There were **0 paired No Chumps selection mismatches across 2,000 seeds**.

All figures below are identical in both arms:

| Metric | Profile active | Self profile neutral | Delta |
|---|---:|---:|---:|
| QB after first 6 | 0.3950 | 0.3950 | 0 |
| RB after first 6 | 2.4550 | 2.4550 | 0 |
| WR after first 6 | 2.5125 | 2.5125 | 0 |
| TE after first 6 | 0.6375 | 0.6375 | 0 |
| QB after first 8 | 0.9010 | 0.9010 | 0 |
| RB after first 8 | 2.8375 | 2.8375 | 0 |
| WR after first 8 | 3.2990 | 3.2990 | 0 |
| TE after first 8 | 0.9625 | 0.9625 | 0 |
| Final QB | 1.9325 | 1.9325 | 0 |
| Final RB | 5.1515 | 5.1515 | 0 |
| Final WR | 6.0700 | 6.0700 | 0 |
| Final TE | 1.7890 | 1.7890 | 0 |
| Final K | 1.0415 | 1.0415 | 0 |
| Final D/ST | 1.0155 | 1.0155 | 0 |
| 4+ RB by Round 6 | 7.60% | 7.60% | 0 pp |
| Legal starter roster | 100.00% | 100.00% | 0 pp |
| Average largest bye load | 4.065 | 4.065 | 0 |
| Any bye load at least 3 | 99.95% | 99.95% | 0 pp |
| Second QB frequency | 91.70% | 91.70% | 0 pp |
| Second QB average round when drafted | 11.405 | 11.405 | 0 |
| Second TE frequency | 78.65% | 78.65% | 0 pp |
| Second TE average round when drafted | 11.044 | 11.044 | 0 |

First-QB round distribution (percentage of 2,000 drafts): `R3 15.65, R4 11.35, R6 12.00, R7 18.00, R8 20.65, R9 3.35, R10 11.25, R11 0.65, R12 2.90, R13 3.80, R14 0.10, R15 0.15, R16 0.05, R17 0.10`.

First-TE round distribution: `R2 1.40, R3 27.95, R4 1.30, R5 11.85, R6 18.70, R7 14.90, R8 6.55, R9 2.80, R10 5.70, R11 6.60, R12 1.35, R13 0.85, R14 0.05`.

Recommendation-label distribution in each arm: `TAKE NOW 56.168%, LEAN TAKE 23.476%, VALUE CHECK 7.103%, REQUIRED 7.900%, LAST FLEX PICK 4.712%, WAIT LIKELY 0.641%`.

Average selected-value proxies in each arm: Draft Strength `61.016`, intrinsic `55.921`, situation `74.986`, roster utility `59.809`, SURV `20.969%`.

## Interpretation

Neutralizing the self profile produces no roster-construction regression because it produces no decision change: strategic flexibility was already independent from historical self tendencies. The explicit boundary reduces architectural ambiguity and prevents future accidental self imitation without altering opponent prediction, football logic, or calibrated behavior.
