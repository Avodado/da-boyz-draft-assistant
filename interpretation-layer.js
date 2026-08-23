(function(){
'use strict';
const LAYER_VERSION='1.0';
const NEAR_TIE=2.0;
const STRONG_SIGNAL=4;
const SKILL=new Set(['QB','RB','WR','TE']);
const SPECIALIST=new Set(['K','D/ST']);

function n(v,fallback=0){const x=Number(v);return Number.isFinite(x)?x:fallback}
function reason(text,weight){return {text,weight}}

function scoreAlternative(ctx,top,alt){
  const reasons=[];
  const counts=ctx.counts||{};
  const round=n(ctx.round,1);
  const gap=n(top.draftStrength)-n(alt.draftStrength);
  if(gap<0||gap>NEAR_TIE)return {score:0,reasons:[]};

  if((counts.TE||0)===0&&round>=9&&alt.position==='TE'&&top.position!=='TE'){
    reasons.push(reason('TE is still empty this late; taking the near-tied TE reduces scarcity/lineup risk.',5));
  }
  if(top.position==='RB'&&(counts.RB||0)>=4&&alt.position==='WR'&&(counts.WR||0)<=3){
    reasons.push(reason(`RB would become ${Number(counts.RB||0)+1} while WR depth is only ${counts.WR||0}.`,4));
  }
  if(top.position==='WR'&&(counts.WR||0)>=6&&alt.position==='RB'&&(counts.RB||0)<=4&&n(alt.contingentScore,50)>=55){
    reasons.push(reason(`WR would become ${Number(counts.WR||0)+1}; the near-tied RB adds RB${Number(counts.RB||0)+1} contingent upside.`,5));
  }
  if(SPECIALIST.has(top.position)&&round<=12&&SKILL.has(alt.position)){
    reasons.push(reason(`${top.position} is early in Round ${round}; the near-tied skill player preserves more roster upside.`,5));
  }
  if(SPECIALIST.has(top.position)&&(counts[top.position]||0)>=1&&SKILL.has(alt.position)){
    reasons.push(reason(`This would be a second ${top.position}; the near-tied skill player is usually the better discretionary bench use.`,6));
  }
  if(['QB','TE','K','D/ST'].includes(top.position)&&top.position===alt.position&&(counts[top.position]||0)===1){
    const byeGain=n(alt.byeAdjustment)-n(top.byeAdjustment);
    if(byeGain>=5)reasons.push(reason(`${alt.name} gives materially better ${top.position} bye coverage (${byeGain.toFixed(1)} utility points).`,5));
  }
  const byeGain=n(alt.byeAdjustment)-n(top.byeAdjustment);
  if(n(top.byeSame)>=3&&byeGain>=5){
    reasons.push(reason(`The #1 choice would deepen Bye ${top.byeWeek??'?'} concentration; ${alt.name} improves bye fit by ${byeGain.toFixed(1)}.`,4));
  }
  const utilityGain=n(alt.rosterUtility)-n(top.rosterUtility);
  if(utilityGain>=12){
    reasons.push(reason(`${alt.name} has a ${utilityGain.toFixed(1)}-point roster-utility advantage despite the small Draft Strength gap.`,3));
  }
  const score=reasons.reduce((s,r)=>s+r.weight,0);
  return {score,reasons:reasons.map(r=>r.text)};
}

function interpretationAdvice(input){
  const candidates=(input?.candidates||[]).filter(Boolean);
  if(!candidates.length)return {status:'EMPTY',headline:'No legal candidates',message:'No legal candidates are available.'};
  const top=candidates[0];
  if(top.required)return {status:'REQUIRED',headline:`Follow #1: ${top.name}`,message:'Starter-completion rules make this a required path.',top,alternative:null,gap:null,reasons:[]};
  const second=candidates[1];
  if(!second)return {status:'CLEAR',headline:`Follow #1: ${top.name}`,message:'Only one legal candidate is available.',top,alternative:null,gap:null,reasons:[]};
  const gap=n(top.draftStrength)-n(second.draftStrength);
  const near=candidates.slice(1,5).filter(c=>n(top.draftStrength)-n(c.draftStrength)<=NEAR_TIE+1e-9);
  let best=null;
  for(const alt of near){
    const evaluated=scoreAlternative(input,top,alt);
    if(!best||evaluated.score>best.score||(evaluated.score===best.score&&n(alt.draftStrength)>n(best.alt.draftStrength))){best={alt,score:evaluated.score,reasons:evaluated.reasons,gap:n(top.draftStrength)-n(alt.draftStrength)}}
  }
  if(best&&best.score>=STRONG_SIGNAL){
    return {status:'LEAN_ALT',headline:`Effectively tied — lean ${best.alt.name}`,message:`Model #1 ${top.name} ${n(top.draftStrength).toFixed(1)} vs ${best.alt.name} ${n(best.alt.draftStrength).toFixed(1)} (Δ${best.gap.toFixed(1)}).`,top,alternative:best.alt,gap:best.gap,reasons:best.reasons};
  }
  if(gap<=1.0){
    return {status:'TIE',headline:'Effectively tied',message:`${top.name} ${n(top.draftStrength).toFixed(1)} vs ${second.name} ${n(second.draftStrength).toFixed(1)} (Δ${gap.toFixed(1)}). Use roster construction, bye fit, and news as the tiebreaker.`,top,alternative:second,gap,reasons:[]};
  }
  if(gap<=NEAR_TIE){
    return {status:'CLOSE',headline:'Close call',message:`${top.name} leads ${second.name} by only ${gap.toFixed(1)} Draft Strength. Model order is reasonable, but this is an override zone.`,top,alternative:second,gap,reasons:[]};
  }
  return {status:'CLEAR',headline:`Clear model edge: ${top.name}`,message:`#1 leads #2 by ${gap.toFixed(1)} Draft Strength. No interpretation override signal.`,top,alternative:second,gap,reasons:[]};
}

function collectCandidate(p){
  const bi=byeImpact(p);
  return {
    id:p.id,name:p.name,position:p.position,draftStrength:draftStrength(p),
    rosterUtility:rosterUtility(p),contingentScore:num(p.contingent_score),
    byeAdjustment:bi.adjustment,byeSame:bi.same,byeWeek:bi.week,byeCoverage:bi.coverage,
    required:completionStatus(p).required
  };
}
function currentInterpretation(){
  const cur=current(),mine=myTeam();
  if(!cur||!mine||Number(cur.card)!==Number(mine.card))return {status:'WAIT',headline:'Activates on your turn',message:'The interpretation layer only advises when No Chumps is on the clock.'};
  const ordered=state.players.filter(p=>!p.drafted&&completionStatus(p).feasible).sort((a,b)=>draftStrength(b)-draftStrength(a)||(planningAdp(a)??9999)-(planningAdp(b)??9999)).slice(0,5);
  return interpretationAdvice({round:cur.round,counts:rosterCounts(),candidates:ordered.map(collectCandidate)});
}
function ensureBox(){
  let box=document.getElementById('interpretationIntelBox');
  if(box)return box;
  const intel=document.querySelector('.sidebox .intel');
  if(!intel)return null;
  box=document.createElement('div');box.className='intelbox';box.id='interpretationIntelBox';
  box.innerHTML='<div class="intelhead"><span>Interpretation</span><span id="interpretationLabel">Advisory</span></div><div class="mini" id="interpretationIntel"></div>';
  const selected=document.getElementById('selectedIntel')?.closest('.intelbox');
  if(selected)intel.insertBefore(box,selected);else intel.appendChild(box);
  return box;
}
function renderInterpretation(){
  if(typeof document==='undefined')return;
  ensureBox();
  const el=document.getElementById('interpretationIntel'),label=document.getElementById('interpretationLabel');
  if(!el||!label)return;
  let advice;
  try{advice=currentInterpretation()}catch(e){label.textContent='Advisory';el.textContent='Interpretation unavailable; core recommendations are unchanged.';return}
  const statusLabel={LEAN_ALT:'CHECK #2–#5',TIE:'TIE',CLOSE:'CLOSE',CLEAR:'CLEAR',REQUIRED:'REQUIRED',WAIT:'WAIT',EMPTY:'—'}[advice.status]||'Advisory';
  label.textContent=statusLabel;
  const reasons=(advice.reasons||[]).map(x=>`<div style="margin-top:4px">• ${esc(x)}</div>`).join('');
  const top5=(()=>{try{return state.players.filter(p=>!p.drafted&&completionStatus(p).feasible).sort((a,b)=>draftStrength(b)-draftStrength(a)||(planningAdp(a)??9999)-(planningAdp(b)??9999)).slice(0,3).map((p,i)=>`#${i+1} ${esc(p.name)} ${draftStrength(p).toFixed(1)}`).join(' • ')}catch(e){return''}})();
  el.innerHTML=`<strong style="color:var(--text)">${esc(advice.headline)}</strong><div style="margin-top:4px">${esc(advice.message)}</div>${reasons}${top5?`<div style="margin-top:6px;color:var(--muted)">${top5}</div>`:''}<div style="margin-top:6px;color:var(--muted)">Advisory only • model order and Draft Strength are unchanged • layer v${LAYER_VERSION}</div>`;
}

const api={version:LAYER_VERSION,nearTie:NEAR_TIE,interpretationAdvice,scoreAlternative};
if(typeof globalThis!=='undefined')globalThis.DABOYZ_INTERPRETATION=api;
if(typeof document!=='undefined'){
  const baseRenderAll=renderAll;
  renderAll=function(){baseRenderAll();renderInterpretation()};
  renderInterpretation();
}
})();
