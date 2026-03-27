/**
 * Bicep Curl CV Logic (Client-Side JS)
 * This logic handles the angle computation and rep counting state machine.
 */

export const CURL_UP_THRESHOLD = 70;
export const CURL_DOWN_THRESHOLD = 140;

export function calculateAngle(a, b, c) {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (magBA === 0 || magBC === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
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

/**
 * Main rep counting logic moved from backend.
 */
export class BicepCurlEngine {
  constructor() {
    this.state = 'IDLE';
    this.totalReps = 0;
    this.correctReps = 0;
    this.minAngle = 180;
    this.maxAngle = 0;
    this.history = []; // velocity, etc.
    this.prevAngle = null;
    this.prevTime = null;
  }

  processFrame(landmarks, timestamp) {
    const joints = extractArmJoints(landmarks);
    if (!joints || joints.visibility < 0.5) {
      return { valid: false, message: 'Arm not visible' };
    }

    const angle = calculateAngle(joints.shoulder, joints.elbow, joints.wrist);
    
    // Simple velocity calculation
    let velocity = 0;
    if (this.prevAngle !== null && this.prevTime !== null) {
      const dt = (timestamp - this.prevTime) / 1000;
      if (dt > 0) velocity = Math.abs(angle - this.prevAngle) / dt;
    }

    this.minAngle = Math.min(this.minAngle, angle);
    this.maxAngle = Math.max(this.maxAngle, angle);

    let repCompleted = false;
    let repCorrect = false;
    let feedback = [];

    // State machine
    if (this.state === 'IDLE' && angle < CURL_DOWN_THRESHOLD) {
      this.state = 'CURLING';
    } else if (this.state === 'CURLING') {
      if (angle <= CURL_UP_THRESHOLD) {
        this.state = 'PEAK';
      } else if (angle > CURL_DOWN_THRESHOLD) {
        this.state = 'IDLE';
        feedback.push('Complete full curl range');
      }
    } else if (this.state === 'PEAK') {
      if (angle > CURL_UP_THRESHOLD + 20) {
        this.state = 'EXTENDING';
      }
    } else if (this.state === 'EXTENDING') {
      if (angle >= CURL_DOWN_THRESHOLD) {
        this.state = 'IDLE';
        repCompleted = true;
        
        // Quality check
        const rom = this.maxAngle - this.minAngle;
        const formScore = (rom / 120) * 100; // Simplified for client demo
        repCorrect = formScore >= 60;
        
        this.totalReps++;
        if (repCorrect) this.correctReps++;
        
        // Reset counters
        this.minAngle = 180;
        this.maxAngle = 0;
      }
    }

    this.prevAngle = angle;
    this.prevTime = timestamp;

    return {
      valid: true,
      angle: Math.round(angle),
      repState: this.state,
      repCompleted,
      repCorrect,
      repCount: this.totalReps,
      feedback,
      postureScore: 100, // Client side hardcodes high posture for now
    };
  }

  reset() {
    this.state = 'IDLE';
    this.totalReps = 0;
    this.correctReps = 0;
    this.minAngle = 180;
    this.maxAngle = 0;
    this.prevAngle = null;
    this.prevTime = null;
  }
}
