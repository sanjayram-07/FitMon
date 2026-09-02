const { admin, getDb } = require('../firebase/admin');
const { targetsFor, bmiFor, verify, correctionFor, macrosOf } = require('../diet/engine');
const { compose } = require('../diet/compose');
const { BY_ID } = require('../diet/foods');

/** Attach display name/unit/macros to each sanitised {id, qty} so the UI never needs the food table. */
function enrichMeals(meals) {
  return meals.map((meal) => ({
    ...meal,
    items: meal.items.map((item) => {
      const food = BY_ID[item.id];
      const macros = macrosOf(item.id, item.qty);
      return {
        id: item.id,
        qty: item.qty,
        name: food.name,
        unit: food.unit,
        kcal: Math.round(macros.kcal),
        protein: +macros.p.toFixed(1),
        carbs: +macros.c.toFixed(1),
        fat: +macros.f.toFixed(1),
      };
    }),
  }));
}

function clampProfile(body = {}) {
  return {
    sex: body.sex === 'f' ? 'f' : 'm',
    age: Math.min(80, Math.max(14, Number(body.age) || 25)),
    weightKg: Math.min(200, Math.max(35, Number(body.weightKg) || 70)),
    heightCm: Math.min(220, Math.max(130, Number(body.heightCm) || 170)),
    activity: [1.2, 1.375, 1.55, 1.725, 1.9].includes(Number(body.activity)) ? Number(body.activity) : 1.55,
    goal: ['cut', 'recomp', 'bulk'].includes(body.goal) ? body.goal : 'recomp',
    diet: ['vegan', 'veg', 'egg', 'nonveg'].includes(body.diet) ? body.diet : 'veg',
    kitchen: ['home', 'hostel', 'pg'].includes(body.kitchen) ? body.kitchen : 'home',
    training: body.training === 'am' ? 'am' : 'pm',
  };
}

/**
 * POST /api/onboarding — body measurements + preferences captured right
 * after the first Google sign-in. Marks the account onboarded so the
 * frontend stops redirecting to /onboarding.
 */
async function submitOnboarding(req, res) {
  try {
    const profile = clampProfile(req.body);
    const bmi = bmiFor(profile);
    const db = getDb();
    const userRef = db.collection('users').doc(req.user.uid);

    await userRef.set(
      {
        onboarded: true,
        bodyProfile: profile,
        bmi,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true },
    );

    const snapshot = await userRef.get();
    res.json({ user: { uid: req.user.uid, ...snapshot.data() } });
  } catch (error) {
    res.status(400).json({ message: 'Failed to save onboarding profile', details: error.message });
  }
}

async function recentExerciseSummary(uid) {
  try {
    const db = getDb();
    // No orderBy here on purpose: an equality filter + orderBy on a different
    // field needs a composite Firestore index. Sort in memory instead — this
    // collection is small per user.
    const snap = await db.collection('sessions').where('uid', '==', uid).get();
    if (snap.empty) return 'No FitMon sessions logged yet — assume the stated activity level only.';
    const recent = snap.docs
      .map((doc) => doc.data())
      .sort((a, b) => (b.startedAt || 0) - (a.startedAt || 0))
      .slice(0, 7);
    const counts = {};
    recent.forEach((data) => {
      const ex = data.exercise || 'bicep_curl';
      counts[ex] = (counts[ex] || 0) + 1;
    });
    const parts = Object.entries(counts).map(([ex, n]) => `${n}x ${ex.replace(/_/g, ' ')}`);
    return `Recent FitMon sessions (last 7): ${parts.join(', ')}.`;
  } catch {
    return 'general strength training';
  }
}

/**
 * POST /api/diet/plan — COMPUTE (pure math) -> COMPOSE (Gemini picks foods)
 * -> VERIFY (recompute macros from our own table). One retry if the model
 * misses targets by more than the tolerance.
 */
async function generatePlan(req, res) {
  try {
    const db = getDb();
    const userRef = db.collection('users').doc(req.user.uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? userSnap.data() : {};

    const profile = clampProfile({ ...userData.bodyProfile, ...req.body });
    const targets = targetsFor(profile);
    const bmi = bmiFor(profile);
    profile.recentExerciseSummary = await recentExerciseSummary(req.user.uid);

    let { meals, tip } = await compose(profile, targets);
    let v = verify(meals, targets);

    if (!v.passed) {
      try {
        const retry = await compose(profile, targets, correctionFor(v));
        const v2 = verify(retry.meals, targets);
        if (v2.worstDriftPct < v.worstDriftPct) {
          ({ meals, tip } = retry);
          v = v2;
        }
      } catch {
        // keep the first plan — it is still a usable plan even if imperfect
      }
    }

    const plan = {
      meals: enrichMeals(meals),
      tip,
      targets,
      bmi,
      profile,
      verify: v,
      generatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await userRef.set(
      { bodyProfile: profile, bmi, dietPlan: plan, updatedAt: admin.firestore.FieldValue.serverTimestamp() },
      { merge: true },
    );

    res.json({ ...plan, generatedAt: Date.now() });
  } catch (error) {
    res.status(502).json({ message: 'Failed to generate diet plan', details: error.message });
  }
}

/** GET /api/diet/plan/latest */
async function getLatestPlan(req, res) {
  try {
    const db = getDb();
    const userSnap = await db.collection('users').doc(req.user.uid).get();
    const data = userSnap.exists ? userSnap.data() : {};
    if (!data.dietPlan) {
      return res.json({ plan: null, bodyProfile: data.bodyProfile || null, bmi: data.bmi || null });
    }
    res.json({ plan: data.dietPlan, bodyProfile: data.bodyProfile, bmi: data.bmi });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load diet plan', details: error.message });
  }
}

module.exports = { submitOnboarding, generatePlan, getLatestPlan };
