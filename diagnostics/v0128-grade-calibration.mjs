import fs from "node:fs";

const sourcePath = new URL("./v0127-self-profile-analysis.mjs", import.meta.url);
let source = fs.readFileSync(sourcePath, "utf8");
source = source
  .replace('const outputPath = process.argv[3] || "diagnostics/v0127-self-profile-analysis-2000.json";', 'const outputPath = process.argv[3] || "diagnostics/v0128-grade-calibration-500.json";')
  .replace("const diagnosticOriginalPlanningAdp=", "buildDecisionSnapshot=()=>null;\nconst diagnosticOriginalPlanningAdp=")
  .replace("return {signature:mine.map", "state.completedAt='diagnostic-seed-'+seed;const grades=calculateDraftGrades();return {grades,signature:mine.map")
  .replace('  neutral.push(vm.runInContext("diagnosticTrial(__seed,false)", context));', '')
  .replace('const pairedMismatches = baseline.reduce((n,trial,i)=>n+(trial.signature===neutral[i].signature?0:1),0);', 'const pairedMismatches = null;')
  .replace('selfProfileNeutral: vm.runInContext("diagnosticAggregate", context)(neutral),', 'selfProfileNeutral: null,')
  .replace("fs.writeFileSync(outputPath,", String.raw`
function gradeMean(values){return values.reduce((a,b)=>a+b,0)/values.length}
function gradeStd(values){const m=gradeMean(values);return Math.sqrt(gradeMean(values.map(x=>(x-m)**2)))}
function gradeCorrelation(rows,key){const xs=rows.map(x=>Number(x.overallScore)),ys=rows.map(key),mx=gradeMean(xs),my=gradeMean(ys),num=xs.reduce((a,x,i)=>a+(x-mx)*(ys[i]-my),0),dx=Math.sqrt(xs.reduce((a,x)=>a+(x-mx)**2,0)),dy=Math.sqrt(ys.reduce((a,y)=>a+(y-my)**2,0));return dx&&dy?num/(dx*dy):0}
const gradeRows=baseline.flatMap(t=>t.grades),gradeScores=gradeRows.map(x=>Number(x.overallScore)),gradeLetters={},gradeComponents={};
gradeRows.forEach(g=>{gradeLetters[g.letterGrade]=(gradeLetters[g.letterGrade]||0)+1;Object.entries(g.components).forEach(([k,v])=>(gradeComponents[k]||=[]).push(Number(v)))});
const ownerGroups={};gradeRows.forEach(g=>(ownerGroups[g.aggregationKey]||=[]).push(g));
report.gradeCalibration={completedProfileDrivenMocks:baseline.length,teamGradeRecords:gradeRows.length,overallScore:{mean:gradeMean(gradeScores),median:[...gradeScores].sort((a,b)=>a-b)[Math.floor(gradeScores.length/2)],standardDeviation:gradeStd(gradeScores),minimum:Math.min(...gradeScores),maximum:Math.max(...gradeScores)},letterDistribution:Object.fromEntries(Object.entries(gradeLetters).sort()),componentAverages:Object.fromEntries(Object.entries(gradeComponents).map(([k,v])=>[k,gradeMean(v)])),scoreCorrelations:{components:Object.fromEntries(Object.keys(gradeComponents).map(k=>[k,gradeCorrelation(gradeRows,g=>Number(g.components[k]))])),waiverPressure:gradeCorrelation(gradeRows,g=>Number(g.estimatedScheduledWaiverPressure)),QB:gradeCorrelation(gradeRows,g=>Number(g.rosterPositionalCounts.QB||0)),RB:gradeCorrelation(gradeRows,g=>Number(g.rosterPositionalCounts.RB||0)),WR:gradeCorrelation(gradeRows,g=>Number(g.rosterPositionalCounts.WR||0)),TE:gradeCorrelation(gradeRows,g=>Number(g.rosterPositionalCounts.TE||0))},ownerAverages:Object.fromEntries(Object.entries(ownerGroups).sort().map(([k,v])=>[k,{mocks:v.length,averageScore:gradeMean(v.map(x=>Number(x.overallScore))),averageRank:gradeMean(v.map(x=>Number(x.overallRank)))}])),sampleCompletedDraft:baseline[0]?.grades||[]};
fs.writeFileSync(outputPath,`);

const encoded = Buffer.from(source).toString("base64");
await import(`data:text/javascript;base64,${encoded}`);
