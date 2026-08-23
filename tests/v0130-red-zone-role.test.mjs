import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const diagnostics = new URL("../diagnostics/", import.meta.url);
const summary = JSON.parse(fs.readFileSync(new URL("v0130-red-zone-role-study.json", diagnostics), "utf8"));
const runner = fs.readFileSync(new URL("v0130-red-zone-role-study.py", diagnostics), "utf8");
const header = name => fs.readFileSync(new URL(name, diagnostics), "utf8").split(/\r?\n/, 1)[0].split(",");

test("historical predictors are lagged and model specifications contain no outcome leakage", () => {
  assert.equal(summary.analysis_only, true);
  assert.deepEqual(summary.outcome_seasons, [2022, 2023, 2024, 2025]);
  assert.equal(summary.sample_size, 236);
  assert.equal(summary.leakage_contract.outcome_usage_in_predictors, false);
  assert.match(runner, /prior\["season"\] \+= 1/);
  assert.match(runner, /older\["season"\] \+= 2/);
  for (const result of summary.models) {
    const features = String(result.features).split(";").filter(Boolean);
    assert.ok(features.every(value => !["ppr_points", "ppr_ppg", "actual_rb_rank", "total_tds", "rushing_tds"].includes(value)), `${result.model} leaked an outcome`);
  }
  for (const row of summary.leakage_contract.adp_timing) {
    assert.match(row.adp_start_date, /^20\d\d-/);
    assert.match(row.adp_end_date, /^20\d\d-/);
    assert.ok(row.adp_drafts > 0);
  }
});

test("compact datasets preserve RB-only and all-teammate high-value-touch fields", () => {
  const players = header("v0130-red-zone-player-seasons.csv");
  for (const field of ["prior_i20_rb_share", "prior_i10_rb_share", "prior_i5_rb_share", "prior_team_i10_carries", "prior_team_i5_carries", "i5_rb_share_delta"]) assert.ok(players.includes(field), field);

  const competition = header("v0130-red-zone-cannibalization.csv");
  for (const field of ["prior_highest_teammate_i5_name", "prior_highest_teammate_i5_position", "prior_highest_teammate_i5_rush_tds", "prior_highest_other_rb_i5_share", "prior_non_rb_i10_share", "prior_non_rb_i5_share", "prior_qb_i5_share", "prior_te_hybrid_i5_share", "prior_short_yardage_specialist"]) assert.ok(competition.includes(field), field);
});

test("Taysom Hill is retained as non-RB goal-line competition without deterministic TD transfer", () => {
  for (const season of ["2022", "2023", "2024"]) {
    const value = summary.case_studies.saints[season];
    assert.ok(value.hill.inside5_carries ?? value.hill.i5_carries >= 0);
    assert.ok(value.hill_fantasy_designation);
    const total = value.kamara_inside5_opportunity_share + value.hill_inside5_opportunity_share + value.other_player_inside5_opportunity_share;
    assert.ok(Math.abs(total - 1) < 1e-9);
    assert.ok(value.estimated_kamara_td_opportunity_removed <= value.hill.i5_carries);
    assert.match(value.estimate_note, /does not assign every Hill TD/);
  }
  assert.ok(summary.case_studies.saints["2023"].hill_inside5_opportunity_share > 0.25);
});

test("models explicitly compare RB-depth and all-teammate competition", () => {
  const models = new Set(summary.models.map(row => row.model));
  for (const model of ["M2_RB_DEPTH_COMP", "M2_ALL_TEAMMATE_COMP", "A3_RB_DEPTH_COMP", "A4_ALL_TEAMMATE_COMP"]) assert.ok(models.has(model), model);
});

test("2026 audit is diagnostic and does not project stale competition across team changes", () => {
  const csv = fs.readFileSync(new URL("v0130-red-zone-2026-audit.csv", diagnostics), "utf8");
  for (const name of ["Cam Skattebo", "Bijan Robinson", "Jahmyr Gibbs", "David Montgomery", "Kenneth Walker"]) assert.match(csv, new RegExp(name));
  assert.match(csv, /SYSTEM_CHANGED/);
  assert.match(csv, /PROJECTED_RELIEF/);
  assert.match(csv, /prior-season evidence only|no quantified current share/i);
});
