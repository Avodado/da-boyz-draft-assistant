(function(){
'use strict';
const CALIBRATION_VERSION='1.0';
const LEGACY_OPPONENT_NOISE_SCALE=30;

function opponentNoiseScale(sp){
  const round=Math.max(1,Math.floor(Number(sp?.round)||1));
  return Math.min(20,6+1.2*(round-1));
}

function calibratedNoiseScale(requested,sp){
  const scale=Number(requested);
  if(!Number.isFinite(scale))return requested;
  return Math.abs(scale-LEGACY_OPPONENT_NOISE_SCALE)<1e-9?opponentNoiseScale(sp):scale;
}

const api={version:CALIBRATION_VERSION,legacyNoiseScale:LEGACY_OPPONENT_NOISE_SCALE,opponentNoiseScale,calibratedNoiseScale};
if(typeof globalThis!=='undefined')globalThis.DABOYZ_SIMULATION_CALIBRATION=api;

if(typeof simNoise==='function'){
  const baseSimNoise=simNoise;
  simNoise=function(scale=1){
    let sp=null;
    try{sp=typeof current==='function'?current():null}catch(e){}
    return baseSimNoise(calibratedNoiseScale(scale,sp));
  };
}
})();
