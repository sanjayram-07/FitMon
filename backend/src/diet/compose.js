/**
 * THE AI LAYER — the only file in the diet planner that talks to a model.
 *
 * Contract, enforced in both directions:
 *   IN:  targets + a diet-filtered food table
 *   OUT: { id, qty } and nothing else. Never a calorie. Never a macro.
 *
 * Everything Gemini returns is treated as untrusted until sanitize() has
 * cleared it — unknown ids, ids the user's diet forbids, out-of-range
 * quantities, and malformed shapes are all stripped before the result
 * touches the response.
 */

const { initializeGemini } = require('../services/geminiService');
const { allowedFoods, allowedIds } = require('./foods');

const KITCHEN = {
  home: 'Home kitchen. Family cooks normal Indian food. Assume dal, sabzi, rice and roti are always available.',
  hostel: 'Hostel mess plus an electric kettle. Cooking is close to impossible. Favour mess staples, curd, fruit, whey, and roasted or soaked items.',
  pg: 'PG or shared flat. Can cook simple things only: boiling, one pan, no elaborate recipes.',
};

const TRAINING = {
  am: 'Trains 6-8 AM. Put a light feed before it and the biggest carb-and-protein feed straight after.',
  pm: 'Trains 6-8 PM. Put a pre-workout snack around 5 PM and the post-workout feed around 8:30 PM.',
};

function buildPrompt(profile, targets, correction) {
  const menu = allowedFoods(profile.diet)
    .map((f) => `${f.id} | ${f.name} | 1 ${f.unit} = ${f.kcal}kcal P${f.p} C${f.c} F${f.f} | ${f.slots.join(',')}`)
    .join('\n');

  let prompt = `You compose one day of Indian home-style eating for a strength athlete training with FitMon (${profile.recentExerciseSummary || 'general strength training'}).

TARGETS — hit each within 8%:
kcal ${targets.kcal} | protein ${targets.protein}g | carbs ${targets.carbs}g | fat ${targets.fat}g

SITUATION:
${KITCHEN[profile.kitchen] ?? KITCHEN.home}
${TRAINING[profile.training] ?? TRAINING.pm}

FOODS — you may ONLY use these ids:
${menu}

RULES:
- Exactly 5 meals covering the whole day.
- 2 to 4 items per meal.
- qty is a multiplier of the listed unit, in steps of 0.5, between 0.5 and 6.
- Do NOT output calories or macros. Output ids and quantities only. The app computes every number.
- Respect the slot tags: a food tagged breakfast should not turn up at dinner.
- Output ONLY raw JSON. No markdown fences, no preamble.

SCHEMA:
{"meals":[{"slot":"Breakfast","time":"07:30","items":[{"id":"oats","qty":1.5}]}],"tip":"one short practical line"}`;

  if (correction) {
    prompt += `\n\nYOUR LAST ATTEMPT MISSED THE TARGETS:
${correction}
Adjust quantities, and swap items if you must. Return the full corrected JSON in the same schema.`;
  }
  return prompt;
}

/** Strip anything the model returned that isn't a valid, diet-legal food reference. */
function sanitize(parsed, diet) {
  const ok = allowedIds(diet);
  const arr = (x) => (Array.isArray(x) ? x : []);

  const meals = arr(parsed?.meals)
    .map((m) => ({
      slot: String(m?.slot ?? 'Meal').slice(0, 40),
      time: String(m?.time ?? '').slice(0, 10),
      items: arr(m?.items)
        .filter((i) => i && typeof i.id === 'string' && ok.has(i.id))
        .map((i) => {
          const q = Number(i.qty);
          if (!Number.isFinite(q)) return null;
          const snapped = Math.round(q * 2) / 2;
          return { id: i.id, qty: Math.min(6, Math.max(0.5, snapped)) };
        })
        .filter(Boolean)
        .slice(0, 6),
    }))
    .filter((m) => m.items.length > 0)
    .slice(0, 6);

  const tip = typeof parsed?.tip === 'string' ? parsed.tip.slice(0, 200) : '';
  return { meals, tip };
}

function extractJson(text) {
  const cleaned = text.replace(/```json|```/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('Model returned no JSON object.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

/** Call Gemini. Throws on anything it cannot make sense of. */
async function compose(profile, targets, correction) {
  const model = initializeGemini();
  if (!model) throw new Error('GEMINI_API_KEY is not configured on the server.');

  const prompt = buildPrompt(profile, targets, correction);
  const result = await model.generateContent(prompt);
  const raw = result.response.text();

  const parsed = extractJson(raw);
  const { meals, tip } = sanitize(parsed, profile.diet);
  if (!meals.length) throw new Error('Model produced no usable meals after sanitisation.');

  return { meals, tip, raw };
}

module.exports = { buildPrompt, sanitize, compose };
