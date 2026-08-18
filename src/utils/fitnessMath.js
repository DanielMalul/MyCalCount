/**
 * Mifflin-St Jeor Math Engine for BMR, TDEE, Caloric Targets & Macro Split
 */

export const ACTIVITY_LEVELS = {
  sedentary: { label: 'Sedentary (Office job / minimal exercise)', multiplier: 1.2 },
  light: { label: 'Lightly Active (1-3 workouts / week)', multiplier: 1.375 },
  moderate: { label: 'Moderately Active (3-5 workouts / week)', multiplier: 1.55 },
  active: { label: 'Very Active (6-7 intense workouts / week)', multiplier: 1.725 },
  extra: { label: 'Extra Active (Physical labor / double sessions)', multiplier: 1.9 }
};

export const GOALS = {
  cut: { label: 'Fat Loss (Cut)', calOffset: -500, desc: 'Caloric deficit for targeted fat reduction' },
  recomp: { label: 'Recomposition / Maintain', calOffset: 0, desc: 'Maintain weight while building lean muscle' },
  bulk: { label: 'Muscle Gain (Bulk)', calOffset: 500, desc: 'Caloric surplus for maximum muscle growth' }
};

/**
 * Calculates BMR (Basal Metabolic Rate) using Mifflin-St Jeor equation.
 */
export function calculateBMR({ age, gender, heightCm, currentWeightKg }) {
  const weight = parseFloat(currentWeightKg) || 70;
  const height = parseFloat(heightCm) || 175;
  const userAge = parseInt(age, 10) || 25;

  let bmr = 10 * weight + 6.25 * height - 5 * userAge;
  if (gender === 'female') {
    bmr -= 161;
  } else {
    bmr += 5; // male default
  }

  return Math.round(bmr);
}

/**
 * Calculates TDEE (Total Daily Energy Expenditure) based on BMR and Activity Level.
 */
export function calculateTDEE(bmr, activityLevel = 'moderate') {
  const multiplier = ACTIVITY_LEVELS[activityLevel]?.multiplier || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates target Daily Calories and Macro Split (Protein, Carbs, Fats).
 */
export function calculateTargets(profile) {
  const bmr = calculateBMR(profile);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const goalObj = GOALS[profile.goal] || GOALS.recomp;

  // Caloric target adjustment based on goal
  let targetCalories = tdee + goalObj.calOffset;

  // Safety floor
  const minCal = profile.gender === 'female' ? 1200 : 1500;
  if (targetCalories < minCal) {
    targetCalories = minCal;
  }

  const weightKg = parseFloat(profile.currentWeightKg) || 70;

  // Protein: 2.2g per kg (4 kcal/g)
  let proteinGrams = Math.round(weightKg * 2.2);
  let proteinCalories = proteinGrams * 4;

  // If protein calories exceed 40% of target calories, adjust down
  if (proteinCalories > targetCalories * 0.45) {
    proteinCalories = Math.round(targetCalories * 0.35);
    proteinGrams = Math.round(proteinCalories / 4);
  }

  // Fat: 25% of total caloric target (9 kcal/g)
  const fatCalories = Math.round(targetCalories * 0.25);
  const fatGrams = Math.round(fatCalories / 9);

  // Carbs: Remaining calories (4 kcal/g)
  const carbCalories = Math.max(0, targetCalories - (proteinCalories + fatCalories));
  const carbGrams = Math.round(carbCalories / 4);

  return {
    bmr,
    tdee,
    targetCalories: Math.round(targetCalories),
    proteinGrams,
    carbGrams,
    fatGrams
  };
}
