/**
 * THE ENGINE — every number the diet planner shows is produced here.
 *
 * There is no AI in this file. It is arithmetic: Mifflin-St Jeor BMR, an
 * activity-scaled TDEE, and goal-based macro targets. Gemini (in compose.js)
 * only ever picks *which foods* fill those targets — it returns food ids and
 * quantities, never a calorie or macro number. This file recomputes the
 * macros for whatever the model returns and reports the gap honestly, so a
 * weaker/cheaper model can't silently make the numbers wrong — it can only
 * miss the target, which verify() catches.
 */

const { BY_ID } = require('./foods');

const ACTIVITY_LEVELS = {
  1.2: 'Sedentary — little to no exercise, desk job',
  1.375: 'Lightly active — light exercise 1-3 days/week',
  1.55: 'Moderately active — moderate exercise/sports 3-5 days/week',
  1.725: 'Very active — hard exercise 6-7 days/week',
  1.9: 'Extremely active — physical job or training twice a day',
};

/** Calorie offset from maintenance, by goal. */
const KCAL_OFFSET = { cut: 0.8, recomp: 1.0, bulk: 1.1 };

/** Protein and fat are FLOORS scaled to bodyweight. Carbs get whatever is left. */
const PROTEIN_PER_KG = { cut: 2.2, recomp: 2.0, bulk: 1.8 };
const FAT_PER_KG = { cut: 0.8, recomp: 0.9, bulk: 1.0 };

/** Safety rails — a diet planner that prescribes 900 kcal to a 90kg lifter is a liability. */
const MIN_KCAL = 1200;
const MIN_CARBS_G = 60;

/** Mifflin-St Jeor BMR — the standard general-population equation. */
function bmr({ sex, weightKg, heightCm, age }) {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'm' ? 5 : -161);
}

/** Profile -> daily targets. Pure, deterministic. */
function targetsFor(p) {
  if (!KCAL_OFFSET[p.goal]) throw new Error(`Unknown goal: ${p.goal}`);
  if (!(p.weightKg > 0)) throw new Error('weightKg must be positive');
  if (!(p.activity >= 1.2)) throw new Error('activity multiplier out of range');

  const b = bmr(p);
  const tdee = b * p.activity;

  let kcal = Math.round((tdee * KCAL_OFFSET[p.goal]) / 10) * 10;
  if (kcal < MIN_KCAL) kcal = MIN_KCAL;

  const protein = Math.round(p.weightKg * PROTEIN_PER_KG[p.goal]);
  const fat = Math.round(p.weightKg * FAT_PER_KG[p.goal]);

  let carbs = Math.round((kcal - protein * 4 - fat * 9) / 4);
  if (carbs < MIN_CARBS_G) carbs = MIN_CARBS_G;

  return {
    bmr: Math.round(b),
    tdee: Math.round(tdee),
    kcal,
    protein,
    carbs,
    fat,
    proteinPerKg: +(protein / p.weightKg).toFixed(2),
  };
}

function bmiFor({ weightKg, heightCm }) {
  const heightM = heightCm / 100;
  const value = weightKg / (heightM * heightM);
  let category = 'Normal';
  if (value < 18.5) category = 'Underweight';
  else if (value >= 25 && value < 30) category = 'Overweight';
  else if (value >= 30) category = 'Obese';
  return { value: +value.toFixed(1), category };
}

function macrosOf(id, qty) {
  const f = BY_ID[id];
  if (!f) throw new Error(`Unknown food id: ${id}`);
  return { kcal: f.kcal * qty, p: f.p * qty, c: f.c * qty, f: f.f * qty };
}

function totals(meals) {
  return meals.reduce((t, m) => {
    m.items.forEach((i) => {
      const x = macrosOf(i.id, i.qty);
      t.kcal += x.kcal;
      t.p += x.p;
      t.c += x.c;
      t.f += x.f;
    });
    return t;
  }, { kcal: 0, p: 0, c: 0, f: 0 });
}

const grade = (pct) => (Math.abs(pct - 100) <= 5 ? 'ok' : Math.abs(pct - 100) <= 12 ? 'warn' : 'bad');

/** Recompute the model's plate from our own table and report the gap. */
function verify(meals, targets) {
  const t = totals(meals);
  const rows = [
    { key: 'kcal', label: 'KCAL', actual: t.kcal, target: targets.kcal },
    { key: 'protein', label: 'PROTEIN', actual: t.p, target: targets.protein },
    { key: 'carbs', label: 'CARBS', actual: t.c, target: targets.carbs },
    { key: 'fat', label: 'FAT', actual: t.f, target: targets.fat },
  ].map((r) => {
    const pct = (r.actual / r.target) * 100;
    return { ...r, pct, grade: grade(pct) };
  });

  const worstDriftPct = rows.reduce((a, r) => Math.max(a, Math.abs(r.pct - 100)), 0);
  return { rows, totals: t, worstDriftPct, passed: worstDriftPct <= 8 };
}

/** Turn a failed verification into a correction the model can act on. */
function correctionFor(v) {
  return v.rows
    .filter((r) => Math.abs(r.pct - 100) > 8)
    .map((r) => `${r.label}: you produced ${r.actual.toFixed(0)}, target is ${r.target}`)
    .join('\n');
}

module.exports = {
  ACTIVITY_LEVELS,
  MIN_KCAL,
  MIN_CARBS_G,
  bmr,
  bmiFor,
  targetsFor,
  macrosOf,
  totals,
  verify,
  correctionFor,
};
