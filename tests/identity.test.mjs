import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";
import { gunzipSync } from "node:zlib";


const html = gunzipSync(readFileSync(new URL("../app.html.gz", import.meta.url))).toString("utf8");


function identityHarness() {
  const start = html.indexOf("const IDENTITY_VERSION=2");
  const end = html.indexOf("function poolNameKey", start);
  const context = vm.createContext({
    ROOM_PROFILES: {
      "No Chumps": { owner: "Rick Dauven", seasons: 5 },
      "DA BRONCOS": { owner: "Al McGirl", seasons: 5 },
    },
    inferProfileId(name) { return name === "No Chumps" ? "No Chumps" : null; },
    defaultTeams: [],
  });
  vm.runInContext(html.slice(start, end), context);
  return context;
}


test("renaming an existing owner's team preserves the linked history", () => {
  const context = identityHarness();
  const normalize = vm.runInContext("normalizeTeamIdentity", context);
  const migrated = normalize({ name: "No Chumps", profileId: "No Chumps", card: 6, my: true }, 0);
  assert.equal(migrated.ownerName, "Rick Dauven");
  assert.equal(migrated.teamName, "No Chumps");
  assert.equal(migrated.profileId, "No Chumps");

  const renamed = normalize({ ...migrated, teamName: "URINE TROUBLE" }, 0);
  assert.equal(renamed.name, "URINE TROUBLE");
  assert.equal(renamed.teamName, "URINE TROUBLE");
  assert.equal(renamed.ownerName, "Rick Dauven");
  assert.equal(renamed.profileId, "No Chumps");
});


test("a new owner remains neutral with independent owner and team names", () => {
  const context = identityHarness();
  const normalize = vm.runInContext("normalizeTeamIdentity", context);
  const team = normalize({ ownerName: "New Owner", teamName: "Expansion Club", profileId: null, card: 3 }, 2);
  assert.equal(team.ownerName, "New Owner");
  assert.equal(team.teamName, "Expansion Club");
  assert.equal(team.name, "Expansion Club");
  assert.equal(team.profileId, null);
});


test("legacy name inference is migration-only and explicit neutral identity never guesses", () => {
  const context = identityHarness();
  const normalize = vm.runInContext("normalizeTeamIdentity", context);
  assert.equal(normalize({ name: "No Chumps", profileId: null }, 0).profileId, "No Chumps");
  assert.equal(normalize({ ownerName: "New Owner", teamName: "No Chumps", profileId: null }, 0).profileId, null);
});


test("replacement owners do not inherit the prior owner's profile", () => {
  const context = identityHarness();
  const unlink = vm.runInContext("unlinkInheritedProfile", context);
  const linked = { ownerName: "Rick Dauven", teamName: "No Chumps", name: "No Chumps", profileId: "No Chumps" };
  assert.equal(unlink(linked, "Rick Dauven").profileId, "No Chumps");
  const replacement = unlink(linked, "New Owner");
  assert.equal(replacement.ownerName, "New Owner");
  assert.equal(replacement.profileId, null);
  assert.equal(replacement.teamName, "No Chumps");
});


test("v0.12.4 state migration preserves draft data and adds identity fields", () => {
  const context = identityHarness();
  Object.assign(context, {
    PRESETS: { daboyz: { RB: 0.95 } },
    refreshBuiltInStateData(value) { return value; },
    validLoadedState(value) { return Boolean(value && Array.isArray(value.teams) && Array.isArray(value.picks)); },
    freshMasterPool() { return [{ id: "master_1", name: "Player", drafted: false }]; },
    reconcileDraftedFlags(value) { return value; },
  });
  const start = html.indexOf("function normalizeLoadedState");
  const end = html.indexOf("function readSaveMeta", start);
  vm.runInContext(html.slice(start, end), context);
  const normalizeState = vm.runInContext("normalizeLoadedState", context);
  const oldState = {
    teams: [{ name: "No Chumps", profileId: "No Chumps", card: 6, my: true }],
    players: [{ id: "master_1", name: "Player", drafted: true }],
    picks: [{ overall: 1, card: 6, team: "No Chumps", player: { id: "master_1", name: "Player", position: "RB" } }],
    settings: { preset: "daboyz", pressure: { WR: 1.1 }, ownerModel: true, profileStrength: 1, liveAdaptation: true, mockSeed: 2026 },
    mockCounter: 4,
  };
  const migrated = normalizeState(oldState);
  assert.equal(migrated.identityVersion, 2);
  assert.equal(migrated.teams[0].ownerName, "Rick Dauven");
  assert.equal(migrated.teams[0].teamName, "No Chumps");
  assert.equal(migrated.teams[0].profileId, "No Chumps");
  assert.equal(JSON.stringify(migrated.picks), JSON.stringify(oldState.picks));
  assert.equal(migrated.mockCounter, 4);
  assert.equal(migrated.settings.pressure.WR, 1.1);
});


test("setup rejects duplicate owners, cards, and historical profiles", () => {
  const context = identityHarness();
  const start = html.lastIndexOf("function setupValidationMessage");
  const end = html.indexOf("function isSetupValid", start);
  vm.runInContext(html.slice(start, end), context);
  const validate = vm.runInContext("setupValidationMessage", context);
  const teams = Array.from({ length: 10 }, (_, index) => ({
    ownerName: `Owner ${index + 1}`,
    teamName: `Team ${index + 1}`,
    name: `Team ${index + 1}`,
    profileId: index === 0 ? "No Chumps" : null,
    card: index + 1,
    my: index === 0,
  }));
  context.state = { teams };
  assert.equal(validate(), "");
  teams[1].ownerName = " owner 1 ";
  assert.match(validate(), /Owner Names must be unique/);
  teams[1].ownerName = "Owner 2";
  teams[1].card = 1;
  assert.match(validate(), /Card 1–10 exactly once/);
  teams[1].card = 2;
  teams[1].profileId = "No Chumps";
  assert.match(validate(), /Historical Profile can be linked only once/);
});
