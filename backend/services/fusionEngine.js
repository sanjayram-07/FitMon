const { getAveragedFSR } = require('./sessionManager');

// FSR thresholds (normalized 0-1024 range from ESP32 ADC)
const FSR_LOW_THRESHOLD = 200;       // Below = low engagement
const FSR_HIGH_THRESHOLD = 600;      // Above = strong engagement
const FSR_PEAK_THRESHOLD = 500;      // Expected at peak contraction

/**
 * Compute CV form score (0-100) from processing results.
 */
function computeCVScore(frameResult) {
  if (!frameResult || !frameResult.valid) return 0;
  return frameResult.postureScore || 0;
}

/**
 * Compute FSR engagement score (0-100) from averaged reading.
 */
function computeFSRScore(avgFSR) {
  if (avgFSR <= 0) return 0;
  if (avgFSR >= FSR_HIGH_THRESHOLD) return 100;
  return Math.round((avgFSR / FSR_HIGH_THRESHOLD) * 100);
}

/**
 * Run CV + FSR fusion analysis.
 * Returns fusion result with engagement status and risk assessment.
 */
function analyzeFusion(session, frameResult) {
  const avgFSR = getAveragedFSR(session);
  const cvScore = computeCVScore(frameResult);
  const fsrScore = computeFSRScore(avgFSR);

  const result = {
    cvScore,
    fsrScore,
    avgFSR: Math.round(avgFSR),
    alerts: [],
    engagementStatus: 'normal',
    injuryRisk: false,
  };

  // No FSR data available — skip fusion
  if (session.fsrWindow.length === 0) {
    result.engagementStatus = 'no_sensor';
    return result;
  }

  // Case 1: Good form + Low FSR → Low muscle engagement
  if (cvScore >= 60 && fsrScore < 30) {
    result.alerts.push('Low muscle engagement — squeeze harder at the top');
    result.engagementStatus = 'low';
    session.ineffectiveReps++;
  }

  // Case 2: Bad form + Uneven/High FSR → Injury risk
  if (cvScore < 40 && fsrScore > 50) {
    result.alerts.push('Injury risk — poor form with high force detected');
    result.engagementStatus = 'risk';
    result.injuryRisk = true;
    session.injuryRiskEvents++;
  }

  // Case 3: Peak contraction check
  if (frameResult.repState === 'PEAK') {
    if (avgFSR < FSR_PEAK_THRESHOLD) {
      result.alerts.push('Squeeze harder at peak contraction');
      result.engagementStatus = 'weak_peak';
    }
  }

  // Good engagement
  if (cvScore >= 60 && fsrScore >= 60) {
    result.engagementStatus = 'good';
  }

  return result;
}

/**
 * Get rep-level engagement summary for completed rep.
 */
function getRepEngagement(session) {
  const rep = session.currentRep;
  const readings = rep.fsrReadings;

  if (readings.length === 0) {
    return { avgFSR: 0, peakFSR: 0, engaged: false };
  }

  const avgFSR = readings.reduce((a, b) => a + b, 0) / readings.length;

  return {
    avgFSR: Math.round(avgFSR),
    peakFSR: rep.peakFSR,
    engaged: avgFSR >= FSR_LOW_THRESHOLD,
  };
}

module.exports = {
  analyzeFusion,
  computeCVScore,
  computeFSRScore,
  getRepEngagement,
};
