import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { analyzeDirectory } from "../diagnostics/aggregate_mock_grades.mjs";

function team(overrides={}) { return { complete:true, ownerName:"Rick Dauven", teamName:"No Chumps", profileId:"No Chumps", presetId:"No Chumps", card:3, my:true, draftId:"d", overallScore:80, letterGrade:"B-", overallRank:3, components:{starterStrength:80,valueVsAdp:70}, estimatedScheduledWaiverPressure:2, rosterPositionalCounts:{QB:2,RB:5,WR:6,TE:2,K:1,"D/ST":1}, ...overrides }; }
function exportFile(id, primary, others=[]) { const rows=[primary,...others]; while(rows.length<10) rows.push(team({ownerName:`Owner ${rows.length}`,teamName:`Team ${rows.length}`,profileId:`Profile ${rows.length}`,presetId:`Profile ${rows.length}`,my:false,card:rows.length+1,overallScore:60+rows.length,overallRank:rows.length+1})); return {draftId:id,completedAt:`2026-08-${String(rows.length).padStart(2,"0")}T00:00:00Z`,draftGrades:{gradesVersion:1,draftId:id,completedAt:"2026-08-21T00:00:00Z",teams:rows}}; }

test("multiple completed exports aggregate numeric statistics and stable profile identity across team renames", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"daboyz-grades-"));
  try {
    const a=exportFile("a",team({teamName:"No Chumps",overallScore:70,overallRank:5,card:1,components:{starterStrength:60,valueVsAdp:80}}));
    const b=exportFile("b",team({teamName:"Renamed Champions",overallScore:90,overallRank:1,card:10,components:{starterStrength:100,valueVsAdp:60}}));
    fs.writeFileSync(path.join(dir,"a.json"),JSON.stringify(a)); fs.writeFileSync(path.join(dir,"b.json"),JSON.stringify(b));
    const before=fs.readFileSync(path.join(dir,"a.json"),"utf8"), report=analyzeDirectory(dir), owner=report.owners["profile:No Chumps"];
    assert.equal(owner.completedMocks,2); assert.equal(owner.averageOverallScore,80); assert.equal(owner.medianOverallScore,80); assert.equal(owner.standardDeviation,10);
    assert.equal(owner.top1Frequency,.5); assert.deepEqual(owner.observedTeamNames,["No Chumps","Renamed Champions"]); assert.equal(owner.componentAverages.starterStrength,80);
    assert.equal(fs.readFileSync(path.join(dir,"a.json"),"utf8"),before,"source exports are never modified");
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});

test("actual draft comparison reports percentile, rank, and component differences", () => {
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),"daboyz-actual-"));
  try {
    fs.writeFileSync(path.join(dir,"mock1.json"),JSON.stringify(exportFile("m1",team({overallScore:70,overallRank:5,components:{starterStrength:60,valueVsAdp:80}}))));
    fs.writeFileSync(path.join(dir,"mock2.json"),JSON.stringify(exportFile("m2",team({overallScore:80,overallRank:3,components:{starterStrength:80,valueVsAdp:70}}))));
    const actualPath=path.join(dir,"actual.json"); fs.writeFileSync(actualPath,JSON.stringify(exportFile("actual",team({overallScore:90,letterGrade:"A-",overallRank:1,components:{starterStrength:95,valueVsAdp:65}}))));
    const report=analyzeDirectory(dir,actualPath), actual=report.actualDraftComparison.owners["profile:No Chumps"];
    assert.equal(report.completedDrafts,2); assert.equal(actual.mockAverage,75); assert.equal(actual.differenceFromMockAverage,15); assert.equal(actual.percentileWithinMocks,100);
    assert.equal(actual.componentComparison.starterStrength.difference,25); assert.equal(report.actualDraftComparison.noChumps.actualRank,1);
  } finally { fs.rmSync(dir,{recursive:true,force:true}); }
});
