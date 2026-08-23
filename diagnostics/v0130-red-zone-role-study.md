# v0.13.0 RB red-zone role study

Analysis only. Generated 2026-08-23. No production recommendation, score, weight, tier, or player record was changed.

## Decision

**H — insufficient evidence for a production red-zone coefficient.** In 236 preseason RB observations from 2022–2025, prior-season inside-20, inside-10, and inside-5 RB opportunity shares did not improve leave-one-season-out prediction beyond archived preseason ADP plus prior workload. The explicit ADP-outperformance models also failed to beat an intercept-only residual baseline. Broader all-teammate competition—QB, TE/hybrid, and other non-RB rushing included—performed worse than RB-depth competition alone.

The Taysom Hill/Alvin Kamara and Bijan Robinson/Tyler Allgeier cases validate **high-value touch competition from any teammate** as a real mechanism and a useful explanation flag. They do not establish stable NFL-wide predictive value from the available preseason-safe variables. Do not implement the proposed 40/25/15/10/10 score. If revisited, use a bounded interpretation-layer flag only after assembling true preseason role reports and a larger coordinator dataset.

## Data and leakage contract

| Source | Seasons/status | Retrieval and use |
|---|---|---|
| [nflverse play-by-play releases](https://github.com/nflverse/nflverse-data/releases/tag/pbp) | 2020–2025, retrospective | Public CSV releases downloaded by the runner on 2026-08-23. Regular season only; nullified plays and QB kneels excluded. Season Y outcomes are never season Y predictors. |
| [nflverse rosters](https://github.com/nflverse/nflverse-data/releases/tag/rosters) | 2020–2025, retrospective | Public roster CSVs map rushers to RB/FB/QB/TE/WR. This is what allows non-RB goal-line competition. |
| [Fantasy Football Calculator ADP API](https://help.fantasyfootballcalculator.com/article/42-adp-rest-api) | Archived preseason PPR ADP | 12-team PPR: 2022 Sep 3–4 (1,633 drafts), 2023 Aug 30–Sep 1 (3,146), 2024 Aug 31–Sep 1 (1,371), 2025 Aug 25–Sep 1 (8,470). The [2023 archive page](https://fantasyfootballcalculator.com/adp/ppr/12-team/all/2023) documents the same window and sample. |
| Current DA BOYZ pool | 2026 point-in-time | Read-only extraction from the production pool stamped 2026-08-22 for ADP and existing situation/breakout fields. |
| Official/context reporting | 2022–2026 | Used only for case interpretation, not historical model predictors. Sources are linked in the relevant sections. |

For outcome season Y, football predictors come only from completed season Y−1; change features compare Y−1 with Y−2. Outcome PPR points, PPG, rank, touchdowns, and outcome-season usage are joined only after predictor construction. ADP is the archived outcome-season preseason snapshot. Head-coach identity is the first regular-season coach for each prior season; its change flag compares two already completed seasons. No current or future role information is backfilled into historical rows.

The primary outcome retains injuries. PPG is secondary and divides computed PPR production by games containing a carry or target, so it is a workload-game approximation rather than an official games-played measure. PPR excludes fumble penalties. Actual RB finish ranks all roster-mapped RB/FB rushers or targets in that season; ADP misses receive the next rank. Forty-six observations lack prior NFL usage and are explicitly zero-filled with `prior_available=0`.

## Variables

Each row contains prior carries, targets, receptions/touches and team shares; inside-20, inside-10, inside-5, inside-3, and inside-2 carries; inside-20/10 targets; team-RB and all-rusher shares; inside-5 TD conversion; team red-zone trips, scoring TDs/game, inside-10 rush tendency; and the highest teammate at each threshold with position, share, and rushing TDs. Competition fields include highest other-RB share, total non-RB share, QB share, TE/WR hybrid share, a short-yardage-specialist flag, and RB inside-5 concentration (HHI).

Role-change rows include workload, target, all-rusher red-zone, team-RB red-zone, and teammate inside-5 deltas. Reliable preseason snap share, RB-coach changes, injury/recovery states, and comprehensive teammate transaction dates were unavailable and are not imputed. The public coordinator source reviewed had materially incomplete coverage, so coordinator identity was not placed in the models.

## NFL-wide results

Sample by outcome season: 2022 n=53, 2023 n=59, 2024 n=60, 2025 n=64 (total n=236). Ordinary least squares uses standardized numeric predictors and leave-one-season-out validation.

| Outcome/model | OOS R² | OOS MAE | Δ OOS R² vs workload baseline |
|---|---:|---:|---:|
| Season PPR: market only | 0.2825 | 65.38 | −0.0135 |
| Season PPR: market + workload | **0.2960** | 65.66 | — |
| + inside-20 RB share | 0.2858 | 65.95 | −0.0103 |
| + inside-10 RB share | 0.2782 | 66.34 | −0.0179 |
| + inside-5 RB share | 0.2906 | 65.82 | −0.0054 |
| Full red-zone model | 0.2569 | 67.26 | −0.0392 |
| Role-change model | 0.2482 | 67.81 | −0.0478 |
| RB-depth competition | 0.2897 | 65.99 | −0.0063 |
| All-teammate competition | 0.2437 | 67.90 | −0.0524 |
| PPR/game: market + workload | **0.3768** | 3.41 | — |
| PPR/game: RB-depth competition | 0.3775 | 3.44 | +0.0006 |
| PPR/game: all-teammate competition | 0.3436 | 3.50 | −0.0333 |

The explicit ADP-residual test is more direct. An intercept-only residual model scored OOS R² −0.0216 / MAE 66.04. Established red-zone role scored −0.0336 / 66.36; role change −0.0769 / 68.05; RB-depth competition −0.0240 / 66.10; all-teammate competition −0.0609 / 67.62; combined −0.0361 / 67.47. None predicted ADP outperformance out of sample.

Simple groups look more encouraging but do not survive modeling. High prior inside-5 RB-share players averaged +3.7 PPR over ADP expectation when expensive and +5.3 when cheap, versus −3.9 and −4.1 for the low-share groups. Rising roles averaged +2.8 over ADP expectation, declining −2.1, stable −0.6. After workload controls and season holdouts, these differences did not generalize. This is the distinction between descriptive association and usable preseason signal.

Rushing-QB examples are correctly detected—Josh Allen, Jalen Hurts, Justin Fields, and Kyler Murray frequently lead or materially occupy teammate inside-5 work. Taysom Hill is classified through his roster position in the broad fields and separately through verified fantasy designation in the Saints case. Despite these real mechanisms, broad all-teammate features do not predict nominal RB underperformance better than RB-only depth competition in this sample.

## Alvin Kamara / Taysom Hill

[ESPN documented Hill’s 2020 in-season TE-to-QB eligibility change](https://www.espn.com/fantasy/football/story/_/id/30374522/faq-taysom-hill-no-longer-eligible-te-espn-fantasy-football-now-qb-only). ESPN’s [2022 fantasy depth charts](https://www.espn.com/fantasy/football/story/_/id/26150422/fantasy-football-2022-offensive-depth-charts) listed him at TE; contemporary 2023 analysis likewise treated him as a [TE/hybrid](https://www.fantasylife.com/articles/redraft/2023-fantasy-football-te-tiers). For 2024, [CBS moved his primary fantasy position to TE](https://cbsi.my.salesforce-sites.com/CBSi/articles/en_US/Knowledge/Taysom-Hill-Eligibility-Change) while Yahoo offered QB/TE eligibility. Thus his fantasy label differed by platform, but his non-RB/hybrid rushing role is unambiguous.

| Season | Kamara: carries / RZ / I10 / I5 | RZ targets | TD | ADP (RB) | PPR / finish | Hill designation | Hill: rush / RZ / I10 / I5 | Rush TD | Kamara / Hill / other I5 share | Non-RB I5 share | Est. Kamara TD opp. removed |
|---|---|---:|---:|---|---|---|---|---:|---|---:|---:|
| 2022 | 223 / 25 / 8 / 4 | 11 | 4 | 10.9 (RB8) | 219.7 / RB16 | TE | 96 / 18 / 12 / 3 | 7 | 28.6% / 21.4% / 50.0% | 42.9% | 0.58 |
| 2023 | 182 / 40 / 24 / 14 | 9 | 6 | 69.2 (RB25) | 227.0 / RB12 | TE/hybrid | 81 / 28 / 18 / 8 | 4 | 51.9% / 29.6% / 18.5% | 37.0% | 2.51 |
| 2024 | 228 / 35 / 17 / 11 | 6 | 8 | 32.3 (RB15) | 265.3 / RB9 | TE; QB/TE on Yahoo | 39 / 9 / 6 / 2 | 6 | 64.7% / 11.8% / 23.5% | 29.4% | 0.68 |

Other Saints RBs accounted for 15/5/4 RZ/I10/I5 carries in 2022, 17/8/3 in 2023, and 14/5/1 in 2024. QBs other than Hill added 2/2 I10/I5 attempts in 2022, 0/0 in 2023, and 3/3 in 2024.

The counterfactual does **not** award Kamara every Hill TD. It allocates only Hill’s inside-5 attempts by Kamara’s observed share of Saints RB inside-5 work, then applies that season’s league RB inside-5 TD conversion (36.9%–38.7%). The estimate is 3.76 TD opportunities across the three seasons, concentrated in 2023, not 17 transferred touchdowns.

Kamara underperformed ADP in 2022 (RB8 to RB16; −12.7 PPR versus the ADP model), but outperformed in 2023 (RB25 to RB12; +61.2) and 2024 (RB15 to RB9; +63.6). His large receiving roles—77, 87, and 89 targets—helped overwhelm the goal-line drag. Hill’s role demonstrably siphoned premium attempts, especially in 2023, but it did not consistently make Kamara an ADP underperformer.

## David Montgomery / Jahmyr Gibbs

| Season | Player | Carries / RZ / I10 / I5 | I5 all-rusher share | TD | ADP (RB) | PPR / finish | ADP residual |
|---|---|---|---:|---:|---|---|---:|
| 2023 | Gibbs | 182 / 38 / 21 / 11 | 30.6% | 11 | 36.7 (RB15) | 244.1 / RB9 | +41.5 |
| 2023 | Montgomery | 219 / 53 / 31 / 19 | 52.8% | 13 | 76.8 (RB28) | 207.2 / RB17 | +50.0 |
| 2024 | Gibbs | 250 / 54 / 26 / 17 | 43.6% | 19 | 9.4 (RB4) | 354.8 / RB1 | +130.0 |
| 2024 | Montgomery | 186 / 50 / 34 / 18 | 46.2% | 12 | 54.6 (RB20) | 219.6 / RB18 | +40.4 |
| 2025 | Gibbs | 243 / 52 / 22 / 10 | 37.0% | 18 | 5.1 (RB3) | 368.6 / RB3 | +144.9 |
| 2025 | Montgomery | 159 / 35 / 25 / 17 | 63.0% | 8 | 60.3 (RB23) | 162.8 / RB27 | −7.3 |

Montgomery consistently owned disproportionate premium rushing work, but Gibbs did not underperform his ADP or general profile: he beat ADP-expected PPR in all three seasons and reached RB1 in 2024. The pair shows that a strong offense can support two high-value roles and that “vulture” usage is not automatically a starter penalty. Montgomery is on Houston in the 2026 production pool, so Gibbs receives a **projected-relief flag only**; no future share or outcome is asserted.

## Bijan Robinson / Tyler Allgeier

Atlanta itself discussed Robinson’s [limited red-zone use in 2023](https://www.atlantafalcons.com/news/falcons-statistics-outcomes-red-zone-bijan-robinson-arthur-smith-drake-london) and his broader [usage under Arthur Smith](https://www.atlantafalcons.com/news/bijan-robinson-arthur-smith-weigh-in-on-usage-what-s-happened-and-what-comes-nex). Atlanta then [hired Zac Robinson as offensive coordinator](https://www.atlantafalcons.com/news/zac-robinson-named-falcons-offensive-coordinator-raheem-morris) before 2024.

| Season | Player | Carries / RZ / I10 / I5 | I5 all-rusher share | Rush TD | ADP (RB) | PPR / finish |
|---|---|---|---:|---:|---|---|
| 2023 | Bijan | 214 / 23 / 12 / 3 | 18.8% | 4 | 8.8 (RB3) | 252.3 / RB8 |
| 2023 | Allgeier | 187 / 37 / 11 / 7 | 43.8% | 4 | 125.0 (RB45) | 135.6 / RB38 |
| 2024 | Bijan | 305 / 61 / 35 / 18 | 66.7% | 14 | 4.9 (RB3) | 339.7 / RB3 |
| 2024 | Allgeier | 138 / 26 / 14 / 7 | 25.9% | 3 | 125.1 (RB45) | 104.2 / RB43 |
| 2025 | Bijan | 288 / 36 / 18 / 11 | 45.8% | 7 | 2.1 (RB1) | 374.8 / RB2 |
| 2025 | Allgeier | 143 / 32 / 19 / 10 | 41.7% | 8 | 154.5 (RB56) | 123.0 / RB39 |

The coaching transition coincided with a major 2024 role change: Bijan’s inside-5 share rose 47.9 points and his rushing TDs rose from 4 to 14. This validates role change as a football mechanism. It does not prove incremental preseason value: the 2024 market already drafted him RB3, and the NFL-wide preseason-safe role-change model lost 0.0478 OOS R² versus workload. Allgeier again took substantial premium work in 2025 without preventing Bijan from finishing RB2. The 2026 pool places Allgeier on Arizona, so Bijan also receives projected relief without a fabricated current share.

## Cam Skattebo and the 2026 audit

Skattebo’s 2025 retrospective line is 102 carries, 32 targets, 24/13/10 RZ/I10/I5 carries, 5 rushing and 2 receiving TDs, 127.7 PPR in eight workload games. His all-rusher shares were 24.5%/25.0%/32.3%; Devin Singletary also had 32.3% inside-5, and Giants QBs collectively had 29.0%. The 2026 FFC snapshot is ADP 36.4; the frozen DA BOYZ pool has planning ADP 41.0, situation 77, breakout 72.

The [Giants’ official 2026 camp report](https://www.giants.com/news/2026-training-camp-practice-malik-nabers-cam-skattebo-joe-schoen-john-harbaugh-jaxson-dart-brian-burns) says Skattebo returned and was “good to go,” and the [Giants coaching roster](https://www.giants.com/team/coaches-roster/) identifies Matt Nagy as offensive coordinator. Current preseason role reporting remains uncertain. Confidence is therefore **medium**, not high: the market appears to price meaningful upside, while a dedicated current goal-line lead is unproven. This is a candidate for monitoring, not a production-score change.

Selected 2026 flags:

- Jahmyr Gibbs, ADP 1.6: established role; projected relief because Montgomery moved to Houston; no quantified new share.
- Bijan Robinson, ADP 1.9: established elite role; projected relief because Allgeier moved to Arizona; the market is already expensive.
- Kenneth Walker, ADP 22.2: moved from Seattle to Kansas City; prior Charbonnet competition is not portable. Low confidence/system changed.
- Cam Skattebo, ADP 36.4: 2025 role and TD efficiency are promising, but QB/Singletary competition and uncertain current deployment cap confidence.
- David Montgomery, ADP 58.4: moved to Houston; Detroit premium-share history is descriptive only. Low confidence/system changed.

The full CSV preserves the existing production situation and breakout fields for auditability but does not modify them. `goalLineCompetition` is blank when the player or historical top competitor changed teams; `historicalGoalLineCompetition` retains the retrospective fact.

## Coordinator finding and recommended next step

Coordinator tendency is **H — insufficient evidence** here. A defensible test needs complete coordinator/team/season mapping and preferably several coordinator moves; the accessible public mapping reviewed was too incomplete to separate personnel from scheme. Head-coach change is retained only as context and did not rescue the role-change model.

No production experiment is justified from these results. A future diagnostic should collect timestamped late-August beat/official role reports, snap-aligned short-yardage personnel, teammate transactions, injuries/recoveries, and complete coordinator mappings. Pre-register a small bounded flag such as `EMERGING_GOAL_LINE_ROLE`, `NON_RB_GOAL_LINE_THREAT`, or `GOAL_LINE_COMPETITOR_DEPARTED`, test it against ADP residuals on later seasons, and keep it in the interpretation layer unless it produces repeated positive held-out R² and lower MAE. Do not double-count ADP, and do not assign deterministic TD transfers.

## Reproduction

Use Python with pandas and NumPy:

```powershell
python diagnostics/v0130-red-zone-role-study.py --cache-dir C:\path\to\red-zone-cache --download
node --test tests/v0130-red-zone-role.test.mjs
```

Raw nflverse files are intentionally excluded from Git. The JSON records SHA-256 hashes for every cached source, exact ADP windows, model specifications/results, groups, and case-study values. The five compact CSVs are regenerated deterministically from those inputs.
