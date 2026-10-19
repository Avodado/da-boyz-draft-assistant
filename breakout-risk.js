(function (root) {
  'use strict';
  const VERSION = '1.0';
  const REQUIRED = ['role', 'competition', 'health', 'production'];
  const ROLES = ['starter', 'committee', 'backup', 'reserve', 'specialist', 'unknown'];
  // Evidence coverage is not a calibrated probability of success.
  function evaluate(player, evidence = {}, cutoff) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cutoff || '')) throw new Error('A draft cutoff date is required');
    const accepted = {}, rejected = [];
    for (const key of REQUIRED) {
      const row = evidence[key];
      if (!row) continue;
      const validDate = /^\d{4}-\d{2}-\d{2}$/.test(row.publishedAt || '');
      if (!validDate || row.publishedAt > cutoff || !row.source || row.value == null || row.value === '' || row.value === 'unknown') {
        rejected.push(key); continue;
      }
      accepted[key] = { ...row };
    }
    const role = ROLES.includes(accepted.role?.value) ? accepted.role.value : 'unknown';
    const flags = [];
    if (['backup', 'reserve', 'specialist'].includes(role)) flags.push('NO_CONFIRMED_WEEKLY_ROLE');
    if (role === 'committee') flags.push('SHARED_WORKLOAD');
    if (role === 'unknown') flags.push('ROLE_UNVERIFIED');
    if (accepted.competition?.value === 'contested') flags.push('ROLE_COMPETITION');
    if (accepted.health?.value === 'recovering') flags.push('RECOVERY_OR_LIMITED_PREPARATION');
    if (accepted.health?.value === 'unavailable') flags.push('KNOWN_UNAVAILABILITY');
    const missing = REQUIRED.filter(k => !accepted[k]);
    const coverage = (REQUIRED.length - missing.length) / REQUIRED.length;
    const verifiedCoverage = REQUIRED.filter(k=>accepted[k] && accepted[k].quality !== 'prior').length / REQUIRED.length;
    const raw = player.breakout_score;
    const score = raw == null || raw === '' ? null : Number(raw);
    const unavailable = accepted.health?.value === 'unavailable';
    const eligibility = unavailable ? 'unavailable' : ['backup', 'reserve', 'specialist'].includes(role)
      ? 'contingent' : role === 'unknown' ? 'unverified' : 'candidate';
    return {
      version: VERSION, mode: 'SHADOW', affectsStrategy: false, cutoff,
      breakoutScore: Number.isFinite(score) ? score : null,
      roleSecurity: role, eligibility,
      bustRisk: flags.some(f=>f!=='ROLE_UNVERIFIED') ? 'FLAGGED' : missing.length ? 'UNKNOWN' : 'NO_IDENTIFIED_FLAGS',
      riskFlags: flags, missingEvidence: missing, rejectedEvidence: rejected,
      evidenceCoverage: coverage, verifiedEvidenceCoverage: verifiedCoverage,
      confidence: missing.length || verifiedCoverage < 1 ? 'INCOMPLETE' : 'DOCUMENTED_UNCALIBRATED',
      // Fixed existing coefficients, shown for comparison only. No new penalty is invented.
      existingBreakoutAdjustment: Number.isFinite(score) && score != null ? (score - 50) * .10 : 0,
      sources: accepted
    };
  }
  function assessCollection(players, evidence, cutoff) {
    return players.filter(p => p.breakout_score != null && p.breakout_score !== '')
      .map(p => ({ name: p.name, position: p.position, planningAdp: p.planning_adp || null,
        ...evaluate(p, evidence[p.name] || {}, cutoff) }));
  }
  root.DaBoyzBreakoutRisk = Object.freeze({ VERSION, evaluate, assessCollection });
})(typeof window !== 'undefined' ? window : globalThis);
