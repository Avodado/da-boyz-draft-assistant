(function(root){
  'use strict';
  if(!root.DaBoyzBreakoutRisk || !root.DaBoyzBreakoutEvidence || typeof state==='undefined')return;
  const evidence=root.DaBoyzBreakoutEvidence;
  const rows=root.DaBoyzBreakoutRisk.assessCollection(state.players||[],evidence.players,evidence.cutoff);
  root.DaBoyzBreakoutReview={mode:'SHADOW',affectsStrategy:false,rows};
  const panel=document.createElement('details');
  panel.id='breakoutRiskReview'; panel.className='card pad';panel.style.margin='14px';
  const summary=document.createElement('summary'); summary.textContent='Breakout role and risk review · Aug. 28 evidence';panel.appendChild(summary);
  const note=document.createElement('p');note.textContent='Research comparison. Ratings and draft recommendations remain unchanged pending historical validation. Evidence coverage measures documentation, not probability of success.';panel.appendChild(note);
  for(const row of rows){
    const p=document.createElement('p');
    p.textContent=`${row.name}: ${row.eligibility}; ${row.roleSecurity}. ${row.riskFlags.join(', ') || row.bustRisk}. Verified evidence: ${Math.round(row.verifiedEvidenceCoverage*100)}%. Missing: ${row.missingEvidence.join(', ') || 'none'}.`;
    panel.appendChild(p);
  }
  document.body.appendChild(panel);
})(typeof window!=='undefined'?window:globalThis);
