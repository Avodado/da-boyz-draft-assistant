#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function stableIdentity(team) {
  if (team.profileId) return `profile:${team.profileId}`;
  if (team.presetId) return `preset:${team.presetId}`;
  if (team.aggregationKey) return String(team.aggregationKey);
  return `owner:${String(team.ownerName || "unknown").trim().toLowerCase().replace(/\s+/g, " ")}`;
}

const mean = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : null;
const median = values => { if (!values.length) return null; const s = [...values].sort((a, b) => a - b), m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const stddev = values => { const m = mean(values); return m == null ? null : Math.sqrt(mean(values.map(x => (x - m) ** 2))); };
const round = value => value == null ? null : Number(value.toFixed(6));

export function extractCompletedExport(data, source = "") {
  const report = data?.draftGrades;
  if (!report || report.gradesVersion !== 1 || !Array.isArray(report.teams) || report.teams.length !== 10) return null;
  if (report.teams.some(team => !team.complete || !Number.isFinite(Number(team.overallScore)))) return null;
  return { source, draftId: report.draftId || data.draftId || null, completedAt: report.completedAt || data.completedAt || null, teams: report.teams };
}

export function aggregateExports(exports) {
  const grouped = new Map();
  for (const draft of exports) for (const team of draft.teams) {
    const key = stableIdentity(team);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push({ ...team, draftId: team.draftId || draft.draftId, completedAt: team.completedAt || draft.completedAt });
  }
  const owners = {};
  for (const key of [...grouped.keys()].sort()) {
    const rows = grouped.get(key), scores = rows.map(x => Number(x.overallScore)), ranks = rows.map(x => Number(x.overallRank));
    const componentKeys = [...new Set(rows.flatMap(x => Object.keys(x.components || {})))].sort();
    const componentAverages = Object.fromEntries(componentKeys.map(component => [component, round(mean(rows.map(x => Number(x.components?.[component])).filter(Number.isFinite)))]));
    const cards = [...new Set(rows.map(x => Number(x.card)).filter(Number.isFinite))].sort((a, b) => a - b);
    const letterGradeCounts = {}, scoreHistogram = {};
    rows.forEach(x => { letterGradeCounts[x.letterGrade] = (letterGradeCounts[x.letterGrade] || 0) + 1; const bucket = `${Math.floor(Number(x.overallScore) / 10) * 10}-${Math.floor(Number(x.overallScore) / 10) * 10 + 9}`; scoreHistogram[bucket] = (scoreHistogram[bucket] || 0) + 1; });
    owners[key] = {
      identityKey: key,
      profileId: rows.find(x => x.profileId)?.profileId || null,
      presetId: rows.find(x => x.presetId)?.presetId || null,
      latestOwnerName: rows.at(-1).ownerName,
      observedTeamNames: [...new Set(rows.map(x => x.teamName))].sort(),
      completedMocks: rows.length,
      averageOverallScore: round(mean(scores)), medianOverallScore: round(median(scores)), standardDeviation: round(stddev(scores)),
      minimumOverallScore: Math.min(...scores), maximumOverallScore: Math.max(...scores), averageOverallRank: round(mean(ranks)),
      top1Frequency: round(ranks.filter(x => x === 1).length / ranks.length), top3Frequency: round(ranks.filter(x => x <= 3).length / ranks.length), bottom3Frequency: round(ranks.filter(x => x >= 8).length / ranks.length),
      componentAverages,
      letterGradeCounts: Object.fromEntries(Object.entries(letterGradeCounts).sort()),
      scoreHistogram: Object.fromEntries(Object.entries(scoreHistogram).sort()),
      averageScoreByCard: Object.fromEntries(cards.map(card => [card, round(mean(rows.filter(x => Number(x.card) === card).map(x => Number(x.overallScore))))])),
      averageScheduledWaiverPressure: round(mean(rows.map(x => Number(x.estimatedScheduledWaiverPressure)).filter(Number.isFinite))),
    };
  }
  return { analysisVersion: 1, completedDrafts: exports.length, owners };
}

export function compareActual(aggregate, actualExport) {
  const comparisons = {};
  for (const actual of actualExport.teams) {
    const key = stableIdentity(actual), mock = aggregate.owners[key];
    if (!mock) continue;
    const mockRows = actualExport.__mockRows?.[key] || [], scores = mockRows.map(x => Number(x.overallScore));
    const actualScore = Number(actual.overallScore), less = scores.filter(x => x < actualScore).length, equal = scores.filter(x => x === actualScore).length;
    const componentComparison = {};
    for (const component of Object.keys(actual.components || {}).sort()) componentComparison[component] = { actual: Number(actual.components[component]), mockAverage: mock.componentAverages[component], difference: round(Number(actual.components[component]) - mock.componentAverages[component]) };
    comparisons[key] = { actualNumericGrade: actualScore, actualLetterGrade: actual.letterGrade, mockAverage: mock.averageOverallScore, differenceFromMockAverage: round(actualScore - mock.averageOverallScore), percentileWithinMocks: scores.length ? round(100 * (less + .5 * equal) / scores.length) : null, actualOverallRank: Number(actual.overallRank), averageMockRank: mock.averageOverallRank, componentComparison };
  }
  const noChumpsKey = Object.keys(comparisons).find(key => key === "profile:No Chumps" || key === "preset:No Chumps");
  let noChumps = null;
  if (noChumpsKey) {
    const c = comparisons[noChumpsKey], deltas = Object.entries(c.componentComparison).sort((a, b) => b[1].difference - a[1].difference);
    noChumps = { identityKey: noChumpsKey, actualScore: c.actualNumericGrade, mockMean: c.mockAverage, actualPercentile: c.percentileWithinMocks, actualRank: c.actualOverallRank, averageSimulatedRank: c.averageMockRank, largestPositiveComponentDifference: deltas[0] ? { component: deltas[0][0], difference: deltas[0][1].difference } : null, largestNegativeComponentDifference: deltas.at(-1) ? { component: deltas.at(-1)[0], difference: deltas.at(-1)[1].difference } : null };
  }
  return { actualDraftId: actualExport.draftId, owners: comparisons, noChumps };
}

export function analyzeDirectory(inputDir, actualPath = null) {
  const actualResolved = actualPath ? path.resolve(actualPath) : null, drafts = [];
  for (const name of fs.readdirSync(inputDir).filter(x => x.toLowerCase().endsWith(".json")).sort()) {
    const file = path.resolve(inputDir, name); if (file === actualResolved) continue;
    const extracted = extractCompletedExport(JSON.parse(fs.readFileSync(file, "utf8")), file); if (extracted) drafts.push(extracted);
  }
  const aggregate = aggregateExports(drafts);
  if (actualResolved) {
    const actual = extractCompletedExport(JSON.parse(fs.readFileSync(actualResolved, "utf8")), actualResolved);
    if (!actual) throw new Error("Actual draft file does not contain a complete v1 grade report.");
    actual.__mockRows = {};
    for (const draft of drafts) for (const team of draft.teams) (actual.__mockRows[stableIdentity(team)] ||= []).push(team);
    aggregate.actualDraftComparison = compareActual(aggregate, actual);
  }
  return aggregate;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2), input = args[0], actualIndex = args.indexOf("--actual"), outputIndex = args.indexOf("--output");
  if (!input) { console.error("Usage: node diagnostics/aggregate_mock_grades.mjs <export-directory> [--actual actual.json] [--output report.json]"); process.exit(2); }
  const report = analyzeDirectory(input, actualIndex >= 0 ? args[actualIndex + 1] : null), json = `${JSON.stringify(report, null, 2)}\n`;
  if (outputIndex >= 0) fs.writeFileSync(args[outputIndex + 1], json); else process.stdout.write(json);
}
