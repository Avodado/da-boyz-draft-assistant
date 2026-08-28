# Late Aug. 28 draft-day market and injury recheck

Generated 2026-08-28T23:22:00Z for pre-draft review. This is a data-overlay hotfix on top of v0.13.1. The compressed production app, player pool, Draft Strength, recommendation coefficients, owner profiles, simulation calibration, interpretation layer, affinity tracker, grading, archive workflow, and draft-state/export logic are unchanged.

## Market recheck

ADPWire's live consensus board was re-verified on Aug. 28. It continues to aggregate ESPN, Yahoo, Sleeper, Underdog, NFL, and CBS and refreshes continuously. The v0.13.1 overlay values remain current enough that no planning-ADP numbers are changed by this hotfix. In particular, the live top ten remained Gibbs 1, Bijan 2, Chase 3, Puka 4, JSN 5, McCaffrey 6, Amon-Ra 7, Jonathan Taylor 8, CeeDee Lamb 9, and Ashton Jeanty 10.

Primary market source:
- https://adpwire.com/adp-rankings
- https://adpwire.com/

## Injury-source date semantics

The v0.13.0 injury-source policy remains authoritative:

- CBS `Updated` is treated as the source's update date.
- NFFC's first date field is a **Return Date**, not a publication/update date.
- A future NFFC Return Date cannot independently create a current downgrade.
- Current CBS rows or a named current team/NFL/reputable report are required for material injury changes.
- Absence from an injury table is not treated as medical proof of health.
- IR/PUP labels are not promoted to `OUT_SEASON` without explicit season-ending evidence.

This recheck therefore uses current dated CBS, official-team, NBC/Rotoworld, FantasyPros, and Reuters evidence. NFFC return dates are not used as freshness evidence.

## Material availability / health changes

Health values follow the existing v0.13 scale. When a current report changes health without a separately documented role/offense/competition change, the overlay applies the already-established v0.13 health-to-situation adjustment:

`round((new health - prior health) * 0.25)`, capped to ±20.

| Player | Prior | Review update | Health | Evidence |
|---|---|---|---:|---|
| Christian McCaffrey | QUESTIONABLE / 62 | EXPECTED_WEEK1_READY | 90 | Returned Aug. 23; player said absences were planned load management and he feels fresh. |
| Ja'Marr Chase | NO_CURRENT_INJURY_FLAG / 92 | QUESTIONABLE | 82 | Left-knee hyperextension Aug. 25; missed next practice, but said he could have played if there were a game. |
| Jeremiyah Love | QUESTIONABLE / 68 | QUESTIONABLE | 58 | High-ankle sprain; remained out of all practice work the week of Aug. 24. |
| TreVeyon Henderson | NO_CURRENT_INJURY_FLAG / 92 | EXPECTED_WEEK1_READY | 82 | Precautionary ankle tests; Aug. 27 report says he avoided a serious injury and should be good for Week 1. |
| DeVonta Smith | QUESTIONABLE / 68 | EXPECTED_WEEK1_READY | 88 | Full practice participant Aug. 24. |
| Makai Lemon | QUESTIONABLE / 62 | EXPECTED_WEEK1_READY | 88 | Official Eagles report: full participant in all team drills Aug. 24. |
| Sam LaPorta | QUESTIONABLE / 64 | EXPECTED_WEEK1_READY | 82 | Returned to practice Aug. 25 and is trending positively. |
| George Kittle | PUP_EXPECTED_WEEK1 / 60 | QUESTIONABLE | 72 | Activated from active/PUP Aug. 23; ramp-up is encouraging, but Week 1 is not yet assured. |
| Mike Evans | QUESTIONABLE / 68 | EXPECTED_WEEK1_READY | 78 | Latest groin issue described as minor; expects Week 1 and team expects practice next week. |
| Josh Downs | NO_CURRENT_INJURY_FLAG / 92 | EXPECTED_WEEK1_READY | 82 | Called calf issue very minor Aug. 26 and expects to resume practice soon. |
| Isiah Pacheco | QUESTIONABLE / 60 | QUESTIONABLE | 58 | Knee is no longer the concern; new back injury made timeline uncertain Aug. 27. |
| Patrick Mahomes | QUESTIONABLE / 60 | EXPECTED_WEEK1_READY | 82 | Full first-team camp participation; Week 1 remains the plan, pending final coach/medical approval. |
| Malik Nabers | QUESTIONABLE / 62 | EXPECTED_WEEK1_READY | 78 | Shed non-contact jersey Aug. 24, took team reps, and coach said Week 1 is a reasonable assumption if progress continues. |
| Breece Hall | QUESTIONABLE / 68 | EXPECTED_WEEK1_READY | 76 | Moving well in rehab; Jets said Aug. 24 he is on track for Week 1. |
| J.J. McCarthy | NO_CURRENT_INJURY_FLAG / 92 | QUESTIONABLE | 82 | Ankle injury keeps him out of the Aug. 28 preseason finale. |

## Current concerns retained rather than cleared

| Player | Status | Health | Latest evidence |
|---|---|---:|---|
| Ashton Jeanty | QUESTIONABLE | 68 | Right ankle sprain; not expected long-term but no firm return timetable. |
| Puka Nacua | QUESTIONABLE | 68 | Rams still listed him as a non-participant Aug. 24 due to psoas soreness. |
| Emeka Egbuka | QUESTIONABLE | 70 | Still resting toe Aug. 28; Week 1 is the goal but availability remains up in the air. |
| Keon Coleman | QUESTIONABLE | 74 | Shed walking boot Aug. 27 but still did not play in the preseason finale. |
| Quinshon Judkins | EXPECTED_WEEK1_READY | 88 | Returned full-go to team drills Aug. 25. |
| Alec Pierce | EXPECTED_WEEK1_READY | 82 | Activated from PUP Aug. 27; workload is ramping toward Week 1. |

## Delivery / cache safety

The loader requests overlay revision `2026-08-28.2` with a versioned query string. That bypasses the already-installed cache entry for `draft-day-overlay.js` on the first online refresh while leaving the existing service worker and offline core untouched. Once fetched, the current service worker runtime-caches the versioned overlay for subsequent offline use.

## Review boundary

Only these files should differ from the current main baseline:

- `draft-day-overlay.js`
- `index.html`
- `tests/draft-day-overlay.test.mjs`
- `diagnostics/v0131-late-draft-day-recheck.md`

No merge is authorized by this refresh.
