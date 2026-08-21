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
    PROFILE_KEYS: ["No Chumps", "DA BRONCOS"],
    inferProfileId(name) { return name === "No Chumps" ? "No Chumps" : null; },
    defaultTeams: [],
  });
  vm.runInContext(html.slice(start, end), context);
  return context;
}


test("known-team presets are derived from profile keys and existing owners", () => {
  const context = identityHarness();
  const presets = vm.runInContext("TEAM_PRESETS", context);
  assert.equal(presets["No Chumps"].ownerName, "Rick Dauven");
  assert.equal(presets["No Chumps"].teamName, "No Chumps");
  assert.equal(presets["No Chumps"].profileId, "No Chumps");
  assert.equal(presets["DA BRONCOS"].ownerName, "Al McGirl");
  assert.equal(presets["DA BRONCOS"].teamName, "DA BRONCOS");
  assert.equal(presets["DA BRONCOS"].profileId, "DA BRONCOS");
});


test("selecting known presets populates owner, team, and historical profile", () => {
  const context = identityHarness();
  const apply = vm.runInContext("applyTeamPreset", context);
  const noChumps = apply({ card: 6, my: true }, "No Chumps");
  assert.equal(noChumps.presetId, "No Chumps");
  assert.equal(noChumps.ownerName, "Rick Dauven");
  assert.equal(noChumps.teamName, "No Chumps");
  assert.equal(noChumps.name, "No Chumps");
  assert.equal(noChumps.profileId, "No Chumps");
  assert.equal(noChumps.card, 6);

  const broncos = apply({}, "DA BRONCOS");
  assert.equal(broncos.ownerName, "Al McGirl");
  assert.equal(broncos.teamName, "DA BRONCOS");
  assert.equal(broncos.profileId, "DA BRONCOS");
});


test("preset-populated fields remain authoritative and edits survive rerender", () => {
  const context = identityHarness();
  const apply = vm.runInContext("applyTeamPreset", context);
  const normalize = vm.runInContext("normalizeTeamIdentity", context);
  const populated = apply({}, "No Chumps");
  const edited = normalize({ ...populated, ownerName: "Rick D.", teamName: "Renamed Team", name: "Renamed Team", profileId: "DA BRONCOS" }, 0);
  assert.equal(edited.presetId, "No Chumps");
  assert.equal(edited.ownerName, "Rick D.");
  assert.equal(edited.teamName, "Renamed Team");
  assert.equal(edited.name, "Renamed Team");
  assert.equal(edited.profileId, "DA BRONCOS");
});


test("selected presets are unique and clearing or changing releases them", () => {
  const context = identityHarness();
  const apply = vm.runInContext("applyTeamPreset", context);
  const available = vm.runInContext("availableTeamPresetIds", context);
  const teams = [apply({}, "No Chumps"), { presetId: null }];
  assert.deepEqual([...available(teams, 1)], ["DA BRONCOS"]);
  teams[0] = apply(teams[0], null);
  assert.deepEqual([...available(teams, 1)], ["No Chumps", "DA BRONCOS"]);
  teams[0] = apply(teams[0], "DA BRONCOS");
  assert.deepEqual([...available(teams, 1)], ["No Chumps"]);
});


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
  const apply = vm.runInContext("applyTeamPreset", context);
  const team = normalize(apply({ ownerName: "New Owner", teamName: "Expansion Club", profileId: null, card: 3 }, null), 2);
  assert.equal(team.ownerName, "New Owner");
  assert.equal(team.teamName, "Expansion Club");
  assert.equal(team.name, "Expansion Club");
  assert.equal(team.profileId, null);
  assert.equal(team.presetId, null);
});


test("legacy name inference is migration-only and explicit neutral identity never guesses", () => {
  const context = identityHarness();
  const normalize = vm.runInContext("normalizeTeamIdentity", context);
  assert.equal(normalize({ name: "No Chumps", profileId: null }, 0).profileId, "No Chumps");
  assert.equal(normalize({ ownerName: "New Owner", teamName: "No Chumps", profileId: null }, 0).profileId, null);
});


test("replacement owners do not inherit the prior owner's profile", () => {
  const context = identityHarness();
  const apply = vm.runInContext("applyTeamPreset", context);
  const unlink = vm.runInContext("unlinkInheritedProfile", context);
  const linked = apply({}, "No Chumps");
  assert.equal(unlink(linked, "Rick Dauven").profileId, "No Chumps");
  const replacement = unlink(linked, "New Owner");
  assert.equal(replacement.ownerName, "New Owner");
  assert.equal(replacement.profileId, null);
  assert.equal(replacement.teamName, "No Chumps");
  assert.equal(replacement.presetId, "No Chumps");
});


test("existing v0.12.5 identity loads without preset inference or field changes", () => {
  const context = identityHarness();
  const normalize = vm.runInContext("normalizeTeamIdentity", context);
  const old = { ownerName: "Custom Owner", teamName: "Custom Team", name: "Custom Team", profileId: "DA BRONCOS", card: 8, my: true };
  const loaded = normalize(old, 0);
  assert.equal(loaded.ownerName, old.ownerName);
  assert.equal(loaded.teamName, old.teamName);
  assert.equal(loaded.name, old.name);
  assert.equal(loaded.profileId, old.profileId);
  assert.equal(loaded.card, old.card);
  assert.equal(loaded.my, old.my);
  assert.equal(loaded.presetId, null);
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
