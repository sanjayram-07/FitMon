const { getDb } = require('../config/firebase');
const { getModel } = require('../config/gemini');

/**
 * Save session report to Firestore.
 * Returns the document ID.
 */
async function saveToFirestore(summary) {
  const db = getDb();

  if (!db) {
    console.log('[Report] Firestore not available — skipping DB save.');
    return null;
  }

  try {
    const docRef = await db.collection('sessions').add({
      ...summary,
      createdAt: new Date().toISOString(),
    });
    console.log(`[Report] Session saved to Firestore: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('[Report] Failed to save to Firestore:', error.message);
    return null;
  }
}

/**
 * Generate AI insights using Gemini.
 */
async function generateGeminiInsights(summary) {
  const model = getModel();

  if (!model) {
    console.log('[Gemini] Model not available — generating default insights.');
    return getDefaultInsights(summary);
  }

  const prompt = buildPrompt(summary);

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Try to parse structured JSON response
    try {
      const jsonMatch = response.match(/```json\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1]);
      }
      return JSON.parse(response);
    } catch {
      // If not valid JSON, return as narrative
      return {
        summary: response,
        improvements: [],
        warnings: [],
        overallGrade: calculateGrade(summary),
      };
    }
  } catch (error) {
    console.error('[Gemini] Failed to generate insights:', error.message);
    return getDefaultInsights(summary);
  }
}

/**
 * Build prompt for Gemini.
 */
function buildPrompt(summary) {
  return `You are FitMon AI — an expert fitness coach analyzing a bicep curl workout session.

Analyze this session data and provide actionable coaching insights.

SESSION DATA:
- Duration: ${summary.duration} seconds
- Total Reps: ${summary.totalReps}
- Correct Reps: ${summary.correctReps}
- Incorrect Reps: ${summary.incorrectReps}
- Accuracy: ${summary.accuracy}%
- Average Posture Score: ${summary.avgPostureScore}/100
- Ineffective Reps (low muscle engagement): ${summary.ineffectiveReps}
- Injury Risk Score: ${summary.injuryRiskScore}/100
- Warnings during session: ${JSON.stringify(summary.warnings.slice(0, 10))}
- Rep History: ${JSON.stringify(summary.repHistory.slice(0, 20))}

Respond ONLY with valid JSON in this exact format:
\`\`\`json
{
  "summary": "2-3 sentence overall session summary",
  "overallGrade": "A/B/C/D/F",
  "improvements": [
    "Specific actionable improvement 1",
    "Specific actionable improvement 2",
    "Specific actionable improvement 3"
  ],
  "warnings": [
    "Any injury/form concerns to address"
  ],
  "positiveFeedback": [
    "What the user did well"
  ]
}
\`\`\``;
}

/**
 * Calculate letter grade from summary.
 */
function calculateGrade(summary) {
  const score = (summary.accuracy * 0.4) +
    (summary.avgPostureScore * 0.3) +
    ((100 - summary.injuryRiskScore) * 0.3);

  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

/**
 * Fallback insights when Gemini is unavailable.
 */
function getDefaultInsights(summary) {
  const improvements = [];
  const warnings = [];
  const positives = [];

  if (summary.accuracy < 70) {
    improvements.push('Focus on completing full range of motion for each rep');
  }
  if (summary.avgPostureScore < 60) {
    improvements.push('Keep your elbow stationary and close to your body');
  }
  if (summary.ineffectiveReps > 0) {
    improvements.push(`${summary.ineffectiveReps} reps had low muscle engagement — squeeze harder at peak`);
  }
  if (summary.injuryRiskScore > 30) {
    warnings.push('Elevated injury risk detected — reduce weight and focus on form');
  }
  if (summary.accuracy >= 80) {
    positives.push('Great rep accuracy — your form is consistent');
  }
  if (summary.totalReps >= 10) {
    positives.push('Good volume — you completed a solid set');
  }

  return {
    summary: `You completed ${summary.totalReps} reps with ${summary.accuracy}% accuracy. ${summary.avgPostureScore >= 70 ? 'Your posture was solid.' : 'There is room for posture improvement.'}`,
    overallGrade: calculateGrade(summary),
    improvements: improvements.length > 0 ? improvements : ['Keep up the good work!'],
    warnings,
    positiveFeedback: positives.length > 0 ? positives : ['You showed up — consistency is key!'],
  };
}

/**
 * Full report generation pipeline.
 */
async function generateReport(summary) {
  // 1. Save to Firestore
  const firestoreId = await saveToFirestore(summary);

  // 2. Generate AI insights
  const insights = await generateGeminiInsights(summary);

  return {
    ...summary,
    firestoreId,
    insights,
  };
}

module.exports = { generateReport, saveToFirestore, generateGeminiInsights };
