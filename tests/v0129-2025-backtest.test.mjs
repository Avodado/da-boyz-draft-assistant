import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const report = JSON.parse(fs.readFileSync(new URL("../diagnostics/v0129-2025-backtest-5000.json", import.meta.url), "utf8"));
const helper = fs.readFileSync(new URL("../diagnostics/v0129-2025-backtest.mjs", import.meta.url), "utf8");

test("2025 back-test contains the complete balanced primary arm", () => {
  assert.equal(report.arms.primary.drafts, 5000);
  assert.deepEqual(report.design.primarySeeds, { first: 20255001, last: 20260000 });
  assert.equal(report.design.balancedOpponentTypes, 18);
  assert.equal(report.arms.primary.appearances["No Chumps"], 5000);
  for (const [identity, appearances] of Object.entries(report.arms.primary.appearances)) {
    if (identity !== "No Chumps") assert.equal(appearances, 2500, identity);
  }
});

test("2025 outcomes remain downstream and production hashes remain frozen", () => {
  assert.equal(report.biasSafeguards.selectionContextContainsOutcomeMap, false);
  assert.equal(report.biasSafeguards.outcomeScoringGatePick, 170);
  assert.deepEqual(report.biasSafeguards.productionHashesAfter, report.biasSafeguards.productionHashesBefore);
  assert.equal(report.design.currentProfilesUnchanged, true);
  assert.equal(report.design.nflTeamAffinity, false);
  assert.doesNotMatch(helper.match(/function diagnosticTrial[\s\S]*?function diagnosticActualGrades/)[0], /fantasy_points|outcomeMap|realized2025/i);
});

test("2025 validation exposes components, construction, and actual champion", () => {
  assert.equal(report.actualValidation.exactTeams, 9);
  assert.equal(report.actualValidation.champion.profileId, "URINE TROUBLE");
  assert.ok(Number.isFinite(report.arms.primary.gradeOutcomeCorrelation));
  assert.ok("valueVsAdp" in report.arms.primary.componentOutcomeCorrelations);
  assert.ok("benchDepth" in report.arms.primary.componentOutcomeCorrelations);
  assert.ok(report.arms.primary.constructions.some(row => row.category === "2/5/6/2/1/1"));
  assert.equal(report.environment.playerPoolSize, 331);
});
