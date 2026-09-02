/**
 * THE FOOD TABLE — every macro number the diet planner outputs traces back to a
 * row here. The model is never permitted to state a calorie; it may only
 * reference an `id`. Ported from the MacroThali food table (Indian home-style
 * eating, IFCT 2017-informed where noted).
 *
 * `verified: false` rows are reasonable estimates, not lab-verified.
 */

const FOODS = [
  // ---- grains & carbs ----
  { id: 'roti', name: 'Roti (whole wheat)', unit: 'medium roti', grams: 40, kcal: 104, p: 3.5, c: 20, f: 1.2, diet: 'vegan', slots: ['lunch', 'dinner'] },
  { id: 'rice', name: 'Rice, cooked', unit: 'katori (150g)', grams: 150, kcal: 195, p: 4, c: 43, f: 0.4, diet: 'vegan', slots: ['lunch', 'dinner'] },
  { id: 'idli', name: 'Idli', unit: 'idli', grams: 40, kcal: 58, p: 2, c: 12, f: 0.2, diet: 'vegan', slots: ['breakfast', 'snack'] },
  { id: 'dosa', name: 'Plain dosa', unit: 'dosa', grams: 80, kcal: 133, p: 3, c: 23, f: 3, diet: 'vegan', slots: ['breakfast', 'dinner'] },
  { id: 'poha', name: 'Poha', unit: 'katori (150g)', grams: 150, kcal: 250, p: 5, c: 45, f: 6, diet: 'vegan', slots: ['breakfast', 'snack'] },
  { id: 'upma', name: 'Upma', unit: 'katori (150g)', grams: 150, kcal: 230, p: 6, c: 35, f: 7, diet: 'veg', slots: ['breakfast', 'snack'] },
  { id: 'oats', name: 'Oats, dry', unit: '50g scoop', grams: 50, kcal: 190, p: 6.5, c: 33, f: 3.5, diet: 'vegan', slots: ['breakfast', 'snack', 'preworkout'] },
  { id: 'brown_bread', name: 'Brown bread', unit: '2 slices', grams: 56, kcal: 140, p: 5, c: 26, f: 2, diet: 'vegan', slots: ['breakfast', 'snack'] },
  { id: 'paratha', name: 'Plain paratha', unit: 'paratha', grams: 60, kcal: 210, p: 5, c: 30, f: 8, diet: 'veg', slots: ['breakfast', 'dinner'] },
  { id: 'bajra_roti', name: 'Bajra roti', unit: 'medium roti', grams: 45, kcal: 120, p: 4, c: 22, f: 1.5, diet: 'vegan', slots: ['lunch', 'dinner'] },

  // ---- vegetarian protein ----
  { id: 'dal', name: 'Toor dal', unit: 'katori (150g)', grams: 150, kcal: 150, p: 9, c: 22, f: 2.5, diet: 'vegan', slots: ['lunch', 'dinner'] },
  { id: 'rajma', name: 'Rajma', unit: 'katori (150g)', grams: 150, kcal: 190, p: 11, c: 30, f: 2, diet: 'vegan', slots: ['lunch', 'dinner'] },
  { id: 'chole', name: 'Chole / chana', unit: 'katori (150g)', grams: 150, kcal: 200, p: 11, c: 30, f: 4, diet: 'vegan', slots: ['lunch', 'dinner', 'snack'] },
  { id: 'paneer', name: 'Paneer, full fat', unit: '100g', grams: 100, kcal: 265, p: 18, c: 3, f: 20, diet: 'veg', slots: ['lunch', 'dinner', 'snack'] },
  { id: 'paneer_lf', name: 'Paneer, low fat', unit: '100g', grams: 100, kcal: 160, p: 22, c: 4, f: 6, diet: 'veg', slots: ['lunch', 'dinner', 'snack', 'postworkout'] },
  { id: 'tofu', name: 'Tofu', unit: '100g', grams: 100, kcal: 120, p: 13, c: 3, f: 7, diet: 'vegan', slots: ['lunch', 'dinner', 'snack'] },
  { id: 'soya', name: 'Soya chunks, dry', unit: '30g', grams: 30, kcal: 104, p: 15, c: 10, f: 0.2, diet: 'vegan', slots: ['lunch', 'dinner', 'postworkout'] },
  { id: 'sprouts', name: 'Sprouted moong', unit: 'katori (100g)', grams: 100, kcal: 105, p: 7, c: 19, f: 0.5, diet: 'vegan', slots: ['breakfast', 'snack'] },
  { id: 'curd', name: 'Curd, full fat', unit: 'katori (150g)', grams: 150, kcal: 90, p: 5, c: 7, f: 5, diet: 'veg', slots: ['lunch', 'dinner', 'snack'] },
  { id: 'hung_curd', name: 'Hung curd / Greek yogurt', unit: '150g', grams: 150, kcal: 130, p: 15, c: 6, f: 5, diet: 'veg', slots: ['breakfast', 'snack', 'postworkout'] },
  { id: 'milk_toned', name: 'Milk, toned', unit: 'glass (200ml)', grams: 200, kcal: 116, p: 6.4, c: 10, f: 6, diet: 'veg', slots: ['breakfast', 'snack', 'dinner'] },
  { id: 'milk_skim', name: 'Milk, skimmed', unit: 'glass (200ml)', grams: 200, kcal: 70, p: 7, c: 10, f: 0.2, diet: 'veg', slots: ['breakfast', 'snack', 'postworkout'] },
  { id: 'whey', name: 'Whey protein', unit: 'scoop (30g)', grams: 30, kcal: 120, p: 24, c: 3, f: 1.5, diet: 'veg', slots: ['postworkout', 'snack', 'breakfast'] },
  { id: 'peanut_butter', name: 'Peanut butter', unit: 'tbsp (16g)', grams: 16, kcal: 95, p: 4, c: 3, f: 8, diet: 'vegan', slots: ['breakfast', 'snack'] },
  { id: 'roasted_chana', name: 'Roasted chana', unit: '30g', grams: 30, kcal: 110, p: 6, c: 18, f: 1.5, diet: 'vegan', slots: ['snack', 'preworkout'] },
  { id: 'besan_chilla', name: 'Besan chilla', unit: 'medium chilla', grams: 50, kcal: 110, p: 6, c: 12, f: 4, diet: 'vegan', slots: ['breakfast', 'snack', 'dinner'] },
  { id: 'dhokla', name: 'Dhokla', unit: '2 pieces', grams: 70, kcal: 120, p: 5, c: 18, f: 3, diet: 'vegan', slots: ['snack', 'breakfast'] },

  // ---- egg ----
  { id: 'egg_whole', name: 'Whole egg', unit: 'large egg', grams: 50, kcal: 78, p: 6.3, c: 0.6, f: 5.3, diet: 'egg', slots: ['breakfast', 'snack', 'dinner'] },
  { id: 'egg_white', name: 'Egg white', unit: 'egg white', grams: 33, kcal: 17, p: 3.6, c: 0.2, f: 0.1, diet: 'egg', slots: ['breakfast', 'snack', 'postworkout'] },
  { id: 'egg_bhurji', name: 'Egg bhurji (2 eggs)', unit: 'serving', grams: 130, kcal: 210, p: 13, c: 4, f: 16, diet: 'egg', slots: ['breakfast', 'dinner'] },

  // ---- non-veg ----
  { id: 'chicken_breast', name: 'Chicken breast, cooked', unit: '100g', grams: 100, kcal: 165, p: 31, c: 0, f: 3.6, diet: 'nonveg', slots: ['lunch', 'dinner', 'postworkout'] },
  { id: 'chicken_curry', name: 'Chicken curry', unit: 'katori (~100g meat)', grams: 180, kcal: 220, p: 22, c: 5, f: 12, diet: 'nonveg', slots: ['lunch', 'dinner'] },
  { id: 'fish_curry', name: 'Fish curry (rohu)', unit: '100g', grams: 150, kcal: 145, p: 20, c: 2, f: 6, diet: 'nonveg', slots: ['lunch', 'dinner'] },
  { id: 'mutton_curry', name: 'Mutton curry', unit: '100g', grams: 150, kcal: 260, p: 21, c: 3, f: 18, diet: 'nonveg', slots: ['lunch', 'dinner'] },
  { id: 'prawns', name: 'Prawns, cooked', unit: '100g', grams: 100, kcal: 100, p: 20, c: 1, f: 1.5, diet: 'nonveg', slots: ['lunch', 'dinner'] },

  // ---- fats ----
  { id: 'ghee', name: 'Ghee', unit: 'tsp (5g)', grams: 5, kcal: 45, p: 0, c: 0, f: 5, diet: 'veg', slots: ['lunch', 'dinner', 'breakfast'] },
  { id: 'oil', name: 'Cooking oil', unit: 'tsp (5g)', grams: 5, kcal: 45, p: 0, c: 0, f: 5, diet: 'vegan', slots: ['lunch', 'dinner', 'breakfast'] },
  { id: 'almonds', name: 'Almonds', unit: '10 pieces', grams: 12, kcal: 70, p: 2.5, c: 2.5, f: 6, diet: 'vegan', slots: ['snack', 'breakfast'] },
  { id: 'walnuts', name: 'Walnuts', unit: '4 halves', grams: 10, kcal: 65, p: 1.5, c: 1.4, f: 6.5, diet: 'vegan', slots: ['snack', 'breakfast'] },
  { id: 'peanuts', name: 'Roasted peanuts', unit: '30g', grams: 30, kcal: 170, p: 8, c: 5, f: 14, diet: 'vegan', slots: ['snack'] },
  { id: 'coconut_chutney', name: 'Coconut chutney', unit: '2 tbsp', grams: 30, kcal: 90, p: 1.5, c: 3, f: 8, diet: 'vegan', slots: ['breakfast'] },

  // ---- vegetables & sides ----
  { id: 'sabzi', name: 'Mixed veg sabzi', unit: 'katori (150g)', grams: 150, kcal: 90, p: 3, c: 10, f: 4, diet: 'vegan', slots: ['lunch', 'dinner'] },
  { id: 'palak', name: 'Palak, cooked', unit: 'katori (150g)', grams: 150, kcal: 50, p: 3, c: 5, f: 2, diet: 'vegan', slots: ['lunch', 'dinner'] },
  { id: 'salad', name: 'Raw salad', unit: 'plate', grams: 150, kcal: 40, p: 2, c: 7, f: 0.5, diet: 'vegan', slots: ['lunch', 'dinner'] },
  { id: 'sambar', name: 'Sambar', unit: 'katori (150g)', grams: 150, kcal: 100, p: 5, c: 14, f: 3, diet: 'vegan', slots: ['breakfast', 'lunch', 'dinner'] },
  { id: 'rasam', name: 'Rasam', unit: 'katori (150g)', grams: 150, kcal: 45, p: 2, c: 6, f: 1.5, diet: 'vegan', slots: ['lunch', 'dinner'] },

  // ---- fruit ----
  { id: 'banana', name: 'Banana', unit: 'medium', grams: 118, kcal: 105, p: 1.3, c: 27, f: 0.3, diet: 'vegan', slots: ['breakfast', 'preworkout', 'snack', 'postworkout'] },
  { id: 'apple', name: 'Apple', unit: 'medium', grams: 180, kcal: 95, p: 0.5, c: 25, f: 0.3, diet: 'vegan', slots: ['snack', 'breakfast'] },
  { id: 'papaya', name: 'Papaya', unit: 'katori (150g)', grams: 150, kcal: 55, p: 0.9, c: 14, f: 0.2, diet: 'vegan', slots: ['snack', 'breakfast'] },
  { id: 'dates', name: 'Dates', unit: '2 pieces', grams: 30, kcal: 110, p: 1, c: 27, f: 0.2, diet: 'vegan', slots: ['preworkout', 'snack'] },
];

const BY_ID = Object.fromEntries(FOODS.map((f) => [f.id, f]));

/** A diet tier inherits everything below it. Vegan ⊂ Veg ⊂ Egg ⊂ Non-veg. */
const DIET_ALLOWS = {
  vegan: ['vegan'],
  veg: ['vegan', 'veg'],
  egg: ['vegan', 'veg', 'egg'],
  nonveg: ['vegan', 'veg', 'egg', 'nonveg'],
};

function allowedFoods(diet) {
  const tiers = DIET_ALLOWS[diet];
  if (!tiers) throw new Error(`Unknown diet: ${diet}`);
  return FOODS.filter((f) => tiers.includes(f.diet));
}

function allowedIds(diet) {
  return new Set(allowedFoods(diet).map((f) => f.id));
}

module.exports = { FOODS, BY_ID, DIET_ALLOWS, allowedFoods, allowedIds };
