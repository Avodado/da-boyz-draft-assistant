import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import zlib from 'node:zlib';

await import('../interpretation-layer.js');
const I=globalThis.DABOYZ_INTERPRETATION;
const c=(name,position,ds,extra={})=>({name,position,draftStrength:ds,rosterUtility:50,byeAdjustment:0,byeSame:0,contingentScore:50,...extra});
const advice=(round,counts,candidates)=>I.interpretationAdvice({round,counts,candidates});

test('layer exposes the documented 2.0-point near-tie threshold',()=>{
  assert.ok(I);
  assert.equal(I.nearTie,2);
});

test('QB2 better-bye alternative can be surfaced within 2.0 DS',()=>{
  const r=advice(16,{QB:1,RB:4,WR:6,TE:2,K:1,'D/ST':1},[c('Kyler','QB',59.6,{byeAdjustment:-6}),c('Love','QB',59.4,{byeAdjustment:3.35}),c('Shough','QB',57.3,{byeAdjustment:5})]);
  assert.equal(r.status,'LEAN_ALT');
  assert.equal(r.alternative.name,'Love');
});

test('late zero-TE can surface a near-tied TE from candidate ranks 3-5',()=>{
  const r=advice(10,{QB:1,RB:4,WR:5,TE:0,K:0,'D/ST':0},[c('Godwin','WR',57.3),c('Dobbins','RB',56),c('Kelce','TE',55.5)]);
  assert.equal(r.status,'LEAN_ALT');
  assert.equal(r.alternative.name,'Kelce');
});

test('WR7 can yield to a near-tied contingent RB5',()=>{
  const r=advice(15,{QB:2,RB:4,WR:6,TE:2,K:0,'D/ST':0},[c('Coker','WR',56.4),c('Charbonnet','RB',55.3,{contingentScore:70}),c('Little','K',55.3)]);
  assert.equal(r.status,'LEAN_ALT');
  assert.equal(r.alternative.name,'Charbonnet');
});

test('a greater-than-2.0 DS gap produces no override',()=>{
  assert.equal(advice(5,{QB:0,RB:2,WR:2,TE:0,K:0,'D/ST':0},[c('A','WR',66),c('B','RB',63.99)]).status,'CLEAR');
});

test('exactly 2.0 DS is inside the documented override boundary',()=>{
  const r=advice(10,{QB:1,RB:4,WR:4,TE:0,K:0,'D/ST':0},[c('A','WR',60),c('B','TE',58)]);
  assert.equal(r.status,'LEAN_ALT');
  assert.equal(r.gap,2);
});

test('2.01 DS is outside the override boundary',()=>{
  const r=advice(10,{QB:1,RB:4,WR:4,TE:0,K:0,'D/ST':0},[c('A','WR',60),c('B','TE',57.99)]);
  assert.equal(r.status,'CLEAR');
});

test('required K or DST cannot be talked out of by the advisory',()=>{
  for(const position of ['K','D/ST']){
    const r=advice(14,{QB:2,RB:5,WR:6,TE:2,K:0,'D/ST':0},[c(`Required ${position}`,position,50,{required:true}),c('Skill','WR',49.9)]);
    assert.equal(r.status,'REQUIRED');
    assert.equal(r.alternative,null);
  }
});

test('early K or DST versus a near-tied skill player stays advisory-only',()=>{
  for(const position of ['K','D/ST']){
    const r=advice(8,{QB:1,RB:3,WR:4,TE:1,K:0,'D/ST':0},[c(`Early ${position}`,position,60),c('Skill','WR',59)]);
    assert.equal(r.status,'LEAN_ALT');
    assert.equal(r.top.position,position);
  }
});

test('a discretionary second K or DST can lean to a near-tied skill player',()=>{
  for(const position of ['K','D/ST']){
    const counts={QB:2,RB:5,WR:6,TE:2,K:1,'D/ST':1};
    const r=advice(16,counts,[c(`Second ${position}`,position,60),c('Skill','RB',59.5)]);
    assert.equal(r.status,'LEAN_ALT');
  }
});

test('superior-bye QB2 is not surfaced when significantly worse in DS',()=>{
  const r=advice(16,{QB:1,RB:4,WR:6,TE:2,K:1,'D/ST':1},[c('Top QB','QB',60,{byeAdjustment:-6}),c('Bye QB','QB',57.99,{byeAdjustment:8})]);
  assert.equal(r.status,'CLEAR');
});

test('zero TE alone does not surface a TE before the late-draft gate',()=>{
  const r=advice(8,{QB:1,RB:3,WR:4,TE:0,K:0,'D/ST':0},[c('WR','WR',60),c('TE','TE',59)]);
  assert.notEqual(r.status,'LEAN_ALT');
});

test('RB and WR balance signals cannot become hard quotas outside 2.0 DS',()=>{
  const rbTop=advice(8,{QB:0,RB:4,WR:3,TE:0,K:0,'D/ST':0},[c('RB5','RB',60),c('WR4','WR',57.99)]);
  const wrTop=advice(11,{QB:0,RB:4,WR:6,TE:0,K:0,'D/ST':0},[c('WR7','WR',60),c('RB5','RB',57.99,{contingentScore:70})]);
  assert.equal(rbTop.status,'CLEAR');
  assert.equal(wrTop.status,'CLEAR');
});

test('roster utility alone cannot double-count its way into an override',()=>{
  const r=advice(12,{QB:1,RB:4,WR:5,TE:1,K:0,'D/ST':0},[c('Top','WR',60,{rosterUtility:50}),c('Alt','RB',59,{rosterUtility:63})]);
  assert.notEqual(r.status,'LEAN_ALT');
});

test('duplicate roster utility cannot reorder otherwise equal contextual alternatives',()=>{
  const r=advice(12,{QB:1,RB:4,WR:5,TE:1,K:0,'D/ST':0},[c('Top','WR',60,{byeSame:3,byeAdjustment:-5}),c('Higher DS Alt','WR',59.5,{byeAdjustment:1}),c('Utility Alt','RB',59.4,{byeAdjustment:1,rosterUtility:70})]);
  assert.equal(r.status,'LEAN_ALT');
  assert.equal(r.alternative.name,'Higher DS Alt');
});

test('general bye context cannot lean from a skill player to K or DST',()=>{
  for(const position of ['K','D/ST']){
    const r=advice(16,{QB:2,RB:5,WR:5,TE:2,K:1,'D/ST':1},[c('Skill','WR',60,{byeSame:3,byeAdjustment:-10}),c('Specialist',position,59,{byeAdjustment:5})]);
    assert.notEqual(r.status,'LEAN_ALT');
  }
});

test('general bye-concentration advice does not fire before Round 9',()=>{
  const r=advice(8,{QB:1,RB:3,WR:3,TE:0,K:0,'D/ST':0},[c('Top','WR',60,{byeSame:3,byeAdjustment:-10}),c('Alt','RB',59,{byeAdjustment:5})]);
  assert.notEqual(r.status,'LEAN_ALT');
});

test('off-clock guard returns WAIT before candidate interpretation',()=>{
  const source=fs.readFileSync(new URL('../interpretation-layer.js',import.meta.url),'utf8');
  assert.match(source,/Number\(cur\.card\)!==Number\(mine\.card\)\)return \{status:'WAIT'/);
});

test('absence or failure of the layer leaves the byte-identical core app present',()=>{
  const html=zlib.gunzipSync(fs.readFileSync(new URL('../app.html.gz',import.meta.url))).toString('utf8');
  assert.match(html,/const CURRENT_BUILD="v0\.13\.0"/);
  assert.doesNotMatch(html,/interpretation-layer\.js|DABOYZ_INTERPRETATION/);
  const layer=fs.readFileSync(new URL('../interpretation-layer.js',import.meta.url),'utf8');
  assert.match(layer,/catch\(e\).*Interpretation unavailable; core recommendations are unchanged\./s);
});

test('index loader does not terminate itself while injecting optional layers',()=>{
  const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  const outerScript=index.match(/<script>([\s\S]*?)<\/script>/)?.[1]||'';
  assert.match(outerScript,/const layers='<script src="\.\/interpretation-layer\.js"><\/scr'\+'ipt><script src="\.\/affinity-tracker\.js"><\/scr'\+'ipt><script src="\.\/archive-config\.js"><\/scr'\+'ipt><script src="\.\/archive-client\.js"><\/scr'\+'ipt><script src="\.\/mock-toolbar\.js"><\/scr'\+'ipt>'/);
  assert.ok(outerScript.indexOf('interpretation-layer.js')<outerScript.indexOf('affinity-tracker.js'));
  assert.match(outerScript,/document\.write\(enhanced\)/);
});
