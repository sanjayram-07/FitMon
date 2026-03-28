export const CURL_UP_THRESHOLD = 68;
export const CURL_DOWN_THRESHOLD = 138;
export const MIN_ROM_THRESHOLD = 78;
export const TARGET_ROM_THRESHOLD = 108;
export const MAX_CONTROLLED_VELOCITY = 210;
export const MIN_EXTENSION_ANGLE = 142;
export const MIN_STABLE_FRAMES = 4;

export function calculateAngle(a, b, c) {
  const radians =
    Math.atan2(c.y - b.y, c.x - b.x) -
    Math.atan2(a.y - b.y, a.x - b.x);

  let angle = Math.abs((radians * 180) / Math.PI);

  if (angle > 180) {
    angle = 360 - angle;
  }

  return angle;
}

export function extractArmJoints(landmarks) {
  if (!landmarks || landmarks.length < 17) return null;

  const leftArm = {
    shoulder: landmarks[11],
    elbow: landmarks[13],
    wrist: landmarks[15],
  };

  const rightArm = {
    shoulder: landmarks[12],
    elbow: landmarks[14],
    wrist: landmarks[16],
  };

  const leftVis = (leftArm.shoulder.visibility + leftArm.elbow.visibility + leftArm.wrist.visibility) / 3;
  const rightVis = (rightArm.shoulder.visibility + rightArm.elbow.visibility + rightArm.wrist.visibility) / 3;

  return leftVis > rightVis
    ? { ...leftArm, side: 'left', visibility: leftVis }
    : { ...rightArm, side: 'right', visibility: rightVis };
}

export class BicepCurlEngine {
  constructor() {
    this.reset();
  }

  processFrame(landmarks, timestamp) {
    const joints = extractArmJoints(landmarks);
    if (!joints || joints.visibility < 0.5) {
      return { valid: false, message: 'Arm not visible' };
    }

    const angle = calculateAngle(joints.shoulder, joints.elbow, joints.wrist);

    let velocity = 0;
    if (this.prevAngle !== null && this.prevTime !== null) {
      const dt = (timestamp - this.prevTime) / 1000;
      if (dt > 0) {
        velocity = Math.abs(angle - this.prevAngle) / dt;
      }
    }

    this.velocityHistory.push(velocity);
    if (this.velocityHistory.length > 20) {
      this.velocityHistory.shift();
    }

    this.minAngle = Math.min(this.minAngle, angle);
    this.maxAngle = Math.max(this.maxAngle, angle);
    this.frameCount += 1;

    if (this.referenceElbowX === null) {
      this.referenceElbowX = joints.elbow.x;
    }

    if (this.referenceShoulderY === null) {
      this.referenceShoulderY = joints.shoulder.y;
    }

    if (angle > CURL_DOWN_THRESHOLD) {
      this.stage = 'DOWN';
    }

    let repCompleted = false;
    let repCorrect = false;
    const feedback = [];

    const elbowDrift = Math.abs(joints.elbow.x - this.referenceElbowX);
    const shoulderDrift = Math.abs(joints.shoulder.y - this.referenceShoulderY);
    const elbowStability = Math.max(0, 100 - elbowDrift * 720);
    const shoulderControl = Math.max(0, 100 - shoulderDrift * 900);
    const smoothnessSpread = this.velocityHistory.length
      ? Math.max(...this.velocityHistory) - Math.min(...this.velocityHistory)
      : 0;
    const meanVelocity = this.velocityHistory.length
      ? this.velocityHistory.reduce((sum, current) => sum + current, 0) / this.velocityHistory.length
      : 0;
    const smoothness = Math.max(0, 100 - Math.min(100, smoothnessSpread * 0.08));
    const speedControl = Math.max(0, 100 - Math.max(0, meanVelocity - MAX_CONTROLLED_VELOCITY) * 0.35);
    const postureScore = Math.round((elbowStability * 0.42) + (shoulderControl * 0.18) + (smoothness * 0.2) + (speedControl * 0.2));

    if (angle < CURL_UP_THRESHOLD && this.stage === 'DOWN' && this.frameCount > MIN_STABLE_FRAMES) {
      this.stage = 'UP';
      repCompleted = true;
      this.totalReps += 1;

      const rom = this.maxAngle - this.minAngle;
      const formScore = Math.round(
        Math.min(
          100,
          (Math.min(rom, TARGET_ROM_THRESHOLD) / TARGET_ROM_THRESHOLD) * 35 +
            (elbowStability * 0.28) +
            (shoulderControl * 0.12) +
            (smoothness * 0.12) +
            (speedControl * 0.13),
        ),
      );

      repCorrect = formScore >= 64;
      if (repCorrect) {
        this.correctReps += 1;
      }

      if (rom < MIN_ROM_THRESHOLD) feedback.push('Curl higher and lower fully to hit full range of motion.');
      if (this.maxAngle < MIN_EXTENSION_ANGLE) feedback.push('Open the elbow more at the bottom before the next rep.');
      if (elbowStability < 72) feedback.push('Keep your elbow pinned to your torso and avoid drifting forward.');
      if (shoulderControl < 72) feedback.push('Relax the shoulder and stop shrugging during the curl.');
      if (smoothness < 68 || speedControl < 68) feedback.push('Slow the rep down and control both lifting and lowering.');

      const result = {
        valid: true,
        angle: Math.round(angle),
        repState: this.stage,
        repCompleted,
        repCorrect,
        repCount: this.totalReps,
        correctReps: this.correctReps,
        feedback,
        postureScore,
        formScore,
        elbowStability: Math.round(elbowStability),
        smoothness: Math.round(smoothness),
        speedControl: Math.round(speedControl),
        shoulderControl: Math.round(shoulderControl),
        minAngle: Math.round(this.minAngle),
        maxAngle: Math.round(this.maxAngle),
        armSide: joints.side,
      };

      this.minAngle = 180;
      this.maxAngle = 0;
      this.referenceElbowX = joints.elbow.x;
      this.referenceShoulderY = joints.shoulder.y;
      this.prevAngle = angle;
      this.prevTime = timestamp;

      return result;
    }

    if (this.stage === 'DOWN' && this.frameCount <= MIN_STABLE_FRAMES) {
      feedback.push('Hold your start position steady for a moment before the first rep.');
    } else {
      if (elbowStability < 68) feedback.push('Keep elbow steady and close to your side.');
      if (shoulderControl < 68) feedback.push('Avoid lifting the shoulder to finish the curl.');
      if (speedControl < 68) feedback.push('Reduce momentum and control the tempo.');
      if (angle < 82 && this.maxAngle - this.minAngle < MIN_ROM_THRESHOLD) feedback.push('Squeeze higher at the top to complete the rep.');
    }

    this.prevAngle = angle;
    this.prevTime = timestamp;

    return {
      valid: true,
      angle: Math.round(angle),
      repState: this.stage || 'READY',
      repCompleted,
      repCorrect,
      repCount: this.totalReps,
      feedback,
      postureScore,
      formScore: Math.round((elbowStability * 0.32) + (shoulderControl * 0.18) + (smoothness * 0.2) + (speedControl * 0.3)),
      elbowStability: Math.round(elbowStability),
      smoothness: Math.round(smoothness),
      speedControl: Math.round(speedControl),
      shoulderControl: Math.round(shoulderControl),
      minAngle: Math.round(this.minAngle),
      maxAngle: Math.round(this.maxAngle),
      armSide: joints.side,
    };
  }

  reset() {
    this.stage = null;
    this.totalReps = 0;
    this.correctReps = 0;
    this.minAngle = 180;
    this.maxAngle = 0;
    this.velocityHistory = [];
    this.prevAngle = null;
    this.prevTime = null;
    this.referenceElbowX = null;
    this.referenceShoulderY = null;
    this.frameCount = 0;
  }
}
