import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import zlib from "node:zlib";

const runner=fs.readFileSync("diagnostics/v0129-tier-architecture-study.mjs","utf8");
const historical=fs.readFileSync("diagnostics/v0129-tier-2025-sensitivity.mjs","utf8");
const html=zlib.gunzipSync(fs.readFileSync("app.html.gz")).toString("utf8");

test("production tier dependency remains frozen and cliff remains diagnostic-only",()=>{
 const strength=html.slice(html.indexOf("function draftStrength"),html.indexOf("function recommendation"));
 assert.match(strength,/tierInfo\(p\)/);
 assert.match(strength,/\(100-surv\)\*\.7\+tier\.urgency\*\.3/);
 assert.doesNotMatch(strength,/tierCliffDiagnostic/);
 assert.match(html.slice(html.indexOf("function tierCliffDiagnostic"),html.indexOf("const DIAGNOSTICS_VERSION")),/affectsDraftStrength:false/);
});

test("tier arms are isolated, paired, bounded, and predeclared",()=>{
 assert.match(runner,/const ARMS=\["baseline","tier-neutral","cliff-only","compressed"\]/);
 assert.match(runner,/neutralUrgency:50,dropMultiplier:5,exhaustionDemandMultiplier:10/);
 assert.match(runner,/maximumAdpGap:4,maximumIntrinsicGap:3,maximumSituationGap:4/);
 assert.match(runner,/productionBefore/);
 assert.match(runner,/Production artifact changed/);
 assert.doesNotMatch(runner,/writeFileSync\("app\.html\.gz"/);
});

test("historical arms are explicitly proxy sensitivity",()=>{
 for(const arm of ["tier-neutral","adp-band-proxy","cliff-only-proxy","compressed-proxy"])assert.ok(historical.includes(`"${arm}"`));
 assert.match(historical,/historicalTierTruthAvailable:false/);
 assert.match(historical,/Sensitivity analysis only/);
 assert.match(historical,/poolWithBands\(adp\.neutralPool,12/);
});
