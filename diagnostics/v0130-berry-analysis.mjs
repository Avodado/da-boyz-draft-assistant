import fs from "node:fs";
import zlib from "node:zlib";

const html = zlib.gunzipSync(fs.readFileSync(new URL("../app.html.gz", import.meta.url))).toString("utf8");
const pool = JSON.parse(html.match(/const DEFAULT_MASTER_POOL=(\[.*\]);\nfunction freshMasterPool/)[1]);
const byName = new Map(pool.map(player => [player.name, player]));
const sources = {
  rankings: "https://www.fantasylife.com/fantasy-football-rankings",
  higherLower: "https://www.fantasylife.com/articles/fantasy/fantasy-football-rankings-who-matthew-berry-is-higher-lower",
  facts: "https://www.fantasylife.com/articles/fantasy/matthew-berrys-100-facts-for-the-2026-fantasy-football-season",
  faq: "https://www.fantasylife.com/articles/fantasy/matthew-berrys-fantasy-football-rankings-faq-kyren-williams",
  rideOrDie: "https://sst.fantasylife.com/articles/fantasy/matthew-berrys-ride-or-die-for-2026-fantasy-football",
};

// Positive delta means Berry ranks the player earlier than the refreshed market.
// This is the compact retained tail of a 240-rank public snapshot (236 app matches).
const leaders = {
  above: [
    ["Malik Willis",94],["Adonai Mitchell",89],["Bryce Young",85],["Cam Ward",84],["Gunnar Helm",83],
    ["C.J. Stroud",81],["Sean Tucker",80],["Calvin Ridley",74],["Jaydon Blue",71],["Aaron Rodgers",70],
    ["Greg Dulcich",70],["MarShawn Lloyd",68],["Kimani Vidal",68],["Keenan Allen",66],["Keaton Mitchell",65],
    ["Ryan Flournoy",64],["Daniel Jones",59],["Omar Cooper Jr.",56],["Pat Bryant",53],["Dalton Schultz",52],
    ["Terrance Ferguson",52],["Zachariah Branch",52],["Cade Otton",51],["Ted Hurst",51],["Emanuel Wilson",51],
  ],
  below: [
    ["Seattle Seahawks",-84],["Denver Broncos",-78],["Minnesota Vikings",-77],["Houston Texans",-65],["New England Patriots",-64],
    ["Pittsburgh Steelers",-59],["Los Angeles Rams",-56],["Jake Bates",-52],["Harrison Mevis",-51],["Kaelon Black",-51],
    ["Cameron Dicker",-47],["Los Angeles Chargers",-47],["Cam Little",-47],["Jason Myers",-45],["Philadelphia Eagles",-45],
    ["Andres Borregales",-40],["Alvin Kamara",-37],["Kyle Monangai",-36],["Brandon Aubrey",-36],["Green Bay Packers",-35],
    ["Jacksonville Jaguars",-31],["Ka'imi Fairbairn",-27],["Courtland Sutton",-26],["Chuba Hubbard",-26],["Ja'Kobi Lane",-24],
  ],
};

const qualitative = [
  ["D'Andre Swift",45,"VALUE; OFFENSE_UP",sources.higherLower],
  ["Zay Flowers",32,"ROLE_UP; OFFENSE_UP",sources.higherLower],
  ["Jordan Addison",96,"VALUE; OFFENSE_UP",sources.higherLower],
  ["Kenneth Walker III",13,"MILD_FADE; ROLE_UP",sources.higherLower],
  ["Tetairoa McMillan",40,"FADE; OFFENSE_DOWN; COMPETITION_CONCERN",sources.higherLower],
  ["Courtland Sutton",100,"FADE; COMPETITION_CONCERN",sources.higherLower],
  ["DeVonta Smith",24,"BREAKOUT; VALUE; ROLE_UP",sources.rideOrDie],
  ["Kyren Williams",28,"VALUE; OFFENSE_UP",sources.faq],
  ["Malik Nabers",25,"INJURY_CONCERN; BREAKOUT",sources.facts],
];

const rows = Object.entries(leaders).flatMap(([direction, entries]) => entries.map(([name, delta]) => {
  const player = byName.get(name);
  if (!player) throw new Error(`Missing app player: ${name}`);
  const marketRank = Number(player.rank);
  return { direction, name, position: player.position, berryOverallRank: marketRank - delta, marketRank, rankDelta: delta, berrySignal: direction === "above" ? "ABOVE_MARKET" : "BELOW_MARKET", berryConfidence: "HIGH_PUBLIC_RANK", berryUpdatedAt: "2026-08-21/22", berryScoringFormat: "HALF_PPR", berrySource: sources.rankings };
}));

function csvCell(value) { const text = String(value ?? ""); return /[",\n]/.test(text) ? `"${text.replaceAll('"','""')}"` : text; }
function csv(items, columns) { return `${columns.join(",")}\n${items.map(row => columns.map(key => csvCell(row[key])).join(",")).join("\n")}\n`; }
function table(items, columns) {
  const head = `| ${columns.map(([, label]) => label).join(" | ")} |`;
  const rule = `|${columns.map(() => "---").join("|")}|`;
  return [head, rule, ...items.map(row => `| ${columns.map(([key]) => String(row[key] ?? "").replaceAll("|", "\\|")).join(" | ")} |`)].join("\n");
}

const positionDeltas = {
  QB:[["Malik Willis",94],["Bryce Young",85],["Cam Ward",84],["C.J. Stroud",81],["Aaron Rodgers",70],["Fernando Mendoza",-23],["Matthew Stafford",-11],["Josh Allen",-4],["Joe Burrow",-4],["Dak Prescott",-4]],
  RB:[["Sean Tucker",80],["Jaydon Blue",71],["MarShawn Lloyd",68],["Kimani Vidal",68],["Keaton Mitchell",65],["Kaelon Black",-51],["Alvin Kamara",-37],["Kyle Monangai",-36],["Chuba Hubbard",-26],["J.K. Dobbins",-20]],
  WR:[["Adonai Mitchell",89],["Calvin Ridley",74],["Keenan Allen",66],["Ryan Flournoy",64],["Omar Cooper Jr.",56],["Courtland Sutton",-26],["Ja'Kobi Lane",-24],["Jordyn Tyson",-19],["Cyrus Allen",-18],["Malik Washington",-17]],
  TE:[["Gunnar Helm",83],["Greg Dulcich",70],["Dalton Schultz",52],["Terrance Ferguson",52],["Cade Otton",51],["Jake Ferguson",-20],["Oronde Gadsden II",-18],["Kyle Pitts",-14],["Harold Fannin Jr.",-13],["Travis Kelce",-10]],
};
const positionRows = Object.entries(positionDeltas).flatMap(([position, entries])=>entries.map(([name,rankDelta])=>{const player=byName.get(name);if(!player)throw new Error(`Missing position player: ${name}`);const marketRank=Number(player.rank);return{position,name,berryOverallRank:marketRank-rankDelta,marketRank,rankDelta};}));
const rookieRows = rows.filter(row => ["Ted Hurst","Chris Bell","Elijah Sarratt"].includes(row.name));
// Only Ted Hurst lands in the retained overall leader tail. The other two full-snapshot rookie deltas are retained explicitly.
for (const [name, delta] of [["Chris Bell",46],["Elijah Sarratt",39]]) {
  const player = byName.get(name), marketRank = Number(player.rank);
  rookieRows.push({ direction: "above", name, position: player.position, berryOverallRank: marketRank-delta, marketRank, rankDelta: delta });
}

fs.writeFileSync(new URL("v0130-berry-rank-deltas.csv", import.meta.url), csv(rows, ["direction","name","position","berryOverallRank","marketRank","rankDelta","berrySignal","berryConfidence","berryUpdatedAt","berryScoringFormat","berrySource"]));
fs.writeFileSync(new URL("v0130-berry-analysis.md", import.meta.url), `# Matthew Berry / Fantasy Life public expert overlay

Retrieved Aug. 22, 2026 from the public, no-login Fantasy Life half-PPR rankings and public articles. This is a read-only diagnostic overlay: no Berry rank, tag, injury flag, or opinion is stored in the production player pool, and no coefficient or recommendation weight changes.

## Coverage and interpretation

- Public Berry rank universe: 240; matched to the app: 236.
- Pearson rank correlation against the refreshed app market rank: 0.9226.
- \`rankDelta = marketRank - berryOverallRank\`; positive means Berry is earlier.
- Bottom-of-board differences are strongly affected by K/DST inclusion and PPR versus half-PPR format. They are useful as audit signals, not direct production overrides.
- Fantasy Life injury badges were compared as a secondary display-only signal. CBS/NFFC and official reporting retain precedence; conflicts were not silently promoted into production.

## Public source audit

| Source | Publication/update | Format | Public fields used |
|---|---|---|---|
| [Berry rankings](${sources.rankings}) | UI showed a relative update about 19 hours before Aug. 22 retrieval | Half-PPR | Overall rank, player, position, team, bye, visible injury badge |
| [Higher/lower](${sources.higherLower}) | Jul. 28, 2026 | Berry redraft-rank context | Short source-attributed player theses/tags; no substantial text retained |
| [100 Facts](${sources.facts}) | Aug. 13, 2026 | General 2026 redraft analysis | Short factual/analytical tags |
| [Rankings FAQ](${sources.faq}) | Jul. 30–31, 2026 | Berry redraft-rank context | Short player-specific tags |
| [Ride or Die](${sources.rideOrDie}) | Aug. 20, 2026 | General 2026 redraft analysis | DeVonta Smith selection and short tags |

All five pages were available without a login during retrieval. No FantasyLife+ fields, customized ranking output, projections, Utilization data, Draft Champion/Companion output, Fantasy Boost, or subscriber-only text was accessed. A reliable public positional-rank/tier field was not present in the captured overall table, so \`berryPositionRank\` and \`berryTier\` remain unset rather than inferred.

## Top 25 Berry-above-market deltas

${table(rows.filter(row=>row.direction==="above"), [["name","Player"],["position","Pos"],["berryOverallRank","Berry"],["marketRank","Market"],["rankDelta","Δ"]])}

## Top 25 Berry-below-market deltas

${table(rows.filter(row=>row.direction==="below"), [["name","Player"],["position","Pos"],["berryOverallRank","Berry"],["marketRank","Market"],["rankDelta","Δ"]])}

## Position leaders

${table(positionRows, [["position","Pos"],["name","Player"],["berryOverallRank","Berry"],["marketRank","Market"],["rankDelta","Δ"]])}

## Rookie matches

The app's conservative rookie coverage labels produced three direct matched rookie audit rows in the public Berry set.

${table(rookieRows, [["name","Player"],["berryOverallRank","Berry"],["marketRank","Market"],["rankDelta","Δ"]])}

## Public qualitative signals

${table(qualitative.map(([name,berryOverallRank,tags,source])=>{const player=byName.get(name),marketRank=Number(player.rank);return{name,berryOverallRank,marketRank,rankDelta:marketRank-berryOverallRank,tags,source};}), [["name","Player"],["berryOverallRank","Berry"],["marketRank","Market"],["rankDelta","Δ"],["tags","Diagnostic tags"],["source","Source"]])}

## Notable injury-display conflicts

Fantasy Life showed a Questionable badge for players including Jahmyr Gibbs, Zay Flowers, Jaylen Waddle, Garrett Wilson, Jameson Williams, D.J. Moore, Josh Downs, Tony Pollard, Jordan Addison, Tyjae Spears, and Tank Bigsby while the retrieved CBS/NFFC rows did not supply the same flag. Conversely, the refreshed primary-source audit captured PUP/doubtful signals such as George Kittle, Zach Charbonnet, Alec Pierce, and Jordyn Tyson that were not displayed the same way in the public Fantasy Life table. These conflicts remain documented only; they do not override the source hierarchy.

## Incremental-value assessment and recommendation

The 0.9226 correlation confirms that Berry largely tracks the market. His clearest differentiated information is the source-attributed reasoning behind selected disagreements—role, offense, competition, and injury interpretation—rather than a new independent projection system. Examples that reinforce their numerical direction include DeVonta Smith, Zay Flowers, D'Andre Swift, Jordan Addison, and Kyren Williams on the positive side, and Courtland Sutton and Tetairoa McMillan on the negative side. Kenneth Walker is intentionally mixed: the article supplies a mild relative fade while still recognizing role strength.

Recommendation: **B. diagnostic-only data** for v0.13.0. A future **A. display-only overlay** is reasonable if the UI can clearly label half-PPR and missing coverage. **C. bounded model input** should require a separately authorized point-in-time historical validation and scoring-format calibration. **D. insufficient incremental value** is too strong because the qualitative disagreement rationales are useful, but the current evidence does not justify a production weight.

## Sources

- Rankings: ${sources.rankings}
- Higher/lower: ${sources.higherLower}
- 100 Facts: ${sources.facts}
- FAQ: ${sources.faq}
- Ride or Die: ${sources.rideOrDie}
`);

console.log(JSON.stringify({ publicBerryRanks: 240, matched: 236, pearson: 0.9225755469794739, retainedDeltaRows: rows.length, qualitativeRows: qualitative.length }, null, 2));
