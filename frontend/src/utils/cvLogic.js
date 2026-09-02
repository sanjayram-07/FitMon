// FitMon CV Logic — MediaPipe BlazePose landmark indices used below:
//   0 nose | 11/12 shoulders | 13/14 elbows | 15/16 wrists
//   23/24 hips | 25/26 knees | 27/28 ankles

export const MIN_STABLE_FRAMES = 4;
export const MAX_CONTROLLED_VELOCITY = 210;

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

function avgVisibility(points) {
  const valid = points.filter(Boolean);
  if (!valid.length) return 0;
  return valid.reduce((sum, p) => sum + (p.visibility ?? 0), 0) / valid.length;
}

/**
 * Shared velocity/smoothness/speed-control math. Every engine below feeds its
 * own tracked angle through this so scoring is consistent (and only needs to
 * be correct once) across all four exercises.
 */
function motionQuality(velocityHistory) {
  const smoothnessSpread = velocityHistory.length
    ? Math.max(...velocityHistory) - Math.min(...velocityHistory)
    : 0;
  const meanVelocity = velocityHistory.length
    ? velocityHistory.reduce((sum, v) => sum + v, 0) / velocityHistory.length
    : 0;
  const smoothness = Math.max(0, 100 - Math.min(100, smoothnessSpread * 0.08));
  const speedControl = Math.max(0, 100 - Math.max(0, meanVelocity - MAX_CONTROLLED_VELOCITY) * 0.35);
  return { smoothness, speedControl };
}

function pushVelocity(engine, angle, timestamp) {
  let velocity = 0;
  if (engine.prevAngle !== null && engine.prevTime !== null) {
    const dt = (timestamp - engine.prevTime) / 1000;
    if (dt > 0) velocity = Math.abs(angle - engine.prevAngle) / dt;
  }
  engine.velocityHistory.push(velocity);
  if (engine.velocityHistory.length > 20) engine.velocityHistory.shift();
  engine.prevAngle = angle;
  engine.prevTime = timestamp;
}

function driftScore(current, reference, factor) {
  if (reference === null) return 100;
  return Math.max(0, 100 - Math.abs(current - reference) * factor);
}

export function extractArmJoints(landmarks) {
  if (!landmarks || landmarks.length < 17) return null;

  const leftArm = { shoulder: landmarks[11], elbow: landmarks[13], wrist: landmarks[15] };
  const rightArm = { shoulder: landmarks[12], elbow: landmarks[14], wrist: landmarks[16] };

  const leftVis = avgVisibility([leftArm.shoulder, leftArm.elbow, leftArm.wrist]);
  const rightVis = avgVisibility([rightArm.shoulder, rightArm.elbow, rightArm.wrist]);

  return leftVis > rightVis
    ? { ...leftArm, side: 'left', visibility: leftVis }
    : { ...rightArm, side: 'right', visibility: rightVis };
}

export function extractLegJoints(landmarks) {
  if (!landmarks || landmarks.length < 29) return null;

  const leftLeg = { shoulder: landmarks[11], hip: landmarks[23], knee: landmarks[25], ankle: landmarks[27] };
  const rightLeg = { shoulder: landmarks[12], hip: landmarks[24], knee: landmarks[26], ankle: landmarks[28] };

  const leftVis = avgVisibility([leftLeg.hip, leftLeg.knee, leftLeg.ankle]);
  const rightVis = avgVisibility([rightLeg.hip, rightLeg.knee, rightLeg.ankle]);

  return leftVis > rightVis
    ? { ...leftLeg, side: 'left', visibility: leftVis }
    : { ...rightLeg, side: 'right', visibility: rightVis };
}

export function extractPlankJoints(landmarks) {
  if (!landmarks || landmarks.length < 29) return null;

  const left = {
    shoulder: landmarks[11], elbow: landmarks[13], wrist: landmarks[15],
    hip: landmarks[23], ankle: landmarks[27],
  };
  const right = {
    shoulder: landmarks[12], elbow: landmarks[14], wrist: landmarks[16],
    hip: landmarks[24], ankle: landmarks[28],
  };

  const leftVis = avgVisibility([left.shoulder, left.elbow, left.wrist, left.hip, left.ankle]);
  const rightVis = avgVisibility([right.shoulder, right.elbow, right.wrist, right.hip, right.ankle]);

  return leftVis > rightVis
    ? { ...left, side: 'left', visibility: leftVis }
    : { ...right, side: 'right', visibility: rightVis };
}

// ────────────────────────────────────────────────────────────────────────
// BICEP CURL — rep counted at peak contraction (elbow fully flexed).
// ────────────────────────────────────────────────────────────────────────

export const CURL_UP_THRESHOLD = 68;
export const CURL_DOWN_THRESHOLD = 138;
export const MIN_ROM_THRESHOLD = 78;
export const TARGET_ROM_THRESHOLD = 108;
export const MIN_EXTENSION_ANGLE = 142;

export class BicepCurlEngine {
  constructor() {
    this.reset();
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

  processFrame(landmarks, timestamp) {
    const joints = extractArmJoints(landmarks);
    if (!joints || joints.visibility < 0.5) {
      return { valid: false, message: 'Arm not visible' };
    }

    const angle = calculateAngle(joints.shoulder, joints.elbow, joints.wrist);
    pushVelocity(this, angle, timestamp);

    this.minAngle = Math.min(this.minAngle, angle);
    this.maxAngle = Math.max(this.maxAngle, angle);
    this.frameCount += 1;

    if (this.referenceElbowX === null) this.referenceElbowX = joints.elbow.x;
    if (this.referenceShoulderY === null) this.referenceShoulderY = joints.shoulder.y;

    if (angle > CURL_DOWN_THRESHOLD) this.stage = 'DOWN';

    const feedback = [];
    let repCompleted = false;
    let repCorrect = false;

    const elbowStability = driftScore(joints.elbow.x, this.referenceElbowX, 720);
    const shoulderControl = driftScore(joints.shoulder.y, this.referenceShoulderY, 900);
    const { smoothness, speedControl } = motionQuality(this.velocityHistory);
    const postureScore = Math.round((elbowStability * 0.42) + (shoulderControl * 0.18) + (smoothness * 0.2) + (speedControl * 0.2));

    if (angle < CURL_UP_THRESHOLD && this.stage === 'DOWN' && this.frameCount > MIN_STABLE_FRAMES) {
      this.stage = 'UP';
      repCompleted = true;
      this.totalReps += 1;

      const rom = this.maxAngle - this.minAngle;
      const formScore = Math.round(Math.min(100,
        (Math.min(rom, TARGET_ROM_THRESHOLD) / TARGET_ROM_THRESHOLD) * 35 +
        (elbowStability * 0.28) + (shoulderControl * 0.12) + (smoothness * 0.12) + (speedControl * 0.13)));

      repCorrect = formScore >= 64;
      if (repCorrect) this.correctReps += 1;

      if (rom < MIN_ROM_THRESHOLD) feedback.push('Curl higher and lower fully to hit full range of motion.');
      if (this.maxAngle < MIN_EXTENSION_ANGLE) feedback.push('Open the elbow more at the bottom before the next rep.');
      if (elbowStability < 72) feedback.push('Keep your elbow pinned to your torso and avoid drifting forward.');
      if (shoulderControl < 72) feedback.push('Relax the shoulder and stop shrugging during the curl.');
      if (smoothness < 68 || speedControl < 68) feedback.push('Slow the rep down and control both lifting and lowering.');

      const result = {
        valid: true, angle: Math.round(angle), repState: this.stage, repCompleted, repCorrect,
        repCount: this.totalReps, correctReps: this.correctReps, feedback, postureScore, formScore,
        elbowStability: Math.round(elbowStability), smoothness: Math.round(smoothness),
        speedControl: Math.round(speedControl), shoulderControl: Math.round(shoulderControl),
        minAngle: Math.round(this.minAngle), maxAngle: Math.round(this.maxAngle), side: joints.side,
      };

      this.minAngle = 180;
      this.maxAngle = 0;
      this.referenceElbowX = joints.elbow.x;
      this.referenceShoulderY = joints.shoulder.y;
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

    return {
      valid: true, angle: Math.round(angle), repState: this.stage || 'READY', repCompleted, repCorrect,
      repCount: this.totalReps, feedback, postureScore,
      formScore: Math.round((elbowStability * 0.32) + (shoulderControl * 0.18) + (smoothness * 0.2) + (speedControl * 0.3)),
      elbowStability: Math.round(elbowStability), smoothness: Math.round(smoothness),
      speedControl: Math.round(speedControl), shoulderControl: Math.round(shoulderControl),
      minAngle: Math.round(this.minAngle), maxAngle: Math.round(this.maxAngle), side: joints.side,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────
// SQUAT — knee angle (hip-knee-ankle). Rep counted on return to standing
// after depth was reached, which is the biomechanically correct way to
// count a squat (descend, hit depth, stand back up = one rep).
// ────────────────────────────────────────────────────────────────────────

export const SQUAT_STAND_THRESHOLD = 160;
export const SQUAT_DEPTH_THRESHOLD = 110;
export const SQUAT_PARALLEL_THRESHOLD = 100;

export class SquatEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.stage = 'STAND';
    this.visitedDepth = false;
    this.totalReps = 0;
    this.correctReps = 0;
    this.minAngle = 180;
    this.maxAngle = 0;
    this.velocityHistory = [];
    this.prevAngle = null;
    this.prevTime = null;
    this.referenceKneeX = null;
    this.referenceShoulderX = null;
    this.frameCount = 0;
  }

  processFrame(landmarks, timestamp) {
    const joints = extractLegJoints(landmarks);
    if (!joints || joints.visibility < 0.5) {
      return { valid: false, message: 'Legs not visible' };
    }

    const kneeAngle = calculateAngle(joints.hip, joints.knee, joints.ankle);
    pushVelocity(this, kneeAngle, timestamp);

    this.minAngle = Math.min(this.minAngle, kneeAngle);
    this.maxAngle = Math.max(this.maxAngle, kneeAngle);
    this.frameCount += 1;

    if (this.referenceKneeX === null) this.referenceKneeX = joints.ankle.x;
    if (this.referenceShoulderX === null) this.referenceShoulderX = joints.hip.x;

    if (kneeAngle < SQUAT_DEPTH_THRESHOLD) this.visitedDepth = true;

    const feedback = [];
    let repCompleted = false;
    let repCorrect = false;

    // Knee tracking: horizontal distance between knee and ankle (caving inward or shooting past toes).
    const kneeTracking = driftScore(joints.knee.x, this.referenceKneeX, 550);
    // Torso lean: how far the hip has drifted horizontally from the standing reference under the shoulder.
    const torsoControl = driftScore(joints.hip.x, this.referenceShoulderX, 400);
    const { smoothness, speedControl } = motionQuality(this.velocityHistory);
    const postureScore = Math.round((kneeTracking * 0.35) + (torsoControl * 0.25) + (smoothness * 0.2) + (speedControl * 0.2));

    if (kneeAngle > SQUAT_STAND_THRESHOLD && this.frameCount > MIN_STABLE_FRAMES) {
      if (this.visitedDepth) {
        this.stage = 'STAND';
        repCompleted = true;
        this.totalReps += 1;

        const depthOk = this.minAngle <= SQUAT_PARALLEL_THRESHOLD;
        const formScore = Math.round(Math.min(100,
          (depthOk ? 35 : (SQUAT_DEPTH_THRESHOLD - this.minAngle > 0 ? 20 : 10)) +
          (kneeTracking * 0.28) + (torsoControl * 0.17) + (smoothness * 0.1) + (speedControl * 0.1)));

        repCorrect = formScore >= 64;
        if (repCorrect) this.correctReps += 1;

        if (!depthOk) feedback.push('Squat lower until your thighs are at least parallel to the floor.');
        if (kneeTracking < 72) feedback.push('Track your knees over your toes — avoid letting them cave inward.');
        if (torsoControl < 72) feedback.push('Keep your chest up and avoid leaning too far forward.');
        if (smoothness < 68 || speedControl < 68) feedback.push('Control the descent — avoid dropping fast and bouncing at the bottom.');

        const result = {
          valid: true, angle: Math.round(kneeAngle), repState: this.stage, repCompleted, repCorrect,
          repCount: this.totalReps, correctReps: this.correctReps, feedback, postureScore, formScore,
          elbowStability: Math.round(kneeTracking), shoulderControl: Math.round(torsoControl),
          smoothness: Math.round(smoothness), speedControl: Math.round(speedControl),
          minAngle: Math.round(this.minAngle), maxAngle: Math.round(this.maxAngle), side: joints.side,
        };

        this.minAngle = 180;
        this.maxAngle = 0;
        this.visitedDepth = false;
        this.referenceKneeX = joints.ankle.x;
        this.referenceShoulderX = joints.hip.x;
        return result;
      }
      this.stage = 'STAND';
    } else if (kneeAngle < SQUAT_DEPTH_THRESHOLD) {
      this.stage = 'SQUAT';
    }

    if (this.stage === 'SQUAT') {
      if (kneeTracking < 68) feedback.push('Push your knees out over your toes.');
      if (torsoControl < 68) feedback.push('Brace your core and keep your chest tall.');
    }

    return {
      valid: true, angle: Math.round(kneeAngle), repState: this.stage, repCompleted, repCorrect,
      repCount: this.totalReps, feedback, postureScore,
      formScore: Math.round((kneeTracking * 0.35) + (torsoControl * 0.25) + (smoothness * 0.2) + (speedControl * 0.2)),
      elbowStability: Math.round(kneeTracking), shoulderControl: Math.round(torsoControl),
      smoothness: Math.round(smoothness), speedControl: Math.round(speedControl),
      minAngle: Math.round(this.minAngle), maxAngle: Math.round(this.maxAngle), side: joints.side,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────
// PUSH-UP — elbow angle plus shoulder-hip-ankle body-line angle so a
// sagging or piked hip is penalised, not just range of motion.
// ────────────────────────────────────────────────────────────────────────

export const PUSHUP_UP_THRESHOLD = 155;
export const PUSHUP_DOWN_THRESHOLD = 95;

export class PushUpEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.stage = 'UP';
    this.visitedDown = false;
    this.totalReps = 0;
    this.correctReps = 0;
    this.minAngle = 180;
    this.maxAngle = 0;
    this.velocityHistory = [];
    this.prevAngle = null;
    this.prevTime = null;
    this.minBodyLine = 180;
    this.frameCount = 0;
  }

  processFrame(landmarks, timestamp) {
    const joints = extractPlankJoints(landmarks);
    if (!joints || joints.visibility < 0.5) {
      return { valid: false, message: 'Body not fully visible' };
    }

    const elbowAngle = calculateAngle(joints.shoulder, joints.elbow, joints.wrist);
    const bodyLineAngle = calculateAngle(joints.shoulder, joints.hip, joints.ankle);
    pushVelocity(this, elbowAngle, timestamp);

    this.minAngle = Math.min(this.minAngle, elbowAngle);
    this.maxAngle = Math.max(this.maxAngle, elbowAngle);
    this.minBodyLine = Math.min(this.minBodyLine, bodyLineAngle);
    this.frameCount += 1;

    if (elbowAngle < PUSHUP_DOWN_THRESHOLD) this.visitedDown = true;

    const feedback = [];
    let repCompleted = false;
    let repCorrect = false;

    const bodyLineScore = Math.max(0, 100 - (180 - bodyLineAngle) * 4);
    const { smoothness, speedControl } = motionQuality(this.velocityHistory);
    const postureScore = Math.round((bodyLineScore * 0.5) + (smoothness * 0.25) + (speedControl * 0.25));

    if (elbowAngle > PUSHUP_UP_THRESHOLD && this.frameCount > MIN_STABLE_FRAMES) {
      if (this.visitedDown) {
        this.stage = 'UP';
        repCompleted = true;
        this.totalReps += 1;

        const depthOk = this.minAngle <= PUSHUP_DOWN_THRESHOLD;
        const bodyLineOk = this.minBodyLine >= 155;
        const formScore = Math.round(Math.min(100,
          (depthOk ? 35 : 15) + (bodyLineOk ? 30 : bodyLineScore * 0.3) +
          (smoothness * 0.17) + (speedControl * 0.18)));

        repCorrect = formScore >= 64;
        if (repCorrect) this.correctReps += 1;

        if (!depthOk) feedback.push('Lower your chest closer to the floor for full range of motion.');
        if (!bodyLineOk) feedback.push('Keep your body in a straight line — brace your core and avoid sagging hips.');
        if (smoothness < 68 || speedControl < 68) feedback.push('Control the tempo on both the way down and the way up.');

        const result = {
          valid: true, angle: Math.round(elbowAngle), repState: this.stage, repCompleted, repCorrect,
          repCount: this.totalReps, correctReps: this.correctReps, feedback, postureScore, formScore,
          elbowStability: Math.round(bodyLineScore), smoothness: Math.round(smoothness),
          speedControl: Math.round(speedControl), bodyLineAngle: Math.round(this.minBodyLine),
          minAngle: Math.round(this.minAngle), maxAngle: Math.round(this.maxAngle), side: joints.side,
        };

        this.minAngle = 180;
        this.maxAngle = 0;
        this.minBodyLine = 180;
        this.visitedDown = false;
        return result;
      }
      this.stage = 'UP';
    } else if (elbowAngle < PUSHUP_DOWN_THRESHOLD) {
      this.stage = 'DOWN';
    }

    if (bodyLineScore < 68) feedback.push('Squeeze your glutes and core to flatten your body line.');

    return {
      valid: true, angle: Math.round(elbowAngle), repState: this.stage, repCompleted, repCorrect,
      repCount: this.totalReps, feedback, postureScore,
      formScore: Math.round((bodyLineScore * 0.5) + (smoothness * 0.25) + (speedControl * 0.25)),
      elbowStability: Math.round(bodyLineScore), smoothness: Math.round(smoothness),
      speedControl: Math.round(speedControl), bodyLineAngle: Math.round(bodyLineAngle),
      minAngle: Math.round(this.minAngle), maxAngle: Math.round(this.maxAngle), side: joints.side,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────
// SHOULDER PRESS — elbow angle from rack to lockout, with an explicit
// overhead check (wrist above shoulder) so a "press" that never actually
// gets overhead doesn't score as a clean rep.
// ────────────────────────────────────────────────────────────────────────

export const PRESS_LOCKOUT_THRESHOLD = 155;
export const PRESS_RACK_THRESHOLD = 95;

export class ShoulderPressEngine {
  constructor() {
    this.reset();
  }

  reset() {
    this.stage = 'RACK';
    this.visitedLockout = false;
    this.reachedOverhead = false;
    this.totalReps = 0;
    this.correctReps = 0;
    this.minAngle = 180;
    this.maxAngle = 0;
    this.velocityHistory = [];
    this.prevAngle = null;
    this.prevTime = null;
    this.referenceElbowX = null;
    this.frameCount = 0;
  }

  processFrame(landmarks, timestamp) {
    const joints = extractArmJoints(landmarks);
    if (!joints || joints.visibility < 0.5) {
      return { valid: false, message: 'Arm not visible' };
    }

    const elbowAngle = calculateAngle(joints.shoulder, joints.elbow, joints.wrist);
    pushVelocity(this, elbowAngle, timestamp);

    this.minAngle = Math.min(this.minAngle, elbowAngle);
    this.maxAngle = Math.max(this.maxAngle, elbowAngle);
    this.frameCount += 1;

    if (this.referenceElbowX === null) this.referenceElbowX = joints.elbow.x;
    if (joints.wrist.y < joints.shoulder.y - 0.02) this.reachedOverhead = true;
    if (elbowAngle > PRESS_LOCKOUT_THRESHOLD) this.visitedLockout = true;

    const feedback = [];
    let repCompleted = false;
    let repCorrect = false;

    const elbowStability = driftScore(joints.elbow.x, this.referenceElbowX, 650);
    const { smoothness, speedControl } = motionQuality(this.velocityHistory);
    const postureScore = Math.round((elbowStability * 0.4) + (smoothness * 0.3) + (speedControl * 0.3));

    if (elbowAngle < PRESS_RACK_THRESHOLD && this.frameCount > MIN_STABLE_FRAMES) {
      if (this.visitedLockout) {
        this.stage = 'RACK';
        repCompleted = true;
        this.totalReps += 1;

        const lockoutOk = this.maxAngle >= PRESS_LOCKOUT_THRESHOLD;
        const formScore = Math.round(Math.min(100,
          (lockoutOk ? 30 : 12) + (this.reachedOverhead ? 25 : 8) +
          (elbowStability * 0.2) + (smoothness * 0.13) + (speedControl * 0.12)));

        repCorrect = formScore >= 64;
        if (repCorrect) this.correctReps += 1;

        if (!lockoutOk) feedback.push('Fully extend your arms overhead to lock out each rep.');
        if (!this.reachedOverhead) feedback.push('Press the weight directly overhead, not out in front of you.');
        if (elbowStability < 72) feedback.push('Keep your elbows tracking under the weight — avoid flaring outward.');
        if (smoothness < 68 || speedControl < 68) feedback.push('Control the tempo — avoid jerking the weight up.');

        const result = {
          valid: true, angle: Math.round(elbowAngle), repState: this.stage, repCompleted, repCorrect,
          repCount: this.totalReps, correctReps: this.correctReps, feedback, postureScore, formScore,
          elbowStability: Math.round(elbowStability), smoothness: Math.round(smoothness),
          speedControl: Math.round(speedControl), overhead: this.reachedOverhead,
          minAngle: Math.round(this.minAngle), maxAngle: Math.round(this.maxAngle), side: joints.side,
        };

        this.minAngle = 180;
        this.maxAngle = 0;
        this.visitedLockout = false;
        this.reachedOverhead = false;
        this.referenceElbowX = joints.elbow.x;
        return result;
      }
      this.stage = 'RACK';
    } else if (elbowAngle > PRESS_LOCKOUT_THRESHOLD) {
      this.stage = 'PRESS';
    }

    return {
      valid: true, angle: Math.round(elbowAngle), repState: this.stage, repCompleted, repCorrect,
      repCount: this.totalReps, feedback, postureScore,
      formScore: Math.round((elbowStability * 0.4) + (smoothness * 0.3) + (speedControl * 0.3)),
      elbowStability: Math.round(elbowStability), smoothness: Math.round(smoothness),
      speedControl: Math.round(speedControl), overhead: this.reachedOverhead,
      minAngle: Math.round(this.minAngle), maxAngle: Math.round(this.maxAngle), side: joints.side,
    };
  }
}

// ────────────────────────────────────────────────────────────────────────
// Registry — single place the UI and session flow read exercise metadata from.
// ────────────────────────────────────────────────────────────────────────

export const EXERCISES = {
  bicep_curl: { id: 'bicep_curl', label: 'Bicep Curl', Engine: BicepCurlEngine, tip: 'Stand side-on to the camera so your arm is clearly visible.' },
  squat: { id: 'squat', label: 'Squat', Engine: SquatEngine, tip: 'Stand facing the camera, full body in frame, hip to ankle.' },
  push_up: { id: 'push_up', label: 'Push-Up', Engine: PushUpEngine, tip: 'Set the camera side-on at floor level to see your full body line.' },
  shoulder_press: { id: 'shoulder_press', label: 'Shoulder Press', Engine: ShoulderPressEngine, tip: 'Stand facing the camera with your arm and shoulder clearly visible.' },
};

export function createEngine(exerciseId) {
  const entry = EXERCISES[exerciseId] || EXERCISES.bicep_curl;
  return new entry.Engine();
}
