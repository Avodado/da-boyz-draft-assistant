# Matthew Berry / Fantasy Life public expert overlay

Retrieved Aug. 22, 2026 from the public, no-login Fantasy Life half-PPR rankings and public articles. This is a read-only diagnostic overlay: no Berry rank, tag, injury flag, or opinion is stored in the production player pool, and no coefficient or recommendation weight changes.

## Coverage and interpretation

- Public Berry rank universe: 240; matched to the app: 236.
- Pearson rank correlation against the refreshed app market rank: 0.9226.
- `rankDelta = marketRank - berryOverallRank`; positive means Berry is earlier.
- Bottom-of-board differences are strongly affected by K/DST inclusion and PPR versus half-PPR format. They are useful as audit signals, not direct production overrides.
- Fantasy Life injury badges were compared as a secondary display-only signal. CBS/NFFC and official reporting retain precedence; conflicts were not silently promoted into production.

## Public source audit

| Source | Publication/update | Format | Public fields used |
|---|---|---|---|
| [Berry rankings](https://www.fantasylife.com/fantasy-football-rankings) | UI showed a relative update about 19 hours before Aug. 22 retrieval | Half-PPR | Overall rank, player, position, team, bye, visible injury badge |
| [Higher/lower](https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower) | Jul. 28, 2026 | Berry redraft-rank context | Short source-attributed player theses/tags; no substantial text retained |
| [100 Facts](https://www.fantasylife.com/articles/fantasy/matthew-berrys-100-facts-for-the-2026-fantasy-football-season) | Aug. 13, 2026 | General 2026 redraft analysis | Short factual/analytical tags |
| [Rankings FAQ](https://www.fantasylife.com/articles/fantasy/matthew-berrys-fantasy-football-rankings-faq-kyren-williams) | Jul. 30–31, 2026 | Berry redraft-rank context | Short player-specific tags |
| [Ride or Die](https://sst.fantasylife.com/articles/fantasy/matthew-berrys-ride-or-die-for-2026-fantasy-football) | Aug. 20, 2026 | General 2026 redraft analysis | DeVonta Smith selection and short tags |

All five pages were available without a login during retrieval. No FantasyLife+ fields, customized ranking output, projections, Utilization data, Draft Champion/Companion output, Fantasy Boost, or subscriber-only text was accessed. A reliable public positional-rank/tier field was not present in the captured overall table, so `berryPositionRank` and `berryTier` remain unset rather than inferred.

## Top 25 Berry-above-market deltas

| Player | Pos | Berry | Market | Δ |
|---|---|---|---|---|
| Malik Willis | QB | 122 | 216 | 94 |
| Adonai Mitchell | WR | 160 | 249 | 89 |
| Bryce Young | QB | 168 | 253 | 85 |
| Cam Ward | QB | 151 | 235 | 84 |
| Gunnar Helm | TE | 191 | 274 | 83 |
| C.J. Stroud | QB | 142 | 223 | 81 |
| Sean Tucker | RB | 203 | 283 | 80 |
| Calvin Ridley | WR | 174 | 248 | 74 |
| Jaydon Blue | RB | 179 | 250 | 71 |
| Aaron Rodgers | QB | 172 | 242 | 70 |
| Greg Dulcich | TE | 187 | 257 | 70 |
| MarShawn Lloyd | RB | 154 | 222 | 68 |
| Kimani Vidal | RB | 211 | 279 | 68 |
| Keenan Allen | WR | 146 | 212 | 66 |
| Keaton Mitchell | RB | 138 | 203 | 65 |
| Ryan Flournoy | WR | 181 | 245 | 64 |
| Daniel Jones | QB | 165 | 224 | 59 |
| Omar Cooper Jr. | WR | 145 | 201 | 56 |
| Pat Bryant | WR | 193 | 246 | 53 |
| Dalton Schultz | TE | 167 | 219 | 52 |
| Terrance Ferguson | TE | 175 | 227 | 52 |
| Zachariah Branch | WR | 178 | 230 | 52 |
| Cade Otton | TE | 215 | 266 | 51 |
| Ted Hurst | WR | 225 | 276 | 51 |
| Emanuel Wilson | RB | 236 | 287 | 51 |

## Top 25 Berry-below-market deltas

| Player | Pos | Berry | Market | Δ |
|---|---|---|---|---|
| Seattle Seahawks | D/ST | 169 | 85 | -84 |
| Denver Broncos | D/ST | 166 | 88 | -78 |
| Minnesota Vikings | D/ST | 190 | 113 | -77 |
| Houston Texans | D/ST | 164 | 99 | -65 |
| New England Patriots | D/ST | 196 | 132 | -64 |
| Pittsburgh Steelers | D/ST | 197 | 138 | -59 |
| Los Angeles Rams | D/ST | 170 | 114 | -56 |
| Jake Bates | K | 210 | 158 | -52 |
| Harrison Mevis | K | 207 | 156 | -51 |
| Kaelon Black | RB | 219 | 168 | -51 |
| Cameron Dicker | K | 182 | 135 | -47 |
| Los Angeles Chargers | D/ST | 192 | 145 | -47 |
| Cam Little | K | 195 | 148 | -47 |
| Jason Myers | K | 184 | 139 | -45 |
| Philadelphia Eagles | D/ST | 186 | 141 | -45 |
| Andres Borregales | K | 217 | 177 | -40 |
| Alvin Kamara | RB | 194 | 157 | -37 |
| Kyle Monangai | RB | 131 | 95 | -36 |
| Brandon Aubrey | K | 152 | 116 | -36 |
| Green Bay Packers | D/ST | 199 | 164 | -35 |
| Jacksonville Jaguars | D/ST | 198 | 167 | -31 |
| Ka'imi Fairbairn | K | 171 | 144 | -27 |
| Courtland Sutton | WR | 100 | 74 | -26 |
| Chuba Hubbard | RB | 104 | 78 | -26 |
| Ja'Kobi Lane | WR | 209 | 185 | -24 |

## Position leaders

| Pos | Player | Berry | Market | Δ |
|---|---|---|---|---|
| QB | Malik Willis | 122 | 216 | 94 |
| QB | Bryce Young | 168 | 253 | 85 |
| QB | Cam Ward | 151 | 235 | 84 |
| QB | C.J. Stroud | 142 | 223 | 81 |
| QB | Aaron Rodgers | 172 | 242 | 70 |
| QB | Fernando Mendoza | 213 | 190 | -23 |
| QB | Matthew Stafford | 114 | 103 | -11 |
| QB | Josh Allen | 30 | 26 | -4 |
| QB | Joe Burrow | 62 | 58 | -4 |
| QB | Dak Prescott | 86 | 82 | -4 |
| RB | Sean Tucker | 203 | 283 | 80 |
| RB | Jaydon Blue | 179 | 250 | 71 |
| RB | MarShawn Lloyd | 154 | 222 | 68 |
| RB | Kimani Vidal | 211 | 279 | 68 |
| RB | Keaton Mitchell | 138 | 203 | 65 |
| RB | Kaelon Black | 219 | 168 | -51 |
| RB | Alvin Kamara | 194 | 157 | -37 |
| RB | Kyle Monangai | 131 | 95 | -36 |
| RB | Chuba Hubbard | 104 | 78 | -26 |
| RB | J.K. Dobbins | 110 | 90 | -20 |
| WR | Adonai Mitchell | 160 | 249 | 89 |
| WR | Calvin Ridley | 174 | 248 | 74 |
| WR | Keenan Allen | 146 | 212 | 66 |
| WR | Ryan Flournoy | 181 | 245 | 64 |
| WR | Omar Cooper Jr. | 145 | 201 | 56 |
| WR | Courtland Sutton | 100 | 74 | -26 |
| WR | Ja'Kobi Lane | 209 | 185 | -24 |
| WR | Jordyn Tyson | 116 | 97 | -19 |
| WR | Cyrus Allen | 229 | 211 | -18 |
| WR | Malik Washington | 230 | 213 | -17 |
| TE | Gunnar Helm | 191 | 274 | 83 |
| TE | Greg Dulcich | 187 | 257 | 70 |
| TE | Dalton Schultz | 167 | 219 | 52 |
| TE | Terrance Ferguson | 175 | 227 | 52 |
| TE | Cade Otton | 215 | 266 | 51 |
| TE | Jake Ferguson | 139 | 119 | -20 |
| TE | Oronde Gadsden II | 155 | 137 | -18 |
| TE | Kyle Pitts | 90 | 76 | -14 |
| TE | Harold Fannin Jr. | 85 | 72 | -13 |
| TE | Travis Kelce | 115 | 105 | -10 |

## Rookie matches

The app's conservative rookie coverage labels produced three direct matched rookie audit rows in the public Berry set.

| Player | Berry | Market | Δ |
|---|---|---|---|
| Ted Hurst | 225 | 276 | 51 |
| Chris Bell | 232 | 278 | 46 |
| Elijah Sarratt | 234 | 273 | 39 |

## Public qualitative signals

| Player | Berry | Market | Δ | Diagnostic tags | Source |
|---|---|---|---|---|---|
| D'Andre Swift | 45 | 49 | 4 | VALUE; OFFENSE_UP | https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower |
| Zay Flowers | 32 | 34 | 2 | ROLE_UP; OFFENSE_UP | https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower |
| Jordan Addison | 96 | 104 | 8 | VALUE; OFFENSE_UP | https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower |
| Kenneth Walker III | 13 | 19 | 6 | MILD_FADE; ROLE_UP | https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower |
| Tetairoa McMillan | 40 | 35 | -5 | FADE; OFFENSE_DOWN; COMPETITION_CONCERN | https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower |
| Courtland Sutton | 100 | 74 | -26 | FADE; COMPETITION_CONCERN | https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower |
| DeVonta Smith | 24 | 33 | 9 | BREAKOUT; VALUE; ROLE_UP | https://sst.fantasylife.com/articles/fantasy/matthew-berrys-ride-or-die-for-2026-fantasy-football |
| Kyren Williams | 28 | 30 | 2 | VALUE; OFFENSE_UP | https://www.fantasylife.com/articles/fantasy/matthew-berrys-fantasy-football-rankings-faq-kyren-williams |
| Malik Nabers | 25 | 28 | 3 | INJURY_CONCERN; BREAKOUT | https://www.fantasylife.com/articles/fantasy/matthew-berrys-100-facts-for-the-2026-fantasy-football-season |

## Notable injury-display conflicts

Fantasy Life showed a Questionable badge for players including Jahmyr Gibbs, Zay Flowers, Jaylen Waddle, Garrett Wilson, Jameson Williams, D.J. Moore, Josh Downs, Tony Pollard, Jordan Addison, Tyjae Spears, and Tank Bigsby while the retrieved CBS/NFFC rows did not supply the same flag. Conversely, the refreshed primary-source audit captured PUP/doubtful signals such as George Kittle, Zach Charbonnet, Alec Pierce, and Jordyn Tyson that were not displayed the same way in the public Fantasy Life table. These conflicts remain documented only; they do not override the source hierarchy.

## Incremental-value assessment and recommendation

The 0.9226 correlation confirms that Berry largely tracks the market. His clearest differentiated information is the source-attributed reasoning behind selected disagreements—role, offense, competition, and injury interpretation—rather than a new independent projection system. Examples that reinforce their numerical direction include DeVonta Smith, Zay Flowers, D'Andre Swift, Jordan Addison, and Kyren Williams on the positive side, and Courtland Sutton and Tetairoa McMillan on the negative side. Kenneth Walker is intentionally mixed: the article supplies a mild relative fade while still recognizing role strength.

Recommendation: **B. diagnostic-only data** for v0.13.0. A future **A. display-only overlay** is reasonable if the UI can clearly label half-PPR and missing coverage. **C. bounded model input** should require a separately authorized point-in-time historical validation and scoring-format calibration. **D. insufficient incremental value** is too strong because the qualitative disagreement rationales are useful, but the current evidence does not justify a production weight.

## Sources

- Rankings: https://www.fantasylife.com/fantasy-football-rankings
- Higher/lower: https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower
- 100 Facts: https://www.fantasylife.com/articles/fantasy/matthew-berrys-100-facts-for-the-2026-fantasy-football-season
- FAQ: https://www.fantasylife.com/articles/fantasy/matthew-berrys-fantasy-football-rankings-faq-kyren-williams
- Ride or Die: https://sst.fantasylife.com/articles/fantasy/matthew-berrys-ride-or-die-for-2026-fantasy-football
