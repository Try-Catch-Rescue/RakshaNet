/* ==========================================================================
   scoring.js — AI-style rescue priority scoring engine.
   Deterministic, explainable weighted model (not a black box) so the
   logic can be demoed and defended in front of judges.
   Inputs -> 0-100 score -> severity band (low/medium/high/critical).
   ========================================================================== */

function computeScore(f){
  let breakdown = [];
  let score = 20; breakdown.push(['Base priority', 20]);

  const peopleScore = Math.min(f.people * 3, 15);
  score += peopleScore; breakdown.push([f.people + ' people affected', peopleScore]);

  if (f.children > 0) {
    const s = Math.min(f.children * 8, 16);
    score += s; breakdown.push([f.children + ' child(ren)', s]);
  }
  if (f.elderly > 0) {
    const s = Math.min(f.elderly * 8, 16);
    score += s; breakdown.push([f.elderly + ' elderly/disabled', s]);
  }
  if (f.medical) {
    score += 25; breakdown.push(['Medical emergency', 25]);
  }

  const ws = WATER_LEVEL_SCORES[f.waterLevelKey] ?? 10;
  score += ws; breakdown.push([t(f.waterLevelKey), ws]);

  score = Math.min(Math.round(score), 100);
  const severity = score >= 90 ? 'critical' : score >= 70 ? 'high' : score >= 50 ? 'medium' : 'low';
  return { score, severity, breakdown };
}

function severityIcon(sev){
  return sev === 'critical' ? '🩺' : sev === 'high' ? '🧒' : sev === 'medium' ? '🏠' : '✅';
}
