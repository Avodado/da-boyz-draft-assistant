# v0.12.9 tier architecture study

> Analysis only. Production recommendation logic, coefficients, player pool, owner profiles, grading, and PWA/update files were not changed.

## Executive conclusion

**G. Insufficient evidence.** Genuine 2025 tiers are unavailable, so the historical arms can measure sensitivity to proxy structure but cannot establish the truth of current boundaries. Cliff-only improved paired 2026 No Chumps grade by 0.336 and top-three rate by 0.95 percentage points, but its 2025 proxy changed No Chumps realized optimal points by -6.6 and field realized points by 0.4.

Across 2026 arms, the largest absolute No Chumps grade swing was 0.336 points. Historical No Chumps realized optimal points ranged from 1829.1 to 1839.7, but all structured 2025 tiers are synthetic proxies because genuine archived tiers do not exist.

## 1. Exact production tier architecture

Source: `player.tier` in the embedded `DEFAULT_MASTER_POOL`; all populated 2026 rows report `MARKET_ADP_GAP_HEURISTIC_V1, `. Tiering is position-specific. The artifact does not retain the upstream builder threshold implementation, so the exact historical assignment thresholds cannot be recovered beyond the frozen labels and method provenance.

- `positionalScarcityScore`: Reads p.tier only for TE: +max(0,4-tier)*6; called by rosterUtility for TE0 at 28% of the scarcity deviation.
- `tierInfo`: Counts undrafted same-position/same-tier players; combines ownerHazard expected demand, coverage, small-tier bonus, and hazard ratio into urgency.
- `draftStrength`: urgency = SURV-null ? tier urgency : clamp((100-SURV)*0.70 + tier urgency*0.30); Draft Strength = 0.57 intrinsic + 0.10 situation + 0.22 roster utility + 0.11 urgency.
- `tierCliffDiagnostic`: Reads current/next tiers and computes Draft Strength drop plus denialSignal; affectsDraftStrength=false.
- `recommendation`: Does not read tier directly; labels change indirectly through Draft Strength. SURV is a separate direct label input.

Formula dependency map:

```text
player.tier
  ├─> positionalScarcityScore (TE only)
  │     └─> rosterUtility
  │            └─> Draft Strength
  └─> tierInfo: same-tier remaining + ownerHazard
         └─> tier urgency
SURV ─────────┴─> urgency = 70% (100-SURV) + 30% tier urgency
                        └─> 11% of Draft Strength
tier boundary ─> tierCliffDiagnostic ─> exported diagnostic only (zero strategy contribution)
```

- positionalScarcity: Yes, TE only through positionalScarcityScore tier-number bonus.
- tierUrgency: Yes, tierInfo.
- survivalUrgency: Tiers do not enter survivalProbability; they enter the urgency blend beside 100-SURV.
- ownerHazard: Tier does not alter ownerHazard; ownerHazard alters tierInfo.
- recommendationLabels: Indirect through Draft Strength.
- starterTiming: Indirect through rosterUtility/Draft Strength selection; TE0 scarcity includes tier.
- rosterUtility: Direct tier effect only for TE0 through positionalScarcityScore; other positions no direct tier read.
- grading: No direct tier read in gradeTeam; indirect construction/value consequences only.
- simulatedOpponents: No direct tier read; opponents use market, profile ratios, intrinsic, bye fit, and noise.
- anythingElse: tierCliffDiagnostic and exported decision diagnostics are read-only diagnostics.

## 2. Complete current 2026 tier board

- **QB Tier 1 (1)** — Josh Allen
- **QB Tier 2 (1)** — Lamar Jackson
- **QB Tier 3 (4)** — Joe Burrow; Drake Maye; Jayden Daniels; Jalen Hurts
- **QB Tier 4 (5)** — Caleb Williams; Dak Prescott; Jaxson Dart; Trevor Lawrence; Justin Herbert
- **QB Tier 5 (5)** — Patrick Mahomes; Bo Nix; Matthew Stafford; Jared Goff; Brock Purdy
- **QB Tier 6 (3)** — Kyler Murray; Baker Mayfield; Tyler Shough
- **QB Tier 7 (5)** — Jordan Love; Malik Willis; Sam Darnold; Cam Ward; C.J. Stroud
- **QB Tier 8 (5)** — Daniel Jones; Jacoby Brissett; Bryce Young; Fernando Mendoza; Aaron Rodgers
- **QB Tier 9 (1)** — J.J. McCarthy
- **QB Unassigned (9)** — Ty Simpson; Carson Beck; Drew Allar; Cade Klubnik; Cole Payton; Taylen Green; Athan Kaliakmanis; Behren Morton; Garrett Nussmeier
- **RB Tier 1 (8)** — Jahmyr Gibbs; Bijan Robinson; Christian McCaffrey; Jonathan Taylor; Ashton Jeanty; James Cook; Devon Achane; Chase Brown
- **RB Tier 2 (3)** — Saquon Barkley; Omarion Hampton; Kenneth Walker III
- **RB Tier 3 (8)** — Derrick Henry; Javonte Williams; Jeremiyah Love; Josh Jacobs; Kyren Williams; Breece Hall; Cam Skattebo; Travis Etienne
- **RB Tier 4 (7)** — Bucky Irving; Quinshon Judkins; David Montgomery; TreVeyon Henderson; D'Andre Swift; Jadarian Price; Bhayshul Tuten
- **RB Tier 5 (8)** — Jaylen Warren; Rico Dowdle; RJ Harvey; Rhamondre Stevenson; Tony Pollard; Jonathon Brooks; J.K. Dobbins; Chuba Hubbard
- **RB Tier 6 (6)** — Jordan Mason; Blake Corum; Kyle Monangai; Rachaad White; Jacory Croskey-Merritt; Kenneth Gainwell
- **RB Tier 7 (8)** — Aaron Jones; Woody Marks; Tyrone Tracy Jr.; Zach Charbonnet; Tyjae Spears; Alvin Kamara; Chris Rodriguez Jr.; Tyler Allgeier
- **RB Tier 8 (3)** — Isiah Pacheco; Keaton Mitchell; Jonah Coleman
- **RB Tier 9 (8)** — Tank Bigsby; MarShawn Lloyd; Brian Robinson Jr.; Dylan Sampson; Mike Washington Jr.; Braelon Allen; Jaydon Blue; Justice Hill
- **RB Tier 10 (8)** — Ray Davis; Nicholas Singleton; Sean Tucker; Kaelon Black; George Holani; Jordan James; Kaytron Allen; Emmett Johnson
- **RB Tier 11 (8)** — Demond Claiborne; Ty Johnson; Kimani Vidal; Jaylen Wright; Samaje Perine; Devin Singletary; James Conner; Kareem Hunt
- **RB Tier 12 (4)** — Kaleb Johnson; Emanuel Wilson; Ollie Gordon II; DJ Giddens
- **RB Tier 13 (1)** — Brashard Smith
- **RB Unassigned (3)** — Adam Randall; Seth McGowan; Jam Miller
- **WR Tier 1 (6)** — Ja'Marr Chase; Puka Nacua; Jaxon Smith-Njigba; Amon-Ra St. Brown; Justin Jefferson; CeeDee Lamb
- **WR Tier 2 (8)** — Drake London; A.J. Brown; George Pickens; Chris Olave; Nico Collins; Malik Nabers; Rashee Rice; Zay Flowers
- **WR Tier 3 (8)** — D.J. Moore; Emeka Egbuka; DeVonta Smith; Garrett Wilson; Tetairoa McMillan; Ladd McConkey; Luther Burden III; Tee Higgins
- **WR Tier 4 (6)** — Jaylen Waddle; Terry McLaurin; Jameson Williams; Davante Adams; Rome Odunze; Mike Evans
- **WR Tier 5 (8)** — Christian Watson; Michael Wilson; Parker Washington; Wan'Dale Robinson; Marvin Harrison Jr.; Brian Thomas Jr.; Carnell Tate; Courtland Sutton
- **WR Tier 6 (2)** — Chris Godwin; D.K. Metcalf
- **WR Tier 7 (8)** — Jordyn Tyson; Alec Pierce; Michael Pittman Jr.; Josh Downs; Stefon Diggs; Quentin Johnston; Jordan Addison; Jayden Reed
- **WR Tier 8 (2)** — Makai Lemon; Jakobi Meyers
- **WR Tier 9 (7)** — Matthew Golden; Deebo Samuel; Romeo Doubs; KC Concepcion; Rashid Shaheed; De'Zhaun Stribling; Xavier Worthy
- **WR Tier 10 (8)** — Jalen Coker; Jayden Higgins; Jalen Nailor; Calvin Ridley; Khalil Shakir; Denzel Boston; Kayshon Boutte; Jerry Jeudy
- **WR Tier 11 (8)** — Jauan Jennings; Ja'Kobi Lane; Tank Dell; Malik Washington; Malachi Fields; Dontayvion Wicks; Omar Cooper Jr.; Caleb Douglas
- **WR Tier 12 (8)** — Zachariah Branch; Tyreek Hill; Jalen McMillan; Keenan Allen; Tre Tucker; Christian Kirk; Cyrus Allen; Jalen Tolbert
- **WR Tier 13 (8)** — Germie Bernard; Cooper Kupp; Adonai Mitchell; Travis Hunter; Keon Coleman; Darnell Mooney; Devaughn Vele; Antonio Williams
- **WR Tier 14 (3)** — Ryan Flournoy; Isaac TeSlaa; Tre' Harris
- **WR Tier 15 (1)** — Pat Bryant
- **WR Tier 16 (1)** — Jaylin Noel
- **WR Unassigned (22)** — Chris Brazzell II; Ted Hurst; Zavion Thomas; Chris Bell; Brenen Thompson; Elijah Sarratt; Kaden Wetjen; Skyler Bell; Bryce Lance; Colbie Young; Reggie Virgil; Kendrick Law; Kevin Coleman Jr.; Barion Brown; Josh Cameron; Malik Benson; CJ Daniels; Emmanuel Henderson Jr.; CJ Williams; Lewis Bond; Anthony Smith; Deion Burks
- **TE Tier 1 (2)** — Trey McBride; Brock Bowers
- **TE Tier 2 (1)** — Colston Loveland
- **TE Tier 3 (1)** — Tyler Warren
- **TE Tier 4 (1)** — Harold Fannin Jr.
- **TE Tier 5 (1)** — Tucker Kraft
- **TE Tier 6 (5)** — Kyle Pitts; Sam LaPorta; Isaiah Likely; Travis Kelce; George Kittle
- **TE Tier 7 (4)** — Jake Ferguson; Mark Andrews; Dalton Kincaid; Juwan Johnson
- **TE Tier 8 (1)** — Dallas Goedert
- **TE Tier 9 (5)** — Chigoziem Okonkwo; Hunter Henry; T.J. Hockenson; David Njoku; Brenton Strange
- **TE Tier 10 (5)** — Kenyon Sadiq; Oronde Gadsden II; Dalton Schultz; Greg Dulcich; Pat Freiermuth
- **TE Tier 11 (5)** — Jake Tonges; AJ Barner; Terrance Ferguson; Cade Otton; Gunnar Helm
- **TE Unassigned (21)** — Eli Stowers; Nate Boerkircher; Marlin Klein; Max Klare; Sam Roush; Oscar Delp; Will Kacmarek; Eli Raridon; Matthew Hibner; Justin Joly; Max Bredeson; Tanner Koziol; Riley Nowakowski; Joe Royer; Josh Cuevas; Seydou Traore; Bauer Sharp; Jack Endries; Jaren Kanak; Carsen Ryan; Dallen Bentley

The complete player-level board, including assigned and unassigned players, ranks, ADP, intrinsic, situation, projection, role/depth, RB contingent score, STR, SURV, and urgency, is in the CSV and JSON.

## 3. Tier granularity audit

| Position | Tiers | Assigned / all | Avg/tier | Median | Min–max | Mean ADP spread | Mean intrinsic spread | Compressed tiers |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| QB | 9 | 30 / 39 | 3.33 | 4.0 | 1–5 | 7.68 | 0.72 | 8 |
| RB | 13 | 80 / 83 | 6.15 | 8.0 | 1–8 | 11.26 | 2.09 | 12 |
| WR | 16 | 92 / 114 | 5.75 | 7.5 | 1–8 | 8.51 | 1.84 | 14 |
| TE | 11 | 31 / 52 | 2.82 | 2.0 | 1–5 | 7.13 | 0.27 | 11 |

Granularity is position-dependent: assigned QB and TE tiers average 3.33 and 2.82 players, versus 6.15 RB and 5.75 WR. The strict compression rule merged only 1 QB, 1 RB, 2 WR, and 0 TE boundaries.

37 of 45 adjacent boundaries triggered at least one predeclared suspicion flag; supported major ADP cliffs alone are not counted as suspicious.

| Pos | Boundary | Last upper | First lower | ADP gap | Intrinsic gap | STR gap | Flags |
|---|---:|---|---|---:|---:|---:|---|
| QB | 1→2 | Josh Allen | Lamar Jackson | 26.93 | 1.63 | 1.93 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER |
| QB | 2→3 | Lamar Jackson | Joe Burrow | 14.30 | 0.00 | 1.23 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER|MOSTLY_MARKET_DRIVEN |
| QB | 3→4 | Jalen Hurts | Caleb Williams | 13.06 | 0.00 | 0.63 | SUPPORTED_BY_LARGE_ADP_GAP|MOSTLY_MARKET_DRIVEN |
| QB | 4→5 | Justin Herbert | Patrick Mahomes | 23.66 | 0.00 | 1.16 | SUPPORTED_BY_LARGE_ADP_GAP|MOSTLY_MARKET_DRIVEN |
| QB | 5→6 | Brock Purdy | Kyler Murray | 14.35 | 0.00 | -1.24 | SUPPORTED_BY_LARGE_ADP_GAP|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| QB | 6→7 | Tyler Shough | Jordan Love | 13.85 | 0.00 | 1.52 | SUPPORTED_BY_LARGE_ADP_GAP|LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| QB | 7→8 | C.J. Stroud | Daniel Jones | 2.85 | 0.00 | -0.09 | LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK |
| QB | 8→9 | Aaron Rodgers | J.J. McCarthy | 58.99 | 3.80 | 1.52 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER |
| RB | 2→3 | Kenneth Walker III | Derrick Henry | 4.55 | 2.23 | 5.70 | LARGE_INTERNAL_ADP_SPREAD |
| RB | 3→4 | Travis Etienne | Bucky Irving | 0.79 | 0.00 | -1.18 | VERY_SMALL_ADP_GAP|LARGE_INTERNAL_ADP_SPREAD |
| RB | 5→6 | Chuba Hubbard | Jordan Mason | 0.76 | 0.00 | -0.66 | VERY_SMALL_ADP_GAP|LARGE_ADP_GAP_WITHOUT_TIER_BREAK |
| RB | 6→7 | Kenneth Gainwell | Aaron Jones | 16.09 | 0.00 | 0.72 | SUPPORTED_BY_LARGE_ADP_GAP|LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| RB | 7→8 | Tyler Allgeier | Isiah Pacheco | 6.93 | 0.00 | -1.77 | LARGE_INTERNAL_ADP_SPREAD|MOSTLY_MARKET_DRIVEN |
| RB | 8→9 | Jonah Coleman | Tank Bigsby | 13.99 | 0.00 | 0.78 | SUPPORTED_BY_LARGE_ADP_GAP|LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| RB | 9→10 | Justice Hill | Ray Davis | 8.36 | 0.00 | -0.84 | SUPPORTED_BY_LARGE_ADP_GAP|LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| RB | 10→11 | Emmett Johnson | Demond Claiborne | 0.44 | 0.00 | 0.94 | VERY_SMALL_ADP_GAP |
| RB | 12→13 | DJ Giddens | Brashard Smith | 97.31 | 4.29 | 3.79 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER |
| WR | 3→4 | Tee Higgins | Jaylen Waddle | 6.53 | 0.00 | -1.06 | MOSTLY_MARKET_DRIVEN |
| WR | 4→5 | Mike Evans | Christian Watson | 7.39 | 0.00 | 1.05 | MOSTLY_MARKET_DRIVEN |
| WR | 6→7 | D.K. Metcalf | Jordyn Tyson | 13.78 | 0.00 | 4.02 | SUPPORTED_BY_LARGE_ADP_GAP|MOSTLY_MARKET_DRIVEN |
| WR | 7→8 | Jayden Reed | Makai Lemon | 4.24 | 0.00 | -0.44 | MOSTLY_MARKET_DRIVEN |
| WR | 9→10 | Xavier Worthy | Jalen Coker | 13.31 | 0.00 | 0.87 | SUPPORTED_BY_LARGE_ADP_GAP|LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| WR | 10→11 | Jerry Jeudy | Jauan Jennings | 7.14 | 0.00 | 0.47 | LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| WR | 11→12 | Caleb Douglas | Zachariah Branch | 0.31 | 0.00 | 0.99 | VERY_SMALL_ADP_GAP |
| WR | 12→13 | Jalen Tolbert | Germie Bernard | 0.12 | 0.00 | 0.19 | VERY_SMALL_ADP_GAP |
| WR | 14→15 | Tre' Harris | Pat Bryant | 59.48 | -0.14 | 1.69 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER|MOSTLY_MARKET_DRIVEN |
| WR | 15→16 | Pat Bryant | Jaylin Noel | 15.96 | -0.28 | 0.12 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER|MOSTLY_MARKET_DRIVEN |
| TE | 1→2 | Brock Bowers | Colston Loveland | 24.61 | 3.86 | 2.23 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER |
| TE | 2→3 | Colston Loveland | Tyler Warren | 8.29 | 0.00 | 1.38 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER|MOSTLY_MARKET_DRIVEN |
| TE | 3→4 | Tyler Warren | Harold Fannin Jr. | 9.58 | 0.00 | 1.22 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER|MOSTLY_MARKET_DRIVEN |
| TE | 4→5 | Harold Fannin Jr. | Tucker Kraft | 6.68 | 0.00 | -0.58 | SINGLE_PLAYER_TIER|MOSTLY_MARKET_DRIVEN |
| TE | 5→6 | Tucker Kraft | Kyle Pitts | 12.80 | 0.00 | 2.61 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER|LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| TE | 6→7 | George Kittle | Jake Ferguson | 12.39 | 0.00 | -0.82 | SUPPORTED_BY_LARGE_ADP_GAP|LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| TE | 7→8 | Juwan Johnson | Dallas Goedert | 12.45 | 0.00 | -2.69 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER|MOSTLY_MARKET_DRIVEN |
| TE | 8→9 | Dallas Goedert | Chigoziem Okonkwo | 20.30 | 0.00 | 2.88 | SUPPORTED_BY_LARGE_ADP_GAP|SINGLE_PLAYER_TIER|MOSTLY_MARKET_DRIVEN |
| TE | 9→10 | Brenton Strange | Kenyon Sadiq | 6.91 | 0.00 | 1.27 | LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK|MOSTLY_MARKET_DRIVEN |
| TE | 10→11 | Pat Freiermuth | Jake Tonges | 2.45 | 0.00 | 1.44 | LARGE_INTERNAL_ADP_SPREAD|LARGE_ADP_GAP_WITHOUT_TIER_BREAK |

## 4. Static urgency versus local cliffs

### A. Static urgency high, local cliff small

| Pos | Player | Tier | Remain | Static urgency | Local drop | Demand | Denial |
|---|---|---:|---:|---:|---:|---:|---:|
| WR | Pat Bryant | 15 | 1 | 100.00 | 0.12 | 6.97 | 27.89 |
| WR | Chris Godwin | 6 | 2 | 100.00 | 0.12 | 6.97 | 23.89 |
| QB | Lamar Jackson | 2 | 1 | 100.00 | 0.00 | 2.29 | 9.18 |
| TE | Harold Fannin Jr. | 4 | 1 | 100.00 | 0.00 | 2.07 | 8.26 |
| TE | Tucker Kraft | 5 | 1 | 100.00 | 0.00 | 2.07 | 8.26 |
| WR | D.K. Metcalf | 6 | 2 | 100.00 | 0.00 | 6.97 | 23.89 |
| WR | Makai Lemon | 8 | 2 | 100.00 | 0.00 | 6.97 | 23.89 |
| WR | Jakobi Meyers | 8 | 2 | 100.00 | 0.00 | 6.97 | 23.89 |

### B. Static urgency low, local cliff large

| Pos | Player | Tier | Remain | Static urgency | Local drop | Demand | Denial |
|---|---|---:|---:|---:|---:|---:|---:|
| QB | Bryce Young | 8 | 5 | 29.53 | 3.75 | 2.29 | 0.00 |
| QB | Aaron Rodgers | 8 | 5 | 29.53 | 3.85 | 2.29 | 0.00 |
| QB | Daniel Jones | 8 | 5 | 29.53 | 3.94 | 2.29 | 0.00 |
| QB | Jacoby Brissett | 8 | 5 | 29.53 | 4.03 | 2.29 | 0.00 |

### C. Near-last in tier, next tier nearly equivalent

| Pos | Player | Tier | Remain | Static urgency | Local drop | Demand | Denial |
|---|---|---:|---:|---:|---:|---:|---:|
| WR | Pat Bryant | 15 | 1 | 100.00 | 0.12 | 6.97 | 27.89 |
| WR | Chris Godwin | 6 | 2 | 100.00 | 0.12 | 6.97 | 23.89 |
| QB | Lamar Jackson | 2 | 1 | 100.00 | 0.00 | 2.29 | 9.18 |
| TE | Harold Fannin Jr. | 4 | 1 | 100.00 | 0.00 | 2.07 | 8.26 |
| TE | Tucker Kraft | 5 | 1 | 100.00 | 0.00 | 2.07 | 8.26 |
| WR | D.K. Metcalf | 6 | 2 | 100.00 | 0.00 | 6.97 | 23.89 |
| WR | Makai Lemon | 8 | 2 | 100.00 | 0.00 | 6.97 | 23.89 |
| WR | Jakobi Meyers | 8 | 2 | 100.00 | 0.00 | 6.97 | 23.89 |

### D. Many remain, next-tier cliff severe

| Pos | Player | Tier | Remain | Static urgency | Local drop | Demand | Denial |
|---|---|---:|---:|---:|---:|---:|---:|
| WR | Ja'Marr Chase | 1 | 6 | 91.67 | 7.54 | 6.97 | 21.85 |
| WR | Puka Nacua | 1 | 6 | 91.67 | 7.11 | 6.97 | 21.38 |
| WR | Jaxon Smith-Njigba | 1 | 6 | 91.67 | 5.99 | 6.97 | 20.13 |
| WR | Amon-Ra St. Brown | 1 | 6 | 91.67 | 4.81 | 6.97 | 18.60 |
| RB | Jahmyr Gibbs | 1 | 8 | 50.28 | 5.47 | 6.38 | 5.30 |
| RB | Bijan Robinson | 1 | 8 | 50.28 | 4.76 | 6.38 | 4.59 |
| RB | Christian McCaffrey | 1 | 8 | 50.28 | 3.57 | 6.38 | 3.36 |
| QB | Bryce Young | 8 | 5 | 29.53 | 3.75 | 2.29 | 0.00 |

### E. Demand threatens exhaustion despite mild cliff

| Pos | Player | Tier | Remain | Static urgency | Local drop | Demand | Denial |
|---|---|---:|---:|---:|---:|---:|---:|
| RB | Ollie Gordon II | 12 | 4 | 100.00 | 1.81 | 6.38 | 13.50 |
| WR | Tre' Harris | 14 | 3 | 100.00 | 1.69 | 6.97 | 19.89 |
| QB | Josh Allen | 1 | 1 | 100.00 | 1.58 | 2.29 | 9.26 |
| TE | Colston Loveland | 2 | 1 | 100.00 | 1.38 | 2.07 | 8.26 |
| RB | Kenneth Walker III | 2 | 3 | 100.00 | 1.27 | 6.38 | 21.47 |
| TE | Tyler Warren | 3 | 1 | 100.00 | 1.22 | 2.07 | 8.26 |
| WR | Pat Bryant | 15 | 1 | 100.00 | 0.12 | 6.97 | 27.89 |
| WR | Chris Godwin | 6 | 2 | 100.00 | 0.12 | 6.97 | 23.89 |

### F. Low demand despite apparent boundary

No qualifying initial-state cases.

## 5. Elite TE audit

- Tier 1 (2): Trey McBride; Brock Bowers
- Tier 2 (1): Colston Loveland
- Tier 3 (1): Tyler Warren
- Tier 4 (1): Harold Fannin Jr.
- Tier 5 (1): Tucker Kraft
- Tier 6 (5): Kyle Pitts; Sam LaPorta; Isaiah Likely; Travis Kelce; George Kittle
- Tier 7 (4): Jake Ferguson; Mark Andrews; Dalton Kincaid; Juwan Johnson
- Tier 8 (1): Dallas Goedert
- Tier 9 (5): Chigoziem Okonkwo; Hunter Henry; T.J. Hockenson; David Njoku; Brenton Strange
- Tier 10 (5): Kenyon Sadiq; Oronde Gadsden II; Dalton Schultz; Greg Dulcich; Pat Freiermuth
- Tier 11 (5): Jake Tonges; AJ Barner; Terrance Ferguson; Cade Otton; Gunnar Helm
- Unassigned (21): Eli Stowers; Nate Boerkircher; Marlin Klein; Max Klare; Sam Roush; Oscar Delp; Will Kacmarek; Eli Raridon; Matthew Hibner; Justin Joly; Max Bredeson; Tanner Koziol; Riley Nowakowski; Joe Royer; Josh Cuevas; Seydou Traore; Bauer Sharp; Jack Endries; Jaren Kanak; Carsen Ryan; Dallen Bentley

- **TE0 Round 2** — baseline Trey McBride (STR 54.83, SURV 72.45, roster 77.82, urgency 68.69); neutral Trey McBride (53.10); cliff Trey McBride (54.26); compressed Trey McBride (54.83).
- **TE0 Round 4** — baseline Colston Loveland (STR 49.09, SURV 99.68, roster 74.90, urgency 63.83); neutral Colston Loveland (47.89); cliff Colston Loveland (48.66); compressed Colston Loveland (49.09).
- **TE0 Round 6** — baseline Tyler Warren (STR 54.16, SURV 87.31, roster 72.61, urgency 63.23); neutral Tyler Warren (53.35); cliff Tyler Warren (54.00); compressed Tyler Warren (54.16).
- **TE1 elite Round 6** — baseline Colston Loveland (STR 52.61, SURV 57.36, roster 37.65, urgency 63.19); neutral Colston Loveland (52.18); cliff Colston Loveland (52.96); compressed Colston Loveland (52.61).
- **TE1 Round 10** — baseline Travis Kelce (STR 46.64, SURV 96.35, roster 52.00, urgency 57.51); neutral Travis Kelce (46.40); cliff Travis Kelce (47.39); compressed Travis Kelce (46.64).
- **TE1 Round 13** — baseline Jake Ferguson (STR 60.82, SURV 3.51, roster 50.35, urgency 78.66); neutral Jake Ferguson (59.87); cliff Jake Ferguson (61.52); compressed Jake Ferguson (60.82).

Paired timing: baseline first TE 5.42, second-TE frequency 78.9%; neutral 5.83 / 74.8%; cliff 5.82 / 77.0%; compressed 5.41 / 80.1%. Removing static tiers deferred TE1 by 0.41 rounds and reduced 2TE frequency by 4.15 percentage points. That shows current tiers reward TE scarcity, but the mixed historical proxy result does not prove the amount is correct.

## 6. QB tier audit

- Tier 1 (1): Josh Allen
- Tier 2 (1): Lamar Jackson
- Tier 3 (4): Joe Burrow; Drake Maye; Jayden Daniels; Jalen Hurts
- Tier 4 (5): Caleb Williams; Dak Prescott; Jaxson Dart; Trevor Lawrence; Justin Herbert
- Tier 5 (5): Patrick Mahomes; Bo Nix; Matthew Stafford; Jared Goff; Brock Purdy
- Tier 6 (3): Kyler Murray; Baker Mayfield; Tyler Shough
- Tier 7 (5): Jordan Love; Malik Willis; Sam Darnold; Cam Ward; C.J. Stroud
- Tier 8 (5): Daniel Jones; Jacoby Brissett; Bryce Young; Fernando Mendoza; Aaron Rodgers
- Tier 9 (1): J.J. McCarthy
- Unassigned (9): Ty Simpson; Carson Beck; Drew Allar; Cade Klubnik; Cole Payton; Taylen Green; Athan Kaliakmanis; Behren Morton; Garrett Nussmeier

- **QB0 Round 5** — baseline Lamar Jackson (STR 49.39, SURV 98.68, roster 67.03, urgency 63.02); neutral Lamar Jackson (48.96); cliff Lamar Jackson (49.79); compressed Lamar Jackson (49.39).
- **QB0 Round 7** — baseline Drake Maye (STR 54.16, SURV 75.03, roster 66.65, urgency 63.53); neutral Drake Maye (53.71); cliff Drake Maye (55.10); compressed Drake Maye (54.16).
- **QB0 Round 9** — baseline Caleb Williams (STR 53.43, SURV 52.29, roster 63.50, urgency 18.25); neutral Caleb Williams (54.48); cliff Caleb Williams (55.68); compressed Caleb Williams (53.43).
- **QB1 Round 8** — baseline Jalen Hurts (STR 52.32, SURV 63.07, roster 47.50, urgency 87.87); neutral Jalen Hurts (51.07); cliff Jalen Hurts (52.26); compressed Jalen Hurts (52.32).
- **QB1 Round 10** — baseline Caleb Williams (STR 50.41, SURV 94.44, roster 47.50, urgency 3.02); neutral Caleb Williams (51.96); cliff Caleb Williams (53.61); compressed Caleb Williams (50.41).
- **QB1 Round 12** — baseline Bo Nix (STR 50.26, SURV 60.66, roster 50.35, urgency 23.75); neutral Bo Nix (51.13); cliff Bo Nix (52.21); compressed Bo Nix (50.26).

Paired timing: baseline first QB 7.50, 2QB 92.5%; neutral 7.51 / 92.5%; cliff 7.42 / 94.0%; compressed 7.40 / 92.7%. First-QB timing moved by at most 0.10 rounds and 2QB frequency by at most 1.50 percentage points. Different-bye coverage enters through independent `byeImpact`, not tiers; denial remains diagnostic-only.

## 7. RB and WR audit

Baseline averaged 1.88/2.51/2.87 RBs through R4/R6/R8 and 2.47/3.29 WRs through R6/R8. Tier-neutral: 2.07/2.65/3.04 RB and 2.41/3.24 WR. Cliff-only: 2.01/2.64/3.03 RB and 2.43/3.25 WR.

The RB tier experiment leaves production contingent-RB logic untouched, so any arm difference isolates tier behavior rather than contingent-upside retuning. WR effects arise only from tier urgency; WR has no TE-like direct tier-number scarcity bonus.

## 8–9. Paired 2026 mock experiment

Each arm completed 2,000 mocks using identical seeds 12926001–12928000, randomized cards/rooms, current profiles, the current 331-player pool, and the frozen grading system.

| Arm | NC grade/rank | First/top 3 | QB/TE timing | 2QB / 2TE | RB R4/R6/R8 | WR R6/R8 | Diff picks | Legal |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| baseline | 86.73 / 2.11 | 51.4% / 84.2% | 7.50 / 5.42 | 92.5% / 78.9% | 1.88 / 2.51 / 2.87 | 2.47 / 3.29 | 0.0% | 100.0% |
| tier-neutral | 86.82 / 2.10 | 52.1% / 83.7% | 7.51 / 5.83 | 92.5% / 74.8% | 2.07 / 2.65 / 3.04 | 2.41 / 3.24 | 36.8% | 100.0% |
| cliff-only | 87.07 / 2.00 | 53.3% / 85.1% | 7.42 / 5.82 | 94.0% / 77.0% | 2.01 / 2.64 / 3.03 | 2.43 / 3.25 | 36.7% | 100.0% |
| compressed | 86.84 / 2.09 | 52.4% / 83.9% | 7.40 / 5.41 | 92.7% / 80.1% | 2.12 / 2.67 / 3.01 | 2.28 / 3.15 | 10.7% | 100.0% |

Selected-value averages, label distributions, final positional counts, K/DST timing, bye loads, per-round/position changes, and boundary concentration are fully retained in JSON and flattened into `v0129-tier-mock-arms.csv`.

## 10. 2025 historical sensitivity

This is **sensitivity analysis, not proof of historical tier truth**. Each arm completed 1,000 paired mocks with identical seeds. Outcomes are scored only after each 170-pick draft completes.

| Arm | NC realized | Field realized | Realized first/top 3 | Grade→realized r | Grade-decile gap | 2QB / 2TE | RB / WR | Roster diff |
|---|---:|---:|---:|---:|---:|---:|---:|---:|
| tier-neutral | 1835.7 | 1738.5 | 22.8% / 53.0% | 0.168 | 90.3 | 83.6% / 84.1% | 5.09 / 6.18 | 0.0% |
| adp-band-proxy | 1839.7 | 1737.6 | 24.2% / 54.1% | 0.164 | 93.1 | 80.9% / 82.4% | 5.11 / 6.21 | 90.8% |
| cliff-only-proxy | 1829.1 | 1738.9 | 21.4% / 50.9% | 0.166 | 86.9 | 84.3% / 85.7% | 5.08 / 6.15 | 59.6% |
| compressed-proxy | 1832.9 | 1737.6 | 24.1% / 51.9% | 0.153 | 85.2 | 78.7% / 81.3% | 5.18 / 6.17 | 91.9% |

Primary historical question: relative to no tiers, the best proxy changed No Chumps realized optimal points by 4.0; the worst changed them by -6.6. These deltas cannot validate the current 2026 boundaries because the 2025 bands are synthetic.

## 11. Tier-boundary case studies

| Case | Player | Tier→next | Baseline STR | No-tier STR | Cliff STR | SURV | Demand | Remain | Estimated drop |
|---|---|---:|---:|---:|---:|---:|---:|---:|---:|
| last Tier-1 TE | Brock Bowers | 1→2 | 48.59 | 46.14 | 46.71 | 88.87 | 2.07 | 2 | 2.23 |
| last Tier-2 TE | Colston Loveland | 2→3 | 46.36 | 43.97 | 44.82 | 99.97 | 2.07 | 1 | 1.38 |
| last upper-tier QB | Josh Allen | 1→2 | 46.21 | 44.56 | 45.58 | 95.53 | 2.29 | 1 | 1.93 |
| RB major cliff | Kenneth Walker III | 2→3 | 54.15 | 52.50 | 54.15 | 30.44 | 6.38 | 3 | 5.70 |
| RB weak cliff | Tyler Allgeier | 7→8 | 41.05 | 41.04 | 41.04 | 99.97 | 6.38 | 8 | 0.00 |
| WR major cliff | CeeDee Lamb | 1→2 | 55.73 | 54.36 | 55.48 | 23.15 | 6.97 | 6 | 7.56 |
| WR weak cliff | Antonio Williams | 13→14 | 40.05 | 39.73 | 39.73 | 99.97 | 6.97 | 8 | 0.00 |

Representative-state selection changes are listed in the TE/QB sections and all six candidates per state are stored in JSON.

## 12. Tier value versus tier label

Across 170,000 candidate-choice observations, point-biserial correlations with selection were: tier number -0.044, static urgency 0.215, local cliff 0.126, depletion probability 0.136, and Draft Strength 0.387. These diagnose redundancy in selection behavior; they are not realized-outcome coefficients.

## 13. Recommendation

**G. Insufficient evidence.**

Genuine 2025 tiers are unavailable, so the historical arms can measure sensitivity to proxy structure but cannot establish the truth of current boundaries. Cliff-only improved paired 2026 No Chumps grade by 0.336 and top-three rate by 0.95 percentage points, but its 2025 proxy changed No Chumps realized optimal points by -6.6 and field realized points by 0.4.

A production change should wait for archived point-in-time tiers or forward holdout realized outcomes. The current evidence supports shadow diagnostics and boundary review, but not coefficient retuning or production replacement.

## Reproducibility and integrity

- Production commit: `c6576753f6848cf6031baf618cc8d3a6664aae3a`.
- 2026 runner: `diagnostics/v0129-tier-architecture-study.mjs`.
- 2025 runner: `diagnostics/v0129-tier-2025-sensitivity.mjs`.
- Production hashes unchanged in both studies: **PASS**.
- No production player, profile, grade, recommendation, bye, contingent-RB, adaptation, export, or PWA artifact was written.
