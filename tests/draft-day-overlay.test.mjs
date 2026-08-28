import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../draft-day-overlay.js", import.meta.url), "utf8");

function loadApi() {
  const errors = [];
  const context = vm.createContext({
    console: { error(...args) { errors.push(args); } }
  });
  vm.runInContext(source, context, { filename: "draft-day-overlay.js" });
  return { api: context.DaBoyzDraftDayOverlay, errors };
}

function player(name, position, planningAdp, extra = {}) {
  return {
    name,
    position,
    planning_adp: String(planningAdp),
    adp: String(planningAdp),
    rank: "1",
    position_rank: "1",
    situation_score: "70",
    situation_confidence: "90",
    availability_status: "NO_CURRENT_INJURY_FLAG",
    health_score: "92",
    drafted: false,
    ...extra
  };
}

test("draft-day overlay keeps the re-verified Aug. 28 market board and remains idempotent", () => {
  const { api, errors } = loadApi();
  const players = [
    player("Adonai Mitchell", "WR", 199.5),
    player("Quinshon Judkins", "RB", 51.1),
    player("Dylan Sampson", "RB", 172.7),
    player("Matthew Golden", "WR", 118.6),
    player("Sean Tucker", "RB", 243.9),
    player("Bucky Irving", "RB", 45.8),
    player("Malik Nabers", "WR", 27.2)
  ];

  const first = api.applyToCollection(players);
  assert.equal(first.changed, 7);
  assert.equal(api.OVERLAY_VERSION, "2026-08-28.2");
  assert.equal(players.find(p => p.name === "Adonai Mitchell").planning_adp, "174.7");
  assert.equal(players.find(p => p.name === "Quinshon Judkins").planning_adp, "61.2");
  assert.equal(players.find(p => p.name === "Bucky Irving").planning_adp, "62.1");
  assert.equal(players.find(p => p.name === "Malik Nabers").planning_adp, "39.4");
  assert.ok(players.every(p => p.market_as_of === "2026-08-28"));
  assert.ok(players.every(p => p.rank_source === "DRAFT_DAY_ADP_OVERLAY_V0131"));
  assert.equal(api.applyToCollection(players).changed, 0);
  assert.deepEqual(errors, []);
});

test("availability overlay keeps Jeanty and Judkins current without changing breakout inputs", () => {
  const { api } = loadApi();
  const jeanty = player("Ashton Jeanty", "RB", 13.8, { breakout_score: "81" });
  const judkins = player("Quinshon Judkins", "RB", 51.1, { breakout_score: "75" });
  api.applyToCollection([jeanty, judkins]);

  assert.equal(jeanty.availability_status, "QUESTIONABLE");
  assert.equal(jeanty.health_score, "68");
  assert.equal(jeanty.situation_score, "68");
  assert.equal(jeanty.breakout_score, "81");
  assert.match(jeanty.injury_source, /reuters\.com/);

  assert.equal(judkins.availability_status, "EXPECTED_WEEK1_READY");
  assert.equal(judkins.health_score, "88");
  assert.equal(judkins.situation_score, "66");
  assert.equal(judkins.breakout_score, "75");
});

test("late Aug. 28 injury refresh corrects stale recovery and new-risk cases", () => {
  const { api } = loadApi();
  const players = [
    player("Christian McCaffrey", "RB", 6, { availability_status: "QUESTIONABLE", health_score: "62", situation_score: "70" }),
    player("Ja'Marr Chase", "WR", 3, { health_score: "92", situation_score: "70" }),
    player("Jeremiyah Love", "RB", 24, { availability_status: "QUESTIONABLE", health_score: "68", situation_score: "70" }),
    player("DeVonta Smith", "WR", 27, { availability_status: "QUESTIONABLE", health_score: "68", situation_score: "70" }),
    player("Patrick Mahomes", "QB", 95, { availability_status: "QUESTIONABLE", health_score: "60", situation_score: "70" })
  ];
  api.applyToCollection(players);

  const cmc = players[0];
  assert.equal(cmc.availability_status, "EXPECTED_WEEK1_READY");
  assert.equal(cmc.health_score, "90");
  assert.equal(cmc.situation_score, "77");
  assert.match(cmc.injury_source, /nbcsports\.com/);

  const chase = players[1];
  assert.equal(chase.availability_status, "QUESTIONABLE");
  assert.equal(chase.health_score, "82");
  assert.equal(chase.situation_score, "68");
  assert.match(chase.injury_source, /reuters\.com/);

  const love = players[2];
  assert.equal(love.health_score, "58");
  assert.equal(love.situation_score, "68");
  assert.match(love.injury, /High-ankle/);

  const smith = players[3];
  assert.equal(smith.availability_status, "EXPECTED_WEEK1_READY");
  assert.equal(smith.health_score, "88");
  assert.equal(smith.situation_score, "75");

  const mahomes = players[4];
  assert.equal(mahomes.availability_status, "EXPECTED_WEEK1_READY");
  assert.equal(mahomes.health_score, "82");
  assert.equal(mahomes.situation_score, "76");

  assert.ok(players.every(p => !Object.hasOwn(p, "adjust_situation_from_health")));
});

test("new current reports are represented conservatively instead of erasing uncertainty", () => {
  const { api } = loadApi();
  const puka = player("Puka Nacua", "WR", 4, { availability_status: "QUESTIONABLE", health_score: "68", situation_score: "70" });
  const kittle = player("George Kittle", "TE", 104, { availability_status: "PUP_EXPECTED_WEEK1", health_score: "60", situation_score: "70" });
  const egbuka = player("Emeka Egbuka", "WR", 40, { availability_status: "QUESTIONABLE", health_score: "70", situation_score: "70" });
  api.applyToCollection([puka, kittle, egbuka]);

  assert.equal(puka.availability_status, "QUESTIONABLE");
  assert.equal(puka.health_score, "68");
  assert.match(puka.injury, /Psoas/);

  assert.equal(kittle.availability_status, "QUESTIONABLE");
  assert.equal(kittle.health_score, "72");
  assert.equal(kittle.situation_score, "73");

  assert.equal(egbuka.availability_status, "QUESTIONABLE");
  assert.equal(egbuka.health_score, "70");
  assert.match(egbuka.injury_summary, /up in the air/);
});

test("season-out identity is unavailable in fresh and saved pools", () => {
  const { api } = loadApi();
  const higgins = player("Jayden Higgins", "WR", 139.05, { availability_status: "OUT_SEASON" });
  assert.equal(api.applyToCollection([higgins]).changed, 1);
  assert.equal(higgins.draft_eligibility, "IDENTITY_ONLY_UNAVAILABLE");
  assert.equal(higgins.drafted, true);
});

test("automatic mount patches saved state without changing draft progress", () => {
  const context = vm.createContext({ console: { error() {} } });
  vm.runInContext(`
    const DEFAULT_MASTER_POOL=[{name:"Adonai Mitchell",position:"WR",planning_adp:"199.5",adp:"199.5",drafted:false}];
    let state={
      players:[{name:"Ashton Jeanty",position:"RB",planning_adp:"13.8",adp:"13.8",health_score:"92",situation_score:"74",drafted:false}],
      picks:[{overall:1,player:{name:"Adonai Mitchell",position:"WR",planning_adp:"199.5",adp:"199.5"}}],
      teams:[{card:9,name:"No Chumps"}]
    };
    let resetCalls=0,saveCalls=0,renderCalls=0;
    function resetCalcMemo(){resetCalls+=1}
    function save(reason){if(reason!=="draft-day-overlay")throw new Error("wrong reason");saveCalls+=1;return true}
    function renderAll(){renderCalls+=1}
  `, context);
  vm.runInContext(source, context, { filename: "draft-day-overlay.js" });
  const result = vm.runInContext(`JSON.stringify({
    adp:state.players[0].planning_adp,
    health:state.players[0].health_score,
    picks:state.picks.length,
    teams:state.teams.length,
    pickAdp:state.picks[0].player.planning_adp,
    overlay:state.draftDayOverlayVersion,
    resetCalls,saveCalls,renderCalls
  })`, context);
  assert.deepEqual(JSON.parse(result), {
    adp: "10",
    health: "68",
    picks: 1,
    teams: 1,
    pickAdp: "174.7",
    overlay: "2026-08-28.2",
    resetCalls: 1,
    saveCalls: 1,
    renderCalls: 1
  });
});

test("overlay is data-only and does not redefine model or simulation functions", () => {
  assert.doesNotMatch(source, /function\s+(draftStrength|recommendation|survivalProbability|chooseOpponentSimulatedPlayer|simNoise)\b/);
  assert.match(source, /resetCalcMemo/);
  assert.match(source, /save\("draft-day-overlay"\)/);
});
