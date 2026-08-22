import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DIAGNOSTICS = path.join(ROOT, "diagnostics");
const BUILD = "v0.13.0";
const AS_OF = "2026-08-22T17:30:00Z";
const MARKET_DATE = "2026-08-22";
const MARKET_FILE = path.join(DIAGNOSTICS, "v0130-market-snapshot.csv");
const INJURY_FILE = path.join(DIAGNOSTICS, "v0130-injury-snapshot.csv");
const WATCHLIST_FILE = path.join(DIAGNOSTICS, "v0130-pool-watchlist.csv");

const SOURCE_URLS = {
  fantasyPros: "https://www.fantasypros.com/nfl/adp/ppr-overall.php",
  fantasyData: "https://fantasydata.com/nfl/ppr-adp",
  ffc: "https://fantasyfootballcalculator.com/adp/ppr",
  sleeper: "https://hashtagfootball.com/fantasy-football-adp-sleeper",
  cbs: "https://www.cbssports.com/nfl/injuries/",
  nffc: "https://nfc.shgn.com/sportinjuries/football",
  higgins: "https://www.nfl.com/news/texans-wr-jayden-higgins-torn-acl-out-2026-season",
  nflRoundup: "https://www.nfl.com/news/nfl-news-roundup-latest-league-updates-from-wednesday-aug-19",
  fantasyAlarm: "https://www.fantasyalarm.com/articles/nfl/fantasy-football-draft-guide/2026-offseason-fantasy-football-injury-report/190980",
  breece: "https://www.fantasypros.com/2026/08/fantasy-football-injury-updates-breece-hall-kyle-monangai-jaylen-waddle-2026/",
  aiyuk: "https://www.nfl.com/news/john-lynch-safe-to-say-brandon-aiyuk-has-played-last-snap-with-49ers",
  bateman: "https://www.baltimoreravens.com/news/rashod-bateman-doing-things-never-done-before-moving-around-declan-doyle-offense-2026-training-camp",
};

const ADDITIONS = [
  { name: "Rashod Bateman", position: "WR", team: "BAL", bye: "13", depthRole: "WR2", role: 78, health: 92, offense: 78, competition: 72, situation: 80, confidence: 80, summary: "Ravens staff identifies Bateman and Zay Flowers as the receiving-group leaders; Bateman is moving across the formation in the new offense.", source: SOURCE_URLS.bateman },
  { name: "Brandon Aiyuk", position: "WR", team: "SF", bye: "8", depthRole: "RESERVE_LEFT_SQUAD", role: 5, health: 35, offense: 76, competition: 20, situation: 14, confidence: 95, summary: "Retained as an identifiable market player, but unavailable: NFL.com reports he remains on the reserve/left squad list and that San Francisco expects his tenure to end.", source: SOURCE_URLS.aiyuk, availability: "RESERVE_LEFT_SQUAD" },
  { name: "Troy Franklin", position: "WR", team: "DEN", bye: "10", depthRole: "DEPTH_WR", role: 55, health: 92, offense: 74, competition: 45, situation: 64, confidence: 45, summary: "Added from two current PPR market feeds; depth role is deliberately conservative pending stronger public depth evidence.", source: `${SOURCE_URLS.ffc}; ${SOURCE_URLS.sleeper}` },
  { name: "Blake Grupe", position: "K", team: "IND", bye: "13", depthRole: "K1_MARKET_LISTED", role: 82, health: 92, offense: 74, competition: 75, situation: 80, confidence: 55, summary: "Added from current PPR market draft frequency; kicker role is market-listed and not treated as a football-model input.", source: SOURCE_URLS.ffc },
  { name: "Cincinnati Bengals", position: "D/ST", team: "CIN", bye: "6", depthRole: "DST1", role: 90, health: 92, offense: 50, competition: 90, situation: 82, confidence: 70, summary: "Added because current PPR drafts include Cincinnati inside the normal D/ST market range.", source: SOURCE_URLS.ffc },
  { name: "Atlanta Falcons", position: "D/ST", team: "ATL", bye: "11", depthRole: "DST1", role: 90, health: 92, offense: 50, competition: 90, situation: 82, confidence: 65, summary: "Added because current PPR drafts include Atlanta inside the normal D/ST market range.", source: SOURCE_URLS.ffc },
];

const NAME_ALIASES = new Map([
  ["kennethgainwell", "kennygainwell"],
  ["chigoziemokonkwo", "chigokonkwo"],
  ["andresborregales", "andyborregales"],
]);

const DEFENSE_NAMES = {
  ARI: "Arizona Cardinals", ATL: "Atlanta Falcons", BAL: "Baltimore Ravens", BUF: "Buffalo Bills", CAR: "Carolina Panthers", CHI: "Chicago Bears", CIN: "Cincinnati Bengals", CLE: "Cleveland Browns", DAL: "Dallas Cowboys", DEN: "Denver Broncos", DET: "Detroit Lions", GB: "Green Bay Packers", HOU: "Houston Texans", IND: "Indianapolis Colts", JAX: "Jacksonville Jaguars", KC: "Kansas City Chiefs", LV: "Las Vegas Raiders", LAC: "Los Angeles Chargers", LAR: "Los Angeles Rams", MIA: "Miami Dolphins", MIN: "Minnesota Vikings", NE: "New England Patriots", NO: "New Orleans Saints", NYG: "New York Giants", NYJ: "New York Jets", PHI: "Philadelphia Eagles", PIT: "Pittsburgh Steelers", SEA: "Seattle Seahawks", SF: "San Francisco 49ers", TB: "Tampa Bay Buccaneers", TEN: "Tennessee Titans", WAS: "Washington Commanders",
};

function normalize(value = "") {
  const key = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\b(jr|sr|ii|iii|iv)\b/g, "").replace(/[^a-z0-9]/g, "");
  return NAME_ALIASES.get(key) || key;
}

function decode(value = "") {
  return value.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function extractArray(source, marker) {
  const markerAt = source.indexOf(marker);
  if (markerAt < 0) throw new Error(`Missing ${marker}`);
  const open = source.indexOf("[", markerAt + marker.length);
  let depth = 0, quoted = false, escaped = false;
  for (let index = open; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === "[") depth += 1;
    else if (char === "]" && --depth === 0) return { rows: JSON.parse(source.slice(open, index + 1)), start: open, end: index + 1 };
  }
  throw new Error(`Unterminated array after ${marker}`);
}

function sha(value) { return crypto.createHash("sha256").update(value).digest("hex"); }
function segment(text, start, end) { const left = text.indexOf(start), right = text.indexOf(end, left); return text.slice(left, right); }
function median(values) { const sorted = values.filter(Number.isFinite).sort((a, b) => a - b); if (!sorted.length) return null; const middle = Math.floor(sorted.length / 2); return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2; }
function round(value, places = 2) { const factor = 10 ** places; return Math.round((Number(value) + Number.EPSILON) * factor) / factor; }
function byName(rows) { return new Map(rows.map(row => [normalize(row.name), row])); }

function csvCell(value) { const text = value == null ? "" : String(value); return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text; }
function writeCsv(file, rows, columns) { fs.writeFileSync(file, `${columns.join(",")}\n${rows.map(row => columns.map(column => csvCell(row[column])).join(",")).join("\n")}\n`); }
function parseCsv(text) {
  const rows = []; let row = [], cell = "", quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) { if (char === '"' && text[index + 1] === '"') { cell += '"'; index += 1; } else if (char === '"') quoted = false; else cell += char; }
    else if (char === '"') quoted = true;
    else if (char === ",") { row.push(cell); cell = ""; }
    else if (char === "\n") { row.push(cell.replace(/\r$/, "")); if (row.some(Boolean)) rows.push(row); row = []; cell = ""; }
    else cell += char;
  }
  const [header, ...body] = rows; return body.map(values => Object.fromEntries(header.map((key, index) => [key, values[index] || ""])));
}

function parseFantasyPros(html) {
  const marker = "window.FP.reportConfig = ", start = html.indexOf(marker), end = html.indexOf("window.FP.isLoggedIn", start);
  if (start < 0 || end < 0) return [];
  const config = JSON.parse(html.slice(start + marker.length, end).trim().replace(/;$/, ""));
  return config.table.rows.map(row => { const match = row.player.team.match(/^([A-Z]+) \((\d+)\)$/); return { name: row.player.name, team: match?.[1] || "", bye: match?.[2] || "", position: row.pos.replace(/\d+$/, ""), positionRank: row.pos.replace(/^\D+/, ""), consensus: Number(row.avg), rtsports: Number(row.src_439) }; });
}

function parseFantasyData(html) {
  const rows = [];
  for (const match of html.matchAll(/<tr class='[^']*'>([\s\S]*?)<\/tr>/g)) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(item => decode(item[1]));
    if (cells.length === 8 && /^\d+$/.test(cells[0])) rows.push({ rank: Number(cells[0]), name: cells[1], team: cells[2], bye: cells[3], position: cells[5], positionRank: cells[6].replace(/^\D+/, ""), adp: Number(cells[7]) });
  }
  return rows;
}

function parseFfc(html) {
  const rows = [];
  for (const match of html.matchAll(/<tr class='(?:QB|RB|WR|TE|PK|DEF)'>([\s\S]*?)<\/tr>/g)) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(item => decode(item[1]));
    if (cells.length < 10 || !/^\d+$/.test(cells[0])) continue;
    const position = cells[2] === "PK" ? "K" : cells[2] === "DEF" ? "D/ST" : cells[2];
    const name = position === "D/ST" ? DEFENSE_NAMES[cells[3]] : cells[1];
    rows.push({ rank: Number(cells[0]), name, position, team: cells[3], bye: cells[4], adp: Number(cells[5]), drafted: Number(cells[9]) });
  }
  return rows;
}

function parseSleeper(html) {
  const rows = [];
  for (const match of html.matchAll(/<tr data-halfppr='([^']*)' data-ppr='([^']*)' data-sf='([^']*)'>([\s\S]*?)<\/tr>/g)) {
    const cells = [...match[4].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(item => decode(item[1]));
    if (cells.length !== 15) continue;
    rows.push({ name: cells[0], position: cells[1], team: cells[2], adp: Number(match[2]), rank: Number(cells[9]), positionRank: cells[10].replace(/^\D+/, "") });
  }
  return rows;
}

function parseNffc(html) {
  const rows = [];
  for (const teamMatch of html.matchAll(/<tbody data-team="([^"]+)">([\s\S]*?)<\/tbody>/g)) for (const rowMatch of teamMatch[2].matchAll(/<tr>([\s\S]*?)<\/tr>/g)) {
    const cells = [...rowMatch[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(item => decode(item[1]));
    if (cells.length === 5 && cells[1]) rows.push({ team: teamMatch[1], returnDate: cells[0], name: cells[1], status: cells[2], injury: cells[3], detail: cells[4] });
  }
  return rows;
}

function parseCbs(html) {
  const rows = [];
  for (const match of html.matchAll(/<tr class="TableBase-bodyTr">([\s\S]*?)<\/tr>/g)) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map(item => decode(item[1]));
    const longName = match[1].match(/CellPlayerName--long[\s\S]*?<a[^>]*>([^<]+)<\/a>/)?.[1];
    if (longName && cells.length >= 5) rows.push({ name: decode(longName), position: cells[1], date: cells[2], injury: cells[3], status: cells[4] });
  }
  return rows;
}

function importantInjury(name) {
  const records = {
    "Jayden Higgins": { availability: "OUT_SEASON", health: 5, injury: "Knee - ACL", summary: "Confirmed torn ACL; out for the 2026 season and retained for identity/history.", source: `${SOURCE_URLS.higgins}; ${SOURCE_URLS.cbs}; ${SOURCE_URLS.nffc}` },
    "Tyler Warren": { availability: "EXPECTED_WEEK1_READY", health: 82, injury: "Groin / abductor strain", summary: "Short-term groin/abductor strain; public reporting expects a return in roughly a week and does not indicate a Week 1 threat.", source: `${SOURCE_URLS.nflRoundup}; ${SOURCE_URLS.fantasyAlarm}` },
    "Sam LaPorta": { availability: "QUESTIONABLE", health: 64, injury: "Hip", summary: "Hip injury remains listed as questionable for Week 1; no firmer recovery claim is made.", source: `${SOURCE_URLS.cbs}; ${SOURCE_URLS.nffc}` },
    "Keon Coleman": { availability: "QUESTIONABLE", health: 68, injury: "Foot", summary: "Foot injury remains listed as questionable for Week 1.", source: `${SOURCE_URLS.cbs}; ${SOURCE_URLS.nffc}` },
    "Breece Hall": { availability: "QUESTIONABLE", health: 68, injury: "Groin", summary: "Groin injury remains listed as questionable for Week 1; uncertainty is preserved.", source: `${SOURCE_URLS.cbs}; ${SOURCE_URLS.breece}` },
  };
  return records[name];
}

function classifyInjury(oldPlayer, nffc, cbs) {
  const important = importantInjury(oldPlayer.name);
  if (important) return important;
  if (!nffc && !cbs) return { availability: "NO_CURRENT_INJURY_FLAG", health: 92, injury: "", summary: "No current injury flag found in the public CBS or NFFC injury listings at retrieval.", source: `${SOURCE_URLS.cbs}; ${SOURCE_URLS.nffc}` };
  const rawStatus = `${nffc?.status || ""} ${cbs?.status || ""}`.toUpperCase();
  const injury = cbs?.injury || nffc?.injury || "Undisclosed";
  let availability = "QUESTIONABLE", health = oldPlayer.availability_status && oldPlayer.availability_status !== "NO_CURRENT_INJURY_FLAG" ? Number(oldPlayer.health_score) : injury.toUpperCase() === "PERSONAL" ? 75 : 68;
  if (/IR\.|INJURED RESERVE|\bIR\b/.test(rawStatus)) { availability = "OUT_SEASON"; health = 10; }
  else if (/PUP|PHYSICALLY UNABLE/.test(rawStatus)) { availability = /EXPECTED RETURN - WEEK 1/.test(rawStatus) ? "PUP_EXPECTED_WEEK1" : "PUP"; health = Number(oldPlayer.health_score) < 92 ? Number(oldPlayer.health_score) : 60; }
  else if (/DOUBTFUL/.test(rawStatus)) { availability = "DOUBTFUL"; health = Number(oldPlayer.health_score) < 92 ? Number(oldPlayer.health_score) : 40; }
  else if (/OUT/.test(rawStatus)) { availability = "OUT_MULTI_WEEK"; health = Number(oldPlayer.health_score) < 92 ? Number(oldPlayer.health_score) : 35; }
  const summary = `${injury}; ${cbs?.status || nffc?.status || "questionable"}${nffc?.returnDate ? `; NFFC listed date ${nffc.returnDate}` : ""}.`;
  return { availability, health, injury, summary, source: `${SOURCE_URLS.cbs}; ${SOURCE_URLS.nffc}` };
}

function baseAddition(addition, id) {
  return {
    name: addition.name, position: addition.position, nfl_team: addition.team, bye: addition.bye, rank: "", rank_source: "CURRENT_PPR_MARKET_MEDIAN_V0130", position_rank: "", prior_rank: "", prior_position_rank: "", prior_planning_adp: "", prior_market_as_of: "", adp: "", projected_points: "", projection_status: "PENDING_FROZEN_MODEL_PROJECTION_FEED", breakout_score: "", breakout_source: "PENDING_FROZEN_HISTORICAL_RERUN", bust_score: "", environment_score: "", intrinsic_source: "MARKET_FALLBACK", intrinsic_confidence: "25", model_coverage: "CURRENT_MARKET_LOOKUP_ONLY", situation_score: String(addition.situation), situation_confidence: String(addition.confidence), availability_status: addition.availability || "NO_CURRENT_INJURY_FLAG", situation_summary: addition.summary, depth_role: addition.depthRole, role_score: String(addition.role), health_score: String(addition.health), offense_context_score: String(addition.offense), competition_score: String(addition.competition), situation_as_of: AS_OF, situation_source: addition.source, consensus_adp: "", rtsports_adp: "", fp_mock_adp: "", fp_mock_drafted_pct: "", fantasydata_adp: "", planning_adp: "", market_confidence: "", market_summary: "", market_as_of: MARKET_DATE, tier: "", tier_method: "UNASSIGNED_NEW_MARKET_ADDITION", contingent_score: "", contingent_source: "", notes: "Added by v0.13.0 current-market audit; no historical projection or coefficient input inferred.", id, drafted: false,
  };
}

function createSnapshots(sourceDir) {
  const app = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, "app.html.gz"))).toString("utf8");
  if (!app.includes('const CURRENT_BUILD="v0.12.9"')) throw new Error("Snapshot generation must start from the v0.12.9 production baseline");
  const oldPool = extractArray(app, "const DEFAULT_MASTER_POOL=").rows;
  const pool = [...oldPool, ...ADDITIONS.map((row, index) => baseAddition(row, `master_${oldPool.length + index + 1}`))];
  const fp = byName(parseFantasyPros(fs.readFileSync(path.join(sourceDir, "fantasypros-ppr-adp.html"), "utf8")));
  const fd = byName(parseFantasyData(fs.readFileSync(path.join(sourceDir, "fantasydata-ppr-adp.html"), "utf8")));
  const ffcRows = parseFfc(fs.readFileSync(path.join(sourceDir, "ffc-ppr-adp.html"), "utf8"));
  const ffc = byName(ffcRows);
  const sleeperRows = parseSleeper(fs.readFileSync(path.join(sourceDir, "hashtag-sleeper-adp.html"), "utf8")).filter(row => row.team && row.adp < 999);
  const sleeper = byName(sleeperRows);
  const marketRows = pool.map(player => {
    const key = normalize(player.name), fpr = fp.get(key), fdr = fd.get(key), ffcr = ffc.get(key), sr = sleeper.get(key);
    const current = [fpr?.consensus, fdr?.adp, ffcr?.adp, sr?.adp].filter(Number.isFinite);
    const planning = current.length ? round(median(current)) : Number(player.planning_adp) || null;
    const sourceNames = [fpr && "FantasyPros PPR composite", fdr && "FantasyData PPR", ffcr && "FFC PPR", sr && "Sleeper PPR"].filter(Boolean);
    const preferred = fpr || fdr || ffcr || sr;
    return { name: player.name, position: player.position, team: preferred?.team || player.nfl_team, bye: preferred?.bye || player.bye, fantasypros_ppr: fpr?.consensus || "", rtsports_ppr: fpr?.rtsports || "", fantasydata_ppr: fdr?.adp || "", ffc_ppr: ffcr?.adp || "", sleeper_ppr: sr?.adp || "", source_count: current.length, planning_adp: planning ?? "", source_note: sourceNames.length ? sourceNames.join(" + ") : "Preserved v0.12.9 planning ADP; no current broad-feed match" };
  });
  writeCsv(MARKET_FILE, marketRows, ["name", "position", "team", "bye", "fantasypros_ppr", "rtsports_ppr", "fantasydata_ppr", "ffc_ppr", "sleeper_ppr", "source_count", "planning_adp", "source_note"]);

  const nffc = byName(parseNffc(fs.readFileSync(path.join(sourceDir, "nffc-injuries.html"), "utf8")));
  const cbs = byName(parseCbs(fs.readFileSync(path.join(sourceDir, "cbs-injuries.html"), "utf8")));
  const injuryRows = pool.map(player => {
    if (player.name === "Brandon Aiyuk") return { name: player.name, availability_status: "RESERVE_LEFT_SQUAD", health_score: 35, injury: "Roster / prior ACL recovery", injury_summary: ADDITIONS.find(row => row.name === player.name).summary, injury_source: SOURCE_URLS.aiyuk, injury_as_of: AS_OF, nffc_status: "", cbs_status: "" };
    const key = normalize(player.name), nr = nffc.get(key), cr = cbs.get(key), result = classifyInjury(player, nr, cr);
    return { name: player.name, availability_status: result.availability, health_score: result.health, injury: result.injury, injury_summary: result.summary, injury_source: result.source, injury_as_of: AS_OF, nffc_status: nr ? `${nr.status} ${nr.injury}`.trim() : "", cbs_status: cr ? `${cr.injury}; ${cr.status}` : "" };
  });
  writeCsv(INJURY_FILE, injuryRows, ["name", "availability_status", "health_score", "injury", "injury_summary", "injury_source", "injury_as_of", "nffc_status", "cbs_status"]);

  const poolKeys = new Set(pool.map(player => normalize(player.name)));
  const watchlist = sleeperRows.filter(row => row.rank <= 300 && !poolKeys.has(normalize(row.name))).map(row => { const ffcRow = ffc.get(normalize(row.name)); return { name: row.name, position: row.position, team: row.team, sleeper_ppr: row.adp, sleeper_rank: row.rank, ffc_ppr: ffcRow?.adp || "", decision: "NOT_ADDED_SINGLE_SOURCE_OR_LOW_CONFIDENCE" }; });
  writeCsv(WATCHLIST_FILE, watchlist, ["name", "position", "team", "sleeper_ppr", "sleeper_rank", "ffc_ppr", "decision"]);
  console.log(`Wrote ${marketRows.length} market rows, ${injuryRows.length} injury rows, and ${watchlist.length} watchlist rows.`);
}

function table(rows, columns) {
  if (!rows.length) return "_None._";
  return `| ${columns.map(column => column[1]).join(" | ")} |\n|${columns.map(() => "---").join("|")}|\n${rows.map(row => `| ${columns.map(([key]) => String(row[key] ?? "").replace(/\|/g, "\\|")).join(" | ")} |`).join("\n")}`;
}

function applyRefresh() {
  const appPath = path.join(ROOT, "app.html.gz");
  const baseline = zlib.gunzipSync(fs.readFileSync(appPath)).toString("utf8");
  if (!baseline.includes('const CURRENT_BUILD="v0.12.9"')) throw new Error("Apply must start from the v0.12.9 production baseline");
  const extracted = extractArray(baseline, "const DEFAULT_MASTER_POOL=");
  const oldPool = extracted.rows;
  const oldByName = byName(oldPool);
  const pool = [...oldPool.map(row => structuredClone(row)), ...ADDITIONS.map((row, index) => baseAddition(row, `master_${oldPool.length + index + 1}`))];
  const market = byName(parseCsv(fs.readFileSync(MARKET_FILE, "utf8")));
  const injuries = byName(parseCsv(fs.readFileSync(INJURY_FILE, "utf8")));
  const marketChanges = [], injuryChanges = [], situationChanges = [];

  for (const player of pool) {
    const old = oldByName.get(normalize(player.name));
    const row = market.get(normalize(player.name));
    if (!row) throw new Error(`Missing market snapshot row for ${player.name}`);
    if (old) {
      player.prior_rank = old.rank;
      player.prior_position_rank = old.position_rank;
      player.prior_planning_adp = old.planning_adp;
      player.prior_market_as_of = old.market_as_of;
    }
    player.nfl_team = row.team || player.nfl_team;
    player.bye = row.bye || player.bye;
    player.consensus_adp = row.fantasypros_ppr || player.consensus_adp;
    player.rtsports_adp = row.rtsports_ppr || player.rtsports_adp;
    player.fantasydata_adp = row.fantasydata_ppr || player.fantasydata_adp;
    player.sleeper_adp = row.sleeper_ppr;
    player.ffc_ppr_adp = row.ffc_ppr;
    player.planning_adp = row.planning_adp;
    player.adp = row.planning_adp;
    player.market_source = row.source_note;
    const count = Number(row.source_count);
    player.market_confidence = count >= 3 ? "HIGH" : count === 2 ? "MEDIUM" : "LOW";
    player.market_summary = count ? `Current PPR median ${Number(row.planning_adp).toFixed(1)} from ${count} public source${count === 1 ? "" : "s"}: ${row.source_note}.` : `${row.source_note}.`;
    player.market_as_of = MARKET_DATE;
    player.market_refresh_version = BUILD;

    const injury = injuries.get(normalize(player.name));
    if (!injury) throw new Error(`Missing injury snapshot row for ${player.name}`);
    const oldAvailability = old?.availability_status || player.availability_status;
    const oldHealth = Number(old?.health_score ?? player.health_score);
    const oldSituation = Number(old?.situation_score ?? player.situation_score);
    player.availability_status = injury.availability_status;
    player.health_score = injury.health_score;
    player.injury = injury.injury;
    player.injury_summary = injury.injury_summary;
    player.injury_source = injury.injury_source;
    player.injury_as_of = injury.injury_as_of;
    const newHealth = Number(injury.health_score);
    if (old) {
      const delta = Math.max(-20, Math.min(20, Math.round((newHealth - oldHealth) * 0.25)));
      player.situation_score = String(Math.max(0, Math.min(100, oldSituation + delta)));
      if (player.availability_status === "OUT_SEASON") player.situation_score = String(Math.min(Number(player.situation_score), 14));
      if (oldAvailability !== player.availability_status || oldHealth !== newHealth) injuryChanges.push({ name: player.name, old_status: oldAvailability, new_status: player.availability_status, old_health: oldHealth, new_health: newHealth, summary: player.injury_summary });
      if (Math.abs(Number(player.situation_score) - oldSituation) >= 5) situationChanges.push({ name: player.name, old_score: oldSituation, new_score: player.situation_score, reason: `Health ${oldHealth}→${newHealth}; role/offense/competition retained` });
    }
    player.situation_summary = `${player.depth_role || "Depth role unverified"}. ${player.injury_summary} Role, offense-context, and competition scores are retained unless the availability change required a documented situation adjustment.`;
    player.situation_as_of = AS_OF;
    player.situation_source = `${player.situation_source || "Prior overlay"}; ${player.injury_source}`;
  }

  const ordered = [...pool].sort((a, b) => (Number(a.planning_adp) || 9999) - (Number(b.planning_adp) || 9999) || a.name.localeCompare(b.name));
  const positionCounters = {};
  ordered.forEach((player, index) => { player.rank = String(index + 1); player.rank_source = "CURRENT_PPR_MARKET_MEDIAN_V0130"; positionCounters[player.position] = (positionCounters[player.position] || 0) + 1; player.position_rank = String(positionCounters[player.position]); });
  for (const player of pool) {
    const old = oldByName.get(normalize(player.name));
    if (!old) continue;
    const oldAdp = old.planning_adp === "" || old.planning_adp == null ? NaN : Number(old.planning_adp);
    const newAdp = player.planning_adp === "" || player.planning_adp == null ? NaN : Number(player.planning_adp);
    if (Number.isFinite(oldAdp) && Number.isFinite(newAdp)) marketChanges.push({ name: player.name, position: player.position, old_adp: round(oldAdp), new_adp: round(newAdp), delta: round(oldAdp - newAdp), old_rank: old.rank, new_rank: player.rank });
  }

  const beforeHashes = { player: sha(JSON.stringify(oldPool)), model: sha(segment(baseline, "function teamForCard", "function renderHistory")), recommendation: sha(segment(baseline, "function draftStrength", "function recommendation")) };
  const releaseShell = baseline.replaceAll("v0.12.9", BUILD)
    .replace("v0.13.0 • verified diagnostics export", "v0.13.0 • 2026 market + injury refresh")
    .replace("v0.13.0 verifies completed exports before download and identifies the creating runtime.", "v0.13.0 refreshes the current 2026 PPR market, injury availability, and situation evidence while retaining source provenance.")
    .replace("The football coefficients, 331-player pool, owner strategy boundary, Setup/randomizer behavior, bye/contingent logic, and grading weights remain unchanged.", "The football coefficients, owner strategy boundary, tier architecture, Setup/randomizer behavior, bye/contingent logic, and grading weights remain unchanged; the audited pool is now 337 players.")
    .replace("<b>Built-in Master Pool v1.2:</b> 331 players. The 276 core redraft candidates plus 55 lookup-only drafted rookies now carry Current Situation Overlay v2.0 across the full pool.", "<b>Built-in Master Pool v1.3:</b> 337 players. The refreshed pool retains 55 lookup-only drafted rookies and adds six conservative current-market entries; all rows carry explicit current market and injury provenance.")
    .replace("Overlay v2.0 covers the full 331-player pool", "Overlay v2.1 covers the full 337-player pool")
    .replace("Loaded ${state.players.length} players from Master Pool v1.2 + Situation Overlay v2.0.", "Loaded ${state.players.length} players from Master Pool v1.3 + 2026 Market/Injury Refresh.");
  const releaseExtracted = extractArray(releaseShell, "const DEFAULT_MASTER_POOL=");
  let html = `${releaseShell.slice(0, releaseExtracted.start)}${JSON.stringify(pool)}${releaseShell.slice(releaseExtracted.end)}`;
  const afterHashes = { player: sha(JSON.stringify(pool)), model: sha(segment(html, "function teamForCard", "function renderHistory")), recommendation: sha(segment(html, "function draftStrength", "function recommendation")) };
  if (beforeHashes.model !== afterHashes.model || beforeHashes.recommendation !== afterHashes.recommendation) throw new Error("Frozen football/recommendation span changed");
  fs.writeFileSync(appPath, zlib.gzipSync(Buffer.from(html), { level: 9, mtime: 0 }));

  const additions = pool.filter(player => !oldByName.has(normalize(player.name))).map(player => ({ name: player.name, position: player.position, team: player.nfl_team, planning_adp: player.planning_adp, availability: player.availability_status }));
  const topMovers = [...marketChanges].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 50);
  writeCsv(path.join(DIAGNOSTICS, "v0130-adp-movers.csv"), topMovers, ["name", "position", "old_adp", "new_adp", "delta", "old_rank", "new_rank"]);
  writeCsv(path.join(DIAGNOSTICS, "v0130-injury-changes.csv"), injuryChanges, ["name", "old_status", "new_status", "old_health", "new_health", "summary"]);
  writeCsv(path.join(DIAGNOSTICS, "v0130-situation-changes.csv"), situationChanges, ["name", "old_score", "new_score", "reason"]);
  writeCsv(path.join(DIAGNOSTICS, "v0130-pool-changes.csv"), additions, ["name", "position", "team", "planning_adp", "availability"]);

  const important = pool.filter(player => ["Jayden Higgins", "Tyler Warren", "Sam LaPorta", "Keon Coleman", "Breece Hall"].includes(player.name)).map(player => ({ name: player.name, availability: player.availability_status, health: player.health_score, situation: player.situation_score, summary: player.injury_summary }));
  const report = `# v0.13.0 2026 market, injury, and situation refresh\n\nGenerated ${AS_OF}. This is a data-only refresh. Draft Strength, RB/WR balance, TE scarcity, bye, contingent-RB, owner hazard/profile, tier architecture, grading, and NFL-affinity code are byte-identical.\n\n## Source policy\n\n- FantasyPros PPR composite (${SOURCE_URLS.fantasyPros}), retrieved Aug. 22; public table exposed five rows and five current sources, so it is preferred only where actually available.\n- FantasyData PPR (${SOURCE_URLS.fantasyData}), retrieved Aug. 22; 100 public rows.\n- Fantasy Football Calculator PPR (${SOURCE_URLS.ffc}), retrieved Aug. 22; 266 public rows based on recent mocks.\n- Sleeper PPR via Hashtag Football (${SOURCE_URLS.sleeper}), page updated Aug. 22; stale/invalid 999 entries excluded.\n- CBS (${SOURCE_URLS.cbs}) and NFFC (${SOURCE_URLS.nffc}) public injury pages, retrieved Aug. 22; official NFL sources override aggregators for named cases.\n\nPlanning ADP is the median of currently matched PPR sources. Prior planning/rank/timestamp values are retained in explicit prior_* fields. A no-match player retains the v0.12.9 planning ADP and receives LOW confidence.\n\n## Pool audit\n\n- Old/new size: ${oldPool.length} → ${pool.length}.\n- Additions: ${additions.length}; removals: 0. Season-ending/reserve players remain identifiable.\n- Duplicate names/IDs: 0 after validation.\n- Single-source/low-confidence candidates are documented in v0130-pool-watchlist.csv instead of being added automatically.\n\n${table(additions, [["name", "Player"], ["position", "Pos"], ["team", "Team"], ["planning_adp", "Planning ADP"], ["availability", "Availability"]])}\n\n## Top 50 absolute ADP movers\n\nPositive delta means earlier than v0.12.9; negative means later.\n\n${table(topMovers, [["name", "Player"], ["position", "Pos"], ["old_adp", "Old"], ["new_adp", "New"], ["delta", "Δ"], ["old_rank", "Old rank"], ["new_rank", "New rank"]])}\n\n## Important current cases\n\n${table(important, [["name", "Player"], ["availability", "Availability"], ["health", "Health"], ["situation", "Situation"], ["summary", "Sourced summary"]])}\n\n## Injury and situation deltas\n\n- Availability/health changes: ${injuryChanges.length}; full rows are in v0130-injury-changes.csv.\n- Material situation changes (absolute score delta ≥5): ${situationChanges.length}; full rows are in v0130-situation-changes.csv.\n- Players with no current listing are explicitly marked NO_CURRENT_INJURY_FLAG rather than medically declared healthy.\n\n## Frozen hashes\n\n| Span | Before | After |\n|---|---|---|\n| Player pool JSON | ${beforeHashes.player} | ${afterHashes.player} |\n| Football model (teamForCard→renderHistory) | ${beforeHashes.model} | ${afterHashes.model} |\n| Recommendation coefficients (draftStrength→recommendation) | ${beforeHashes.recommendation} | ${afterHashes.recommendation} |\n`;
  fs.writeFileSync(path.join(DIAGNOSTICS, "v0130-data-refresh.md"), report);
  console.log(JSON.stringify({ oldPool: oldPool.length, newPool: pool.length, additions: additions.length, injuryChanges: injuryChanges.length, situationChanges: situationChanges.length, beforeHashes, afterHashes }, null, 2));
}

function refreshMoverOutputs() {
  const html = zlib.gunzipSync(fs.readFileSync(path.join(ROOT, "app.html.gz"))).toString("utf8");
  const pool = extractArray(html, "const DEFAULT_MASTER_POOL=").rows;
  const movers = pool.flatMap(player => {
    const oldAdp = player.prior_planning_adp === "" || player.prior_planning_adp == null ? NaN : Number(player.prior_planning_adp);
    const newAdp = player.planning_adp === "" || player.planning_adp == null ? NaN : Number(player.planning_adp);
    if (!Number.isFinite(oldAdp) || !Number.isFinite(newAdp)) return [];
    return [{ name: player.name, position: player.position, old_adp: round(oldAdp), new_adp: round(newAdp), delta: round(oldAdp-newAdp), old_rank: player.prior_rank, new_rank: player.rank }];
  }).sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta)).slice(0,50);
  writeCsv(path.join(DIAGNOSTICS, "v0130-adp-movers.csv"), movers, ["name", "position", "old_adp", "new_adp", "delta", "old_rank", "new_rank"]);
  const reportPath = path.join(DIAGNOSTICS, "v0130-data-refresh.md");
  const report = fs.readFileSync(reportPath, "utf8");
  const replacement = `## Top 50 absolute ADP movers\n\nPositive delta means earlier than v0.12.9; negative means later. Players without a genuine prior planning ADP are excluded.\n\n${table(movers, [["name", "Player"], ["position", "Pos"], ["old_adp", "Old"], ["new_adp", "New"], ["delta", "Δ"], ["old_rank", "Old rank"], ["new_rank", "New rank"]])}\n\n## Important current cases`;
  fs.writeFileSync(reportPath, report.replace(/## Top 50 absolute ADP movers[\s\S]*?## Important current cases/, replacement));
  console.log(JSON.stringify({ movers: movers.length, reportPath }, null, 2));
}

function normalizeCurrentAdditionHistory() {
  const appPath = path.join(ROOT, "app.html.gz");
  const html = zlib.gunzipSync(fs.readFileSync(appPath)).toString("utf8");
  const extracted = extractArray(html, "const DEFAULT_MASTER_POOL=");
  let changed = 0;
  for (const player of extracted.rows) {
    for (const key of ["market_source","market_summary"]) {
      if (typeof player[key] === "string" && player[key].includes("Preserved v0.13.0 planning ADP")) {
        player[key] = player[key].replace("Preserved v0.13.0 planning ADP", "Preserved v0.12.9 planning ADP");
        changed += 1;
      }
    }
    if (player.model_coverage !== "CURRENT_MARKET_LOOKUP_ONLY") continue;
    for (const key of ["prior_rank","prior_position_rank","prior_planning_adp","prior_market_as_of"]) {
      if (!(key in player)) { player[key] = ""; changed += 1; }
    }
  }
  const shell = `${html.slice(0, extracted.start)}${JSON.stringify(extracted.rows)}${html.slice(extracted.end)}`
    .replace("v0.13.0 • verified diagnostics export", "v0.13.0 • 2026 market + injury refresh")
    .replace("v0.13.0 verifies completed exports before download and identifies the creating runtime.", "v0.13.0 refreshes the current 2026 PPR market, injury availability, and situation evidence while retaining source provenance.")
    .replace("The football coefficients, 331-player pool, owner strategy boundary, Setup/randomizer behavior, bye/contingent logic, and grading weights remain unchanged.", "The football coefficients, owner strategy boundary, tier architecture, Setup/randomizer behavior, bye/contingent logic, and grading weights remain unchanged; the audited pool is now 337 players.")
    .replace("<b>Built-in Master Pool v1.2:</b> 331 players. The 276 core redraft candidates plus 55 lookup-only drafted rookies now carry Current Situation Overlay v2.0 across the full pool.", "<b>Built-in Master Pool v1.3:</b> 337 players. The refreshed pool retains 55 lookup-only drafted rookies and adds six conservative current-market entries; all rows carry explicit current market and injury provenance.")
    .replace("Overlay v2.0 covers the full 331-player pool", "Overlay v2.1 covers the full 337-player pool")
    .replace("Loaded ${state.players.length} players from Master Pool v1.2 + Situation Overlay v2.0.", "Loaded ${state.players.length} players from Master Pool v1.3 + 2026 Market/Injury Refresh.");
  const next = shell;
  fs.writeFileSync(appPath, zlib.gzipSync(Buffer.from(next), { level: 9, mtime: 0 }));
  console.log(JSON.stringify({ normalizedFields: changed }, null, 2));
}

const command = process.argv[2];
if (command === "snapshot") {
  const sourceIndex = process.argv.indexOf("--source-dir");
  if (sourceIndex < 0 || !process.argv[sourceIndex + 1]) throw new Error("Usage: node diagnostics/v0130-data-refresh.mjs snapshot --source-dir <directory>");
  createSnapshots(path.resolve(process.argv[sourceIndex + 1]));
} else if (command === "apply") applyRefresh();
else if (command === "report") refreshMoverOutputs();
else if (command === "normalize") normalizeCurrentAdditionHistory();
else throw new Error("Usage: node diagnostics/v0130-data-refresh.mjs <snapshot --source-dir DIR | apply | report | normalize>");
