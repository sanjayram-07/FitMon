const { GoogleGenerativeAI } = require('@google/generative-ai');

let model;

function initializeGemini() {
  if (model) {
    return model;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }

  const client = new GoogleGenerativeAI(apiKey);
  model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' });
  return model;
}

async function generateSessionInsights(summary) {
  const activeModel = initializeGemini();
  if (!activeModel) {
    return defaultInsights(summary);
  }

  const exerciseLabel = (summary.exercise || 'bicep_curl').replace(/_/g, ' ');
  const prompt = [
    'You are FitMon, an expert strength coach.',
    `Create a JSON-only post-session report for a ${exerciseLabel} workout.`,
    'Focus on actionable suggestions, posture issues, and injury explanations specific to this exercise.',
    `Session: ${JSON.stringify(summary)}`,
    'Respond with JSON containing keys: summary, overallGrade, improvements, warnings, positiveFeedback, injuryExplanation.',
  ].join('\n');

  try {
    const result = await activeModel.generateContent(prompt);
    const text = result.response.text();
    const fenced = text.match(/```json\s*([\s\S]*?)\s*```/i);
    const payload = fenced ? fenced[1] : text;
    return JSON.parse(payload);
  } catch (error) {
    return defaultInsights(summary);
  }
}

function calculateGrade(summary) {
  const score =
    (summary.accuracy * 0.45) +
    (summary.avgPostureScore * 0.35) +
    ((100 - summary.injuryRiskScore) * 0.2);

  if (score >= 90) return 'A';
  if (score >= 78) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'F';
}

function defaultInsights(summary) {
  return {
    summary: `You completed ${summary.totalReps} curls with ${summary.accuracy}% accuracy and an average posture score of ${summary.avgPostureScore}.`,
    overallGrade: calculateGrade(summary),
    improvements: [
      summary.avgPostureScore < 70
        ? 'Keep the elbow pinned and avoid swinging through the mid-range.'
        : 'Maintain the same controlled elbow path on every rep.',
      summary.ineffectiveReps > 0
        ? 'Drive harder into peak contraction to improve engagement.'
        : 'Pause briefly at the top of each curl to reinforce control.',
      'Aim for smooth tempo on both the concentric and eccentric phases.',
    ],
    warnings: summary.injuryRiskScore > 25
      ? ['Force output exceeded movement quality on several reps. Reduce intensity and clean up mechanics.']
      : [],
    positiveFeedback: [
      summary.correctReps > 0
        ? `You logged ${summary.correctReps} technically solid reps.`
        : 'You completed the full session and generated usable movement data.',
    ],
    injuryExplanation: summary.injuryRiskScore > 25
      ? 'Elevated risk was triggered by strong sensor pressure arriving during low-quality movement patterns.'
      : 'No major injury pattern was detected from the movement and sensor fusion data.',
  };
}

module.exports = {
  generateSessionInsights,
  initializeGemini,
};
