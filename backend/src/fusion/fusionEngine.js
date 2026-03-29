const { getAverageFSR } = require('../session/sessionStore');

function computeFSRScore(averageFsr) {
  if (!Number.isFinite(averageFsr) || averageFsr <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(averageFsr)));
}

function analyzeFusion(session, cvPayload) {
  const cvScore = Math.max(0, Math.min(100, Math.round(cvPayload.postureScore || cvPayload.formScore || 0)));
  const averageFsr = getAverageFSR(session);
  const fsrScore = computeFSRScore(averageFsr);
  const alerts = [];
  let engagementStatus = 'normal';

  if (!session.fsrWindow.length) {
    engagementStatus = 'no_sensor';
  } else if (cvScore >= 70 && fsrScore < 30) {
    engagementStatus = 'low_engagement';
    session.ineffectiveReps += cvPayload.repCompleted ? 1 : 0;
    alerts.push('Good motion detected, but sensor engagement is low. Squeeze harder at peak contraction.');
  } else if (cvScore < 45 && fsrScore > 50) {
    engagementStatus = 'injury_risk';
    session.injuryRiskEvents += 1;
    alerts.push('High force with weak curl mechanics detected. Reduce load and stabilize the elbow.');
  } else if (cvScore >= 70 && fsrScore >= 60) {
    engagementStatus = 'good';
  }

  if (cvPayload.repState === 'UP' && session.fsrWindow.length && averageFsr < 35) {
    alerts.push('Peak contraction looks soft. Hold and squeeze at the top of the curl.');
  }

  return {
    cvScore,
    fsrScore,
    engagementStatus,
    averageFsr: Math.round(averageFsr),
    alerts,
    fusionScore: Math.round((cvScore * 0.65) + (fsrScore * 0.35)),
  };
}

module.exports = { analyzeFusion };
