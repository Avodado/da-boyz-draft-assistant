# v0.13.1 Aug. 28 draft-day overlay

Generated 2026-08-28T15:49:00Z for the Aug. 28 DA BOYZ draft. This is a runtime data overlay: it updates both the built-in pool and locally saved draft state after the core app loads. It is idempotent and fails safely without blocking the existing draft state.

## Sources

- Cross-platform seven-day redraft ADP: https://adpwire.com/movers, week of Aug. 24, retrieved Aug. 28.
- Ashton Jeanty ankle sprain: https://www.nfl.com/news/raiders-rb-ashton-jeanty-apparent-right-leg-injury, published Aug. 23.
- Quinshon Judkins full-go return: https://www.fantasypros.com/nfl/news/604176/quinshon-judkins-returns-to-team-drills.php, published Aug. 25.
- Alec Pierce activation and ramp-up: https://www.colts.com/news/wr-alec-pierce-returns-to-practice-after-pup-stint, published Aug. 27.
- Keon Coleman shed his walking boot but remained out: https://www.cbssports.com/nfl/players/26717289/keon-coleman/fantasy/, published Aug. 27.

## Material recommendation corrections

| Player | Aug. 22 app ADP | Aug. 28 overlay ADP | Availability/situation action |
|---|---:|---:|---|
| Adonai Mitchell | 199.5 | 174.7 | Earlier late-round urgency; breakout score remains frozen. |
| Quinshon Judkins | 51.1 | 61.2 | Full-go return changes QUESTIONABLE/62/60 to EXPECTED_WEEK1_READY/88/66. |
| Dylan Sampson | 172.7 | 164.4 | Slightly earlier final-round urgency. |
| Matthew Golden | 118.6 | 122.0 | Small market adjustment; breakout and situation scores remain frozen. |
| Sean Tucker | 243.9 | 182.2 | Major rise, but still outside the normal 170-pick room. |
| Bucky Irving | 45.8 | 62.1 | Removes stale early-round urgency. |
| Malik Nabers | 27.2 | 39.4 | Removes stale early-round urgency; existing injury penalty remains. |
| T.J. Hockenson | 165.9 | 158.9 | Modest late-round urgency adjustment. |
| Xavier Worthy | 122.8 | 118.6 | Modest earlier urgency adjustment. |
| Garrett Wilson | 40.0 | 42.8 | Small later adjustment. |
| Ashton Jeanty | 13.8 | 10.0 | Adds QUESTIONABLE ankle flag and moves health/situation from 92/74 to 68/68. |

The overlay also refreshes the other published top weekly movers so survival probability and opponent market behavior use the same Aug. 28 board. Jayden Higgins' stale market rise is deliberately not applied: the official season-ending ACL status controls, and v0.13.1 marks the identity-only record unavailable in fresh and saved pools.

## Frozen behavior

| Span/artifact | SHA-256 | Result |
|---|---|---|
| Core data span | `1c5e95623b0aed0ba266758928f6e87f65d6522b1b205dba2d6537f729d371a5` | Unchanged |
| Football model span | `4580193cce84afbf9f4782fd21829969d6e39cb08cdc348d62643122f223a40b` | Unchanged |
| Embedded master pool | `e3321e205d4a35df456d1d066848bf4cda0033ac91245f33b9b8af951ac18dcf` | Unchanged; overlay applies at runtime |
| Simulation calibration | `ef2edb124b2d3a1c7e245bf0008213e2fe2e1fdfb6a548abf9a8c81b4d73fa44` | Unchanged |
| Interpretation layer | `f44fa1b44617ed5a7368e339c5860f061599caf00667df472276781d0966d474` | Unchanged |

The overlay does not define or replace Draft Strength, recommendation, survival, owner simulation, randomization, grading, archive, or local export functions. It updates inputs, resets cached calculations, saves the corrected state, and rerenders.
