# v0.12.9 All-profile Draft Grade Study — 10,000 Mocks

## Executive summary

- The study covered **19 profile types**: No Chumps, 17 historical opponent profiles, and one canonical Neutral / No History baseline.
- No Chumps averaged **86.684** across 10,000 rooms and beat Neutral head-to-head **89.6%** of the time, with a **+8.981** average score difference and **+4.329** rank-place advantage.
- Neutral averaged **77.713** with average rank **6.488**. Historical profiles materially worse than Neutral under the stated paired threshold: **none**.
- Primary seeds: **40001–45000** (780.9s). Secondary seeds: **50001–55000** (798.9s).
- Both sampling arms passed the appearance/card balance check: **yes**.
- Production source commit: **c6576753f6848cf6031baf618cc8d3a6664aae3a**.

## Combined profile results

The combined view pools arms only because production strategy and grading logic are identical; arm-specific results remain separate in the JSON.

| Profile type | Primary N | Secondary N | Combined N | Avg | Median | SD | P10 | P25 | P50 | P75 | P90 | Avg rank | 1st | Top 3 | Bottom 3 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| No Chumps | 5000 | 5000 | 10000 | 86.684 | 86.924 | 3.553 | 81.976 | 84.340 | 86.924 | 89.255 | 91.105 | 2.168 | 49.2% | 82.9% | 1.2% |
| Pelota Negro | 2353 | 2500 | 4853 | 80.965 | 81.325 | 4.849 | 74.574 | 78.029 | 81.325 | 84.378 | 86.843 | 5.030 | 8.7% | 33.4% | 20.8% |
| El Pacifesta | 2353 | 2500 | 4853 | 80.674 | 81.021 | 4.968 | 74.047 | 77.500 | 81.021 | 84.272 | 86.692 | 5.226 | 7.1% | 31.2% | 23.6% |
| NALGATORZ | 2353 | 2500 | 4853 | 80.234 | 80.588 | 5.171 | 73.495 | 77.096 | 80.588 | 83.891 | 86.616 | 5.471 | 6.5% | 28.5% | 27.1% |
| DA BRONCOS | 2353 | 2500 | 4853 | 80.070 | 80.559 | 5.154 | 73.115 | 76.685 | 80.559 | 83.778 | 86.428 | 5.505 | 7.2% | 27.7% | 28.3% |
| Cam + Guy | 2353 | 2500 | 4853 | 79.901 | 80.201 | 5.149 | 73.104 | 76.610 | 80.201 | 83.580 | 86.251 | 5.665 | 6.1% | 25.3% | 29.4% |
| Lumber Jack | 2353 | 2500 | 4853 | 79.859 | 80.337 | 5.237 | 72.835 | 76.580 | 80.337 | 83.459 | 86.354 | 5.621 | 6.3% | 25.9% | 28.9% |
| AMERICAS TEAM | 2353 | 2500 | 4853 | 79.854 | 80.239 | 5.238 | 72.939 | 76.499 | 80.239 | 83.550 | 86.254 | 5.628 | 6.2% | 26.3% | 29.1% |
| SHOW ME YOUR TDS | 2353 | 2500 | 4853 | 79.810 | 80.261 | 5.346 | 72.673 | 76.398 | 80.261 | 83.685 | 86.222 | 5.634 | 5.9% | 26.8% | 30.0% |
| R Kelly's Golden Showers | 2353 | 2500 | 4853 | 79.782 | 80.164 | 5.375 | 72.603 | 76.502 | 80.164 | 83.605 | 86.392 | 5.652 | 6.2% | 26.3% | 29.7% |
| Easy-E Dubs | 2353 | 2500 | 4853 | 79.465 | 79.760 | 5.412 | 72.181 | 76.009 | 79.760 | 83.321 | 86.234 | 5.831 | 6.3% | 24.1% | 32.7% |
| Go Diego Go!!! | 2353 | 2500 | 4853 | 79.422 | 79.859 | 5.178 | 72.447 | 76.149 | 79.859 | 83.057 | 85.853 | 5.879 | 4.6% | 23.0% | 32.1% |
| Kickers Are People Too | 2353 | 2500 | 4853 | 79.384 | 79.827 | 5.394 | 72.163 | 75.934 | 79.827 | 83.225 | 86.062 | 5.855 | 5.8% | 24.0% | 32.6% |
| Pimpin since '99 | 2352 | 2500 | 4852 | 79.081 | 79.477 | 5.574 | 71.692 | 75.601 | 79.477 | 83.149 | 85.884 | 5.983 | 5.1% | 22.6% | 34.7% |
| URINE TROUBLE | 2353 | 2500 | 4853 | 78.906 | 79.396 | 5.698 | 71.297 | 75.426 | 79.396 | 82.946 | 85.783 | 6.054 | 5.0% | 21.9% | 35.5% |
| Dee Tee | 2353 | 2500 | 4853 | 78.361 | 78.753 | 5.714 | 70.700 | 74.574 | 78.753 | 82.503 | 85.417 | 6.295 | 4.5% | 19.7% | 39.6% |
| Neutral / No History | 5000 | 2500 | 7500 | 77.713 | 78.291 | 6.351 | 69.170 | 73.782 | 78.291 | 82.309 | 85.420 | 6.488 | 4.2% | 18.7% | 43.4% |
| Blonx Bombers | 2353 | 2500 | 4853 | 77.317 | 77.635 | 5.610 | 69.815 | 73.647 | 77.635 | 81.272 | 84.197 | 6.848 | 2.5% | 13.6% | 47.6% |
| Jerry-Rigged | 2353 | 2500 | 4853 | 77.290 | 77.703 | 6.309 | 68.836 | 72.907 | 77.703 | 81.989 | 85.287 | 6.661 | 4.2% | 17.8% | 46.7% |

## No Chumps head-to-head

Positive score/rank figures favor No Chumps.

| Opponent | Shared rooms | Win rate | Score diff | Rank advantage |
|---|---:|---:|---:|---:|
| Kickers Are People Too | 4853 | 87.1% | +7.317 | +3.697 |
| Jerry-Rigged | 4853 | 90.7% | +9.404 | +4.527 |
| Cam + Guy | 4853 | 86.3% | +6.761 | +3.478 |
| DA BRONCOS | 4853 | 84.8% | +6.571 | +3.331 |
| El Pacifesta | 4853 | 83.8% | +6.010 | +3.071 |
| Pimpin since '99 | 4852 | 87.3% | +7.566 | +3.808 |
| Pelota Negro | 4853 | 81.7% | +5.675 | +2.845 |
| R Kelly's Golden Showers | 4853 | 86.2% | +6.929 | +3.503 |
| URINE TROUBLE | 4853 | 87.8% | +7.766 | +3.897 |
| Dee Tee | 4853 | 89.4% | +8.330 | +4.134 |
| SHOW ME YOUR TDS | 4853 | 86.1% | +6.879 | +3.460 |
| AMERICAS TEAM | 4853 | 85.8% | +6.849 | +3.450 |
| Easy-E Dubs | 4853 | 87.1% | +7.242 | +3.661 |
| Lumber Jack | 4853 | 85.7% | +6.836 | +3.436 |
| Blonx Bombers | 4853 | 92.4% | +9.391 | +4.669 |
| Go Diego Go!!! | 4853 | 88.3% | +7.271 | +3.711 |
| NALGATORZ | 4853 | 85.0% | +6.439 | +3.287 |
| Neutral / No History | 7500 | 89.6% | +8.981 | +4.329 |

## Historical profiles versus Neutral

All values are paired within shared rooms. Positive score/rank figures favor the historical profile. “Materially worse” requires score difference ≤ -1.0, rank advantage ≤ -0.25, and win rate <45%.

| Historical profile | Shared rooms | Win rate vs Neutral | Score diff | Rank advantage | Materially worse |
|---|---:|---:|---:|---:|---|
| Kickers Are People Too | 3559 | 57.1% | +1.651 | +0.658 | no |
| Jerry-Rigged | 3581 | 47.2% | -0.527 | -0.256 | no |
| Cam + Guy | 3509 | 58.8% | +2.105 | +0.821 | no |
| DA BRONCOS | 3519 | 60.6% | +2.401 | +0.994 | no |
| El Pacifesta | 3514 | 63.9% | +3.085 | +1.337 | no |
| Pimpin since '99 | 3522 | 55.7% | +1.347 | +0.525 | no |
| Pelota Negro | 3587 | 66.4% | +3.388 | +1.536 | no |
| R Kelly's Golden Showers | 3522 | 59.0% | +2.126 | +0.890 | no |
| URINE TROUBLE | 3508 | 55.3% | +1.293 | +0.496 | no |
| Dee Tee | 3486 | 51.8% | +0.497 | +0.119 | no |
| SHOW ME YOUR TDS | 3533 | 60.3% | +2.351 | +0.960 | no |
| AMERICAS TEAM | 3539 | 58.9% | +2.095 | +0.882 | no |
| Easy-E Dubs | 3529 | 57.4% | +1.700 | +0.639 | no |
| Lumber Jack | 3526 | 59.2% | +2.127 | +0.858 | no |
| Blonx Bombers | 3537 | 46.1% | -0.446 | -0.356 | no |
| Go Diego Go!!! | 3486 | 57.6% | +1.763 | +0.689 | no |
| NALGATORZ | 3543 | 60.4% | +2.378 | +0.997 | no |

### Historical-minus-Neutral component differences

| Historical profile | starterStrength | positionalBalance | benchDepth | valueVsAdp | scarcityCaptured | upside | byeManagement | rosterEfficiency | lineupLegality | waiverReadiness |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| Kickers Are People Too | +1.231 | +1.119 | -0.797 | -0.272 | +0.644 | -0.055 | -0.056 | +2.293 | +0.000 | +3.706 |
| Jerry-Rigged | +0.698 | -3.417 | -0.402 | +0.163 | +1.501 | -0.129 | -0.716 | -0.457 | +0.000 | +3.358 |
| Cam + Guy | +1.257 | +1.216 | -0.361 | -0.351 | -0.312 | -0.052 | +0.891 | +3.639 | +0.000 | +4.293 |
| DA BRONCOS | +1.842 | +1.691 | -1.099 | -0.263 | +0.323 | +0.003 | +0.159 | +1.961 | +0.000 | +8.379 |
| El Pacifesta | +1.951 | +1.976 | -1.687 | -0.072 | +1.076 | -0.071 | +1.808 | +2.191 | +0.000 | +8.956 |
| Pimpin since '99 | +1.083 | +0.930 | -0.524 | -0.255 | -0.157 | -0.083 | +1.216 | +0.207 | +0.000 | +4.277 |
| Pelota Negro | +1.675 | +1.570 | -1.264 | +0.059 | +0.197 | -0.017 | +2.645 | +4.559 | +0.000 | +9.152 |
| R Kelly's Golden Showers | +1.390 | +0.426 | -0.710 | -0.233 | -0.190 | -0.008 | +0.772 | +4.710 | +0.000 | +5.676 |
| URINE TROUBLE | +0.879 | +1.407 | -0.187 | -0.320 | -0.387 | +0.122 | +0.740 | +0.718 | +0.000 | +1.872 |
| Dee Tee | +0.548 | +0.309 | -0.064 | -0.292 | -0.218 | -0.008 | +0.236 | +0.414 | +0.000 | +1.008 |
| SHOW ME YOUR TDS | +1.475 | +1.070 | -0.826 | -0.342 | -0.072 | -0.059 | +0.801 | +4.906 | +0.000 | +5.013 |
| AMERICAS TEAM | +1.123 | +1.369 | -0.483 | -0.124 | -0.489 | -0.004 | +0.770 | +3.683 | +0.000 | +4.842 |
| Easy-E Dubs | +1.009 | +1.306 | -0.476 | -0.341 | +0.556 | +0.003 | -0.196 | +3.380 | +0.000 | +2.035 |
| Lumber Jack | +1.254 | +0.915 | -0.809 | -0.144 | -0.105 | -0.100 | +0.514 | +4.943 | +0.000 | +4.701 |
| Blonx Bombers | -0.215 | +0.864 | +0.831 | -0.113 | -3.284 | -0.021 | -0.306 | +0.427 | +0.000 | -1.069 |
| Go Diego Go!!! | +0.773 | +1.071 | -0.284 | -0.124 | -0.714 | -0.081 | +0.930 | +4.390 | +0.000 | +2.542 |
| NALGATORZ | +1.344 | +1.707 | -0.637 | -0.201 | +0.217 | +0.004 | +0.208 | +3.932 | +0.000 | +4.975 |

## Component averages

| Profile | starterStrength | positionalBalance | benchDepth | valueVsAdp | scarcityCaptured | upside | byeManagement | rosterEfficiency | lineupLegality | waiverReadiness | Waiver pressure |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| No Chumps | 80.585 | 95.984 | 69.932 | 46.045 | 65.661 | 51.699 | 70.853 | 91.198 | 100.000 | 67.624 | 2.313 |
| Pelota Negro | 77.266 | 93.972 | 68.836 | 54.467 | 60.316 | 51.101 | 65.848 | 74.417 | 100.000 | 65.971 | 2.431 |
| El Pacifesta | 77.543 | 94.219 | 68.418 | 54.339 | 61.198 | 51.051 | 65.386 | 71.911 | 100.000 | 65.751 | 2.446 |
| NALGATORZ | 76.982 | 94.214 | 69.384 | 54.221 | 60.418 | 51.134 | 64.029 | 74.031 | 100.000 | 62.068 | 2.709 |
| DA BRONCOS | 77.423 | 93.939 | 68.991 | 54.186 | 60.576 | 51.138 | 63.930 | 71.642 | 100.000 | 65.200 | 2.486 |
| Cam + Guy | 76.872 | 93.753 | 69.678 | 54.103 | 59.996 | 51.116 | 64.229 | 73.789 | 100.000 | 61.341 | 2.761 |
| Lumber Jack | 76.901 | 93.329 | 69.301 | 54.243 | 60.169 | 51.056 | 63.963 | 74.700 | 100.000 | 61.990 | 2.715 |
| AMERICAS TEAM | 76.804 | 93.753 | 69.578 | 54.240 | 59.825 | 51.133 | 64.049 | 73.872 | 100.000 | 62.099 | 2.707 |
| SHOW ME YOUR TDS | 77.088 | 93.209 | 69.255 | 54.075 | 60.248 | 51.055 | 63.740 | 74.527 | 100.000 | 62.209 | 2.699 |
| R Kelly's Golden Showers | 77.022 | 92.692 | 69.301 | 54.212 | 60.065 | 51.115 | 64.377 | 74.368 | 100.000 | 62.826 | 2.655 |
| Easy-E Dubs | 76.645 | 93.526 | 69.563 | 54.102 | 60.759 | 51.139 | 63.703 | 73.232 | 100.000 | 59.491 | 2.893 |
| Go Diego Go!!! | 76.448 | 93.450 | 69.781 | 54.213 | 59.553 | 51.038 | 64.152 | 74.262 | 100.000 | 59.861 | 2.867 |
| Kickers Are People Too | 76.843 | 93.444 | 69.285 | 54.128 | 60.873 | 51.073 | 63.623 | 72.294 | 100.000 | 60.692 | 2.808 |
| Pimpin since '99 | 76.738 | 93.387 | 69.495 | 54.187 | 59.957 | 51.079 | 64.523 | 70.367 | 100.000 | 61.393 | 2.758 |
| URINE TROUBLE | 76.524 | 93.672 | 69.842 | 54.145 | 59.979 | 51.240 | 63.941 | 70.344 | 100.000 | 59.223 | 2.913 |
| Dee Tee | 76.275 | 92.820 | 69.908 | 54.134 | 60.084 | 51.174 | 63.529 | 70.661 | 100.000 | 58.453 | 2.968 |
| Neutral / No History | 75.659 | 92.384 | 70.051 | 54.409 | 60.242 | 51.137 | 63.392 | 69.885 | 100.000 | 57.261 | 3.053 |
| Blonx Bombers | 75.479 | 93.243 | 70.876 | 54.224 | 57.128 | 51.099 | 63.140 | 70.330 | 100.000 | 56.286 | 3.122 |
| Jerry-Rigged | 76.377 | 89.089 | 69.644 | 54.560 | 61.761 | 51.040 | 62.921 | 69.320 | 100.000 | 60.640 | 2.811 |

## Positional construction averages

| Profile | QB | RB | WR | TE | K | D/ST |
|---|---:|---:|---:|---:|---:|---:|
| No Chumps | 1.931 | 5.107 | 6.109 | 1.814 | 1.030 | 1.009 |
| Pelota Negro | 2.355 | 4.624 | 5.665 | 2.271 | 1.042 | 1.043 |
| El Pacifesta | 2.207 | 5.144 | 5.130 | 2.412 | 1.073 | 1.033 |
| NALGATORZ | 1.867 | 5.503 | 5.644 | 1.779 | 1.049 | 1.159 |
| DA BRONCOS | 2.235 | 5.464 | 5.199 | 1.838 | 1.080 | 1.183 |
| Cam + Guy | 1.917 | 5.350 | 5.887 | 1.633 | 1.069 | 1.143 |
| Lumber Jack | 1.952 | 5.029 | 6.075 | 1.811 | 1.060 | 1.074 |
| AMERICAS TEAM | 2.082 | 5.266 | 5.839 | 1.613 | 1.085 | 1.115 |
| SHOW ME YOUR TDS | 1.922 | 4.886 | 6.220 | 1.775 | 1.048 | 1.149 |
| R Kelly's Golden Showers | 2.082 | 4.637 | 6.342 | 1.793 | 1.076 | 1.070 |
| Easy-E Dubs | 1.837 | 5.582 | 5.816 | 1.653 | 1.031 | 1.080 |
| Go Diego Go!!! | 1.870 | 5.276 | 6.094 | 1.661 | 1.037 | 1.062 |
| Kickers Are People Too | 1.930 | 5.612 | 5.591 | 1.758 | 1.034 | 1.075 |
| Pimpin since '99 | 1.858 | 6.142 | 5.004 | 1.885 | 1.043 | 1.067 |
| URINE TROUBLE | 1.977 | 6.250 | 5.232 | 1.352 | 1.047 | 1.142 |
| Dee Tee | 1.829 | 5.971 | 5.532 | 1.617 | 1.024 | 1.027 |
| Neutral / No History | 1.853 | 5.635 | 5.876 | 1.614 | 1.010 | 1.012 |
| Blonx Bombers | 1.786 | 6.320 | 5.486 | 1.322 | 1.029 | 1.057 |
| Jerry-Rigged | 1.938 | 3.893 | 7.314 | 1.802 | 1.032 | 1.022 |

## Balance check

| Arm | Sampled-pool appearance min | Max | Spread | Maximum within-profile card spread | Sufficient |
|---|---:|---:|---:|---:|---|
| primary | 2352 | 2353 | 1 | 2 | yes |
| secondary | 2500 | 2500 | 0 | 3 | yes |

Exact appearance and Card 1–10 counts for every profile and arm are in the JSON; combined card averages are also in the card CSV.

Historical-versus-Neutral paired coverage ranged from 3486 to 3587 shared rooms; No Chumps-versus-historical coverage ranged from 4852 to 4853.

## Conclusions

- The production catalog audit found exactly 17 non-No-Chumps profiles with one or more historical seasons. The two zero-season preset identities (Alex #2, TBD) were documented but not double-counted as historical profiles or as extra neutral profile types.
- No historical profile met the predeclared materially-worse threshold. Jerry-Rigged and Blonx Bombers finished modestly below Neutral on paired score and win rate, but not by the material threshold.
- Neutral was modeled by an unlinked team identity with null profileId and presetId, invoking the existing production neutral/generic opponent path.
- No Chumps retained its normal identity for grading and reporting, while the established production self-profile boundary kept its optimized recommendation strategy independent of its own historical tendency profile.
- No football, grading, owner-profile, neutral-profile, pool, PWA, export, or production application file was modified.
