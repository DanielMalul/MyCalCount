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

export const PACES = {
  slow: {
    label: 'איטי ומבוקר',
    desc: 'שמירה מקסימלית על מסת שריר והסתגלות קלה (כ-0.25 ק"ג בשבוע)',
    calOffsetCut: -250,
    calOffsetBulk: 250,
    kgPerWeek: 0.25
  },
  moderate: {
    label: 'בינוני / מאוזן',
    desc: 'הקצב הזהוב והמומלץ ביותר לחיטוב בריא (כ-0.5 ק"ג בשבוע)',
    calOffsetCut: -500,
    calOffsetBulk: 500,
    kgPerWeek: 0.5
  },
  fast: {
    label: 'מהיר / אגרסיבי',
    desc: 'תוצאות מהירות ומקסימליות בטווח הקצר (כ-0.75-1 ק"ג בשבוע)',
    calOffsetCut: -750,
    calOffsetBulk: 750,
    kgPerWeek: 0.75
  }
};

/**
  Calculates estimated time to reach goal weight based on current weight, target weight, and pace.
 */
export function estimateTimeToGoal(profile) {
  const currentWeight = parseFloat(profile.currentWeightKg) || 70;
  const targetWeight = parseFloat(profile.targetWeightKg) || 65;
  const weightDiff = Math.abs(currentWeight - targetWeight);

  if (weightDiff < 0.2) return { weeks: 0, days: 0, text: 'כבר הגעת ליעד! 🎉' };

  const paceObj = PACES[profile.pace || 'moderate'] || PACES.moderate;
  const weeks = Math.ceil(weightDiff / paceObj.kgPerWeek);
  const days = weeks * 7;

  let text = '';
  if (weeks < 4) {
    text = `כ-${weeks} שבועות (${days} ימים)`;
  } else {
    const months = Math.round((weeks / 4.33) * 10) / 10;
    text = `כ-${months} חודשים (${weeks} שבועות)`;
  }

  return { weeks, days, text, kgPerWeek: paceObj.kgPerWeek, weightDiff: Math.round(weightDiff * 10) / 10 };
}

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
  const paceObj = PACES[profile.pace || 'moderate'] || PACES.moderate;

  let calOffset = GOALS[profile.goal]?.calOffset || 0;
  if (profile.goal === 'cut') {
    calOffset = paceObj.calOffsetCut;
  } else if (profile.goal === 'bulk') {
    calOffset = paceObj.calOffsetBulk;
  }

  // Caloric target adjustment based on goal and pace
  let targetCalories = tdee + calOffset;

  // Safety floor
  const minCal = profile.gender === 'female' ? 1200 : 1500;
  if (targetCalories < minCal) {
    targetCalories = minCal;
  }

  // If user specified manual custom target calories
  if (profile.customTargetCalories && Number(profile.customTargetCalories) > 0) {
    targetCalories = Number(profile.customTargetCalories);
  }

  const weightKg = parseFloat(profile.currentWeightKg) || 70;

  // Protein: 2.2g per kg (4 kcal/g)
  let proteinGrams = Math.round(weightKg * 2.2);
  let proteinCalories = proteinGrams * 4;

  // If protein calories exceed 45% of target calories, adjust down
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

  const estimatedTime = estimateTimeToGoal(profile);

  return {
    bmr,
    tdee,
    targetCalories: Math.round(targetCalories),
    proteinGrams,
    carbGrams,
    fatGrams,
    estimatedTime
  };
}
