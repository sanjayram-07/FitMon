/**
 * Calculate angle between three 3D points (in degrees).
 * Points: A (shoulder), B (elbow), C (wrist)
 * Returns the angle at point B.
 */
function calculateAngle(a, b, c) {
  const ba = { x: a.x - b.x, y: a.y - b.y, z: (a.z || 0) - (b.z || 0) };
  const bc = { x: c.x - b.x, y: c.y - b.y, z: (c.z || 0) - (b.z || 0) };

  const dot = ba.x * bc.x + ba.y * bc.y + ba.z * bc.z;
  const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2 + ba.z ** 2);
  const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2 + bc.z ** 2);

  if (magBA === 0 || magBC === 0) return 0;

  const cosAngle = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
  return (Math.acos(cosAngle) * 180) / Math.PI;
}

/**
 * Calculate angular velocity (degrees per second).
 */
function calculateAngularVelocity(prevAngle, currAngle, deltaTimeMs) {
  if (deltaTimeMs <= 0) return 0;
  return Math.abs(currAngle - prevAngle) / (deltaTimeMs / 1000);
}

/**
 * Detect jerk (sudden angular acceleration).
 * Returns true if velocity change exceeds threshold.
 */
function detectJerk(velocityHistory, threshold = 500) {
  if (velocityHistory.length < 2) return false;
  const len = velocityHistory.length;
  const acceleration = Math.abs(velocityHistory[len - 1] - velocityHistory[len - 2]);
  return acceleration > threshold;
}

/**
 * Calculate smoothness score (0-100) from velocity history.
 * Lower variance = smoother motion = higher score.
 */
function calculateSmoothness(velocityHistory) {
  if (velocityHistory.length < 3) return 100;

  const recent = velocityHistory.slice(-10);
  const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
  const variance = recent.reduce((sum, v) => sum + (v - mean) ** 2, 0) / recent.length;
  const stdDev = Math.sqrt(variance);

  // Normalize: low stdDev = high smoothness
  const smoothness = Math.max(0, Math.min(100, 100 - stdDev * 0.5));
  return Math.round(smoothness);
}

/**
 * Check if elbow is stable (not flaring out).
 * Compares elbow x-position to shoulder x-position.
 */
function checkElbowStability(shoulder, elbow, threshold = 0.08) {
  const drift = Math.abs(elbow.x - shoulder.x);
  return drift < threshold ? 1 : Math.max(0, 1 - (drift - threshold) * 5);
}

/**
 * Check range of motion (ROM).
 * A good bicep curl goes from ~160° (extended) to ~40° (contracted).
 */
function checkRangeOfMotion(minAngle, maxAngle) {
  const rom = maxAngle - minAngle;
  const idealROM = 120; // 160 - 40

  if (rom >= idealROM * 0.8) return 1.0;
  if (rom >= idealROM * 0.5) return 0.7;
  return 0.4;
}

module.exports = {
  calculateAngle,
  calculateAngularVelocity,
  detectJerk,
  calculateSmoothness,
  checkElbowStability,
  checkRangeOfMotion,
};
