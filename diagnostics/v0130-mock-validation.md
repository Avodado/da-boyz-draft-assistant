# v0.13.0 No Chumps mock validation

Run Aug. 22, 2026 with `v0127-self-profile-analysis.mjs`, seeds 10001–10200, 200 paired 170-pick drafts per arm. The retained v0.12.7 baseline uses the same runner over seeds 10001–12000 (2,000 drafts). The current paired self-profile and neutral arms had zero selection mismatches, confirming that the No Chumps historical profile remains diagnostic-only.

The 170-pick export regression also completed successfully with 170 picks, 17 No Chumps decision snapshots, ten team grades, round-trip equality, and offline aggregation.

| Metric | Retained baseline | v0.13.0 | Delta | Assessment |
|---|---:|---:|---:|---|
| First 6 RB | 2.455 | 2.180 | -0.275 | Monitor; current board shifts slightly toward WR/QB |
| First 6 WR | 2.513 | 2.660 | +0.148 | Small |
| First 6 QB | 0.395 | 0.490 | +0.095 | Small |
| First 6 TE | 0.638 | 0.670 | +0.033 | Stable |
| First 8 RB | 2.838 | 2.640 | -0.198 | Small |
| First 8 WR | 3.299 | 3.540 | +0.241 | Monitor |
| Final RB | 5.152 | 4.740 | -0.412 | Largest construction shift; still comfortably above lineup minimum |
| Final WR | 6.070 | 6.395 | +0.325 | Offsetting construction shift |
| Final QB | 1.933 | 1.955 | +0.023 | Stable |
| Final TE | 1.789 | 1.825 | +0.036 | Stable |
| Final K | 1.042 | 1.045 | +0.004 | Stable |
| Final D/ST | 1.016 | 1.040 | +0.025 | Stable |
| RB4 by Round 6 | 7.60% | 3.00% | -4.60 pp | Monitor; less early RB clustering |
| Valid completed lineup | 100% | 100% | 0 pp | Pass |
| Average largest bye load | 4.065 | 4.170 | +0.105 | Small |
| Second QB frequency | 91.70% | 95.00% | +3.30 pp | Small |
| Second TE frequency | 78.65% | 82.50% | +3.85 pp | Small |
| Average selected Draft Strength | 61.016 | 61.557 | +0.541 | Stable/improved |
| Average selected situation | 74.986 | 75.412 | +0.426 | Stable |
| Average selected survival | 20.969 | 15.736 | -5.233 | Flagged; expected sensitivity to refreshed current ADP, not a coefficient change |

Conclusion: no legality or completion regression and no evidence that frozen strategy coefficients changed. The material observable effect is a modest RB-to-WR construction shift plus lower selected survival estimates, both consistent with the refreshed market order. These are flagged for post-draft monitoring rather than used to change weights.
