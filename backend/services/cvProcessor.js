const {
  calculateAngle,
  calculateAngularVelocity,
  detectJerk,
  calculateSmoothness,
  checkElbowStability,
  checkRangeOfMotion,
} = require('../utils/angleUtils');

// MediaPipe landmark indices
const LANDMARKS = {
  LEFT_SHOULDER: 11,
  LEFT_ELBOW: 13,
  LEFT_WRIST: 15,
  RIGHT_SHOULDER: 12,
  RIGHT_ELBOW: 14,
  RIGHT_WRIST: 16,
};

// Rep state machine thresholds
const CURL_UP_THRESHOLD = 70;    // Angle below this = curled
const CURL_DOWN_THRESHOLD = 140; // Angle above this = extended

/**
 * Extract relevant joint positions from landmarks array.
 * Returns both arms, picks the one with better visibility.
 */
function extractJoints(landmarks) {
  if (!landmarks || landmarks.length < 17) return null;

  const leftArm = {
    shoulder: landmarks[LANDMARKS.LEFT_SHOULDER],
    elbow: landmarks[LANDMARKS.LEFT_ELBOW],
    wrist: landmarks[LANDMARKS.LEFT_WRIST],
  };

  const rightArm = {
    shoulder: landmarks[LANDMARKS.RIGHT_SHOULDER],
    elbow: landmarks[LANDMARKS.RIGHT_ELBOW],
    wrist: landmarks[LANDMARKS.RIGHT_WRIST],
  };

  // Pick the arm with higher average visibility
  const leftVis = (leftArm.shoulder.visibility + leftArm.elbow.visibility + leftArm.wrist.visibility) / 3;
  const rightVis = (rightArm.shoulder.visibility + rightArm.elbow.visibility + rightArm.wrist.visibility) / 3;

  const activeArm = leftVis > rightVis ? leftArm : rightArm;
  const activeSide = leftVis > rightVis ? 'left' : 'right';

  return { ...activeArm, side: activeSide, visibility: Math.max(leftVis, rightVis) };
}

/**
 * Process a single frame of landmarks.
 * Returns feedback object with angle, rep state changes, form analysis.
 */
function processFrame(session, landmarks, timestamp) {
  const joints = extractJoints(landmarks);

  if (!joints || joints.visibility < 0.5) {
    return {
      valid: false,
      message: 'Position yourself so your arm is clearly visible',
    };
  }

  // Calculate elbow angle
  const angle = calculateAngle(joints.shoulder, joints.elbow, joints.wrist);

  // Calculate angular velocity
  let angularVelocity = 0;
  if (session.prevAngle !== null && session.prevTimestamp !== null) {
    const dt = timestamp - session.prevTimestamp;
    angularVelocity = calculateAngularVelocity(session.prevAngle, angle, dt);
    session.velocityHistory.push(angularVelocity);
    if (session.velocityHistory.length > 30) {
      session.velocityHistory.shift();
    }
  }

  // Biomechanical checks
  const elbowStability = checkElbowStability(joints.shoulder, joints.elbow);
  const isJerky = detectJerk(session.velocityHistory);
  const smoothness = calculateSmoothness(session.velocityHistory);

  // Speed check: too fast = bad form
  const speedOk = angularVelocity < 400; // deg/s

  // Update current rep angle tracking
  session.currentRep.minAngle = Math.min(session.currentRep.minAngle, angle);
  session.currentRep.maxAngle = Math.max(session.currentRep.maxAngle, angle);

  // Rep state machine
  let repCompleted = false;
  let repCorrect = false;
  const feedback = [];

  const prevState = session.repState;

  switch (session.repState) {
    case 'IDLE':
      if (angle < CURL_DOWN_THRESHOLD) {
        session.repState = 'CURLING';
        session.currentRep.startTime = timestamp;
      }
      break;

    case 'CURLING':
      if (angle <= CURL_UP_THRESHOLD) {
        session.repState = 'PEAK';
      }
      if (angle > CURL_DOWN_THRESHOLD) {
        // Went back without completing — partial rep
        session.repState = 'IDLE';
        feedback.push('Complete the full curl range');
      }
      break;

    case 'PEAK':
      if (angle > CURL_UP_THRESHOLD + 20) {
        session.repState = 'EXTENDING';
      }
      break;

    case 'EXTENDING':
      if (angle >= CURL_DOWN_THRESHOLD) {
        session.repState = 'IDLE';
        repCompleted = true;

        // Evaluate rep quality
        const rom = checkRangeOfMotion(session.currentRep.minAngle, session.currentRep.maxAngle);
        const formScore = (elbowStability * 0.3 + rom * 0.3 + (smoothness / 100) * 0.2 + (speedOk ? 0.2 : 0)) * 100;

        session.currentRep.formScore = Math.round(formScore);
        repCorrect = formScore >= 60;
      }
      break;
  }

  // Generate posture score for this frame
  const postureScore = Math.round(
    (elbowStability * 40) + (smoothness * 0.3) + (speedOk ? 30 : 0)
  );

  // Generate warnings
  if (elbowStability < 0.6) {
    feedback.push('Keep your elbow stable — avoid flaring');
  }
  if (isJerky) {
    feedback.push('Control your movement — avoid jerky motion');
  }
  if (!speedOk) {
    feedback.push('Slow down — maintain controlled tempo');
  }

  // Update session
  session.prevAngle = angle;
  session.prevTimestamp = timestamp;

  return {
    valid: true,
    angle: Math.round(angle),
    repState: session.repState,
    repCompleted,
    repCorrect,
    repCount: session.totalReps + (repCompleted ? 1 : 0),
    formScore: session.currentRep.formScore,
    postureScore,
    elbowStability: Math.round(elbowStability * 100),
    smoothness,
    feedback,
    repData: repCompleted ? { ...session.currentRep } : null,
  };
}

module.exports = { processFrame, extractJoints };
