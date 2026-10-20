import { GoogleGenerativeAI } from '@google/generative-ai';

// In-memory cache for image analysis results (keyed by first 200 chars of base64)
const imageAnalysisCache = new Map();

const SYSTEM_NUTRITIONIST_PROMPT = `You are a world-class clinical sports dietitian and food scientist with 20+ years of experience and deep knowledge of the USDA FoodData Central database, Israeli/Mediterranean cuisine, and advanced visual portion estimation.

Your task: Analyze the food image with EXTREME precision. Every gram and calorie matters.

ANALYSIS PROTOCOL (follow in order):
1. IDENTIFY every visible food item, ingredient, sauce, oil, and condiment — including hidden ones (e.g., butter used in cooking, oil in pan, dressings).
2. ESTIMATE portion size using visual cues: plate diameter reference (~26cm standard), food height/density, serving vessel size, and food-to-plate ratio.
3. CALCULATE weight per ingredient using standard density tables (e.g., cooked chicken breast ~165g per palm-size piece, cooked rice ~180g per cup, olive oil ~14g per tablespoon).
4. APPLY cooking adjustments: grilled/roasted proteins lose ~25% water weight; fried foods absorb oil (~10-15% added fat); steamed vegetables retain weight.
5. CROSS-REFERENCE with USDA FoodData Central for exact macro values per 100g, then scale to estimated weight.
6. VERIFY: protein_g × 4 + carbs_g × 4 + fats_g × 9 must approximately equal total_calories (±5%). Adjust if not.
7. If multiple items visible (e.g., rice + chicken + salad), calculate each separately then sum.

CRITICAL ACCURACY RULES:
- Never round to suspiciously clean numbers (e.g., exactly 500 kcal). Real food has irregular values.
- Account for cooking oils, sauces, and dressings even if not explicitly visible.
- If food is in a bowl or container, estimate the fill level.
- For Israeli/Middle Eastern dishes (hummus, shakshuka, schnitzel, etc.), use Israeli portion norms.
- Confidence below 70 = image unclear, still give best estimate.

OUTPUT: Strictly valid JSON only. No markdown. All strings in Hebrew.

JSON Schema:
{
  "is_food": boolean,
  "food_name": string (Hebrew dish name, specific e.g. "שניצל עוף מטוגן עם אורז לבן וסלט ירקות"),
  "analysis_confidence": number (0-100),
  "total_calories": number (integer),
  "protein_g": number (integer),
  "carbs_g": number (integer),
  "fats_g": number (integer),
  "weight_grams": number (total edible weight, integer),
  "ingredients": [
    {
      "name": string (Hebrew ingredient name),
      "detection_reasoning": string (brief Hebrew note on how you identified it and estimated weight),
      "weight_grams": number,
      "calories": number
    }
  ],
  "explanation": string (2-3 sentence Hebrew summary of the meal, portion size assessment, and key nutritional notes)
}`;

const TEXT_NUTRITIONIST_PROMPT = `You are a clinical dietitian AI. Given a food name + quantity + unit, return precise USDA nutritional values instantly.

UNIT → WEIGHT LOOKUP (use these as defaults when unit is not grams/ml):
- יחידות (units): egg=55g, banana=120g, apple=150g, orange=130g, chicken breast=165g, schnitzel=130g, bread slice=30g, rice cake=9g, gummy bears (שלגון)=10g each, chocolate square=5g, date=24g, cookie=15g, cracker=10g
- כוסות (cups): cooked rice=180g, oatmeal=240ml, milk=240ml, cottage=200g, salad=80g
- כפות (tablespoons): tahini=15g, peanut butter=16g, olive oil=14g, honey=21g, hummus=30g
- פרוסות (slices): bread=30g, yellow cheese=20g, turkey=15g, toast=25g
- מנות (servings): use standard Israeli restaurant portion ~200-300g

RULES:
- Respond in Hebrew only.
- Return ONLY valid JSON, no markdown.
- Verify: protein_g×4 + carbs_g×4 + fats_g×9 ≈ total_calories (±5%). Fix if wrong.
- MANDATORY: weight_grams MUST equal quantity × unit_weight from the lookup table above. Do NOT deviate.
- For candies/sweets with "יחידות": 1 unit = 1 SINGLE PIECE (e.g. 1 gummy bear = 10g, NOT 1 bag). Use this strictly.

JSON Schema:
{
  "is_food": boolean,
  "food_name": string,
  "analysis_confidence": number (0-100),
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "weight_grams": number,
  "portion_display": string (e.g. "3 יחידות / 30 גרם"),
  "explanation": string (1 sentence Hebrew)
}`;

/**
 * Converts a Data URL or HTTP Image URL into Base64 data & mimeType
 */
async function getBase64FromUrlOrDataUrl(inputUrl) {
  if (!inputUrl) throw new Error('אין תמונה לניתוח');

  if (inputUrl.startsWith('data:')) {
    const parts = inputUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = parts[1];
    return { base64Data, mimeType };
  }

  try {
    const response = await fetch(inputUrl);
    const blob = await response.blob();
    const mimeType = blob.type || 'image/jpeg';

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const parts = reader.result.split(',');
        resolve({ base64Data: parts[1], mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error('Error converting image URL to base64:', err);
    throw new Error('לא ניתן לטעון את תמונת הארוחה לניתוח.');
  }
}

/**
 * Parses Gemini response text cleanly, removing markdown codeblocks
 */
export function cleanAndParseJSON(text) {
  let cleanText = text.trim();

  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  try {
    return JSON.parse(cleanText);
  } catch (err) {
    const match = cleanText.match(/\{[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
    throw new Error('Failed to parse nutritional JSON from AI response.');
  }
}

export async function analyzeMealImage(dataUrl) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const { base64Data, mimeType } = await getBase64FromUrlOrDataUrl(dataUrl);

  // Cache key = first 300 chars of base64 (unique per image content)
  const cacheKey = base64Data.substring(0, 300);
  if (imageAnalysisCache.has(cacheKey)) {
    console.log('Image analysis: cache hit ✓');
    return imageAnalysisCache.get(cacheKey);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  // gemini-3.8-flash: primary. gemini-3.6-flash as fallback.
  const modelNames = ['gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.0,
          topP: 0.05,
          topK: 1,
          responseMimeType: 'application/json'
        }
      });

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      // Include system prompt in content for better compliance with flash models
      const result = await model.generateContent([
        { text: SYSTEM_NUTRITIONIST_PROMPT + '\n\nAnalyze the following food image:' },
        imagePart
      ]);
      const response = await result.response;
      const textOutput = response.text();

      const parsedData = cleanAndParseJSON(textOutput);

      const isFood = parsedData.is_food !== false && parsedData.food_name !== 'לא ניתן לזיהוי';

      if (!isFood) {
        const notFoodResult = {
          is_food: false,
          food_name: 'לא ניתן לזיהוי',
          total_calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fats_g: 0,
          weight_grams: 0,
          explanation: parsedData.explanation || 'התמונה שצולמה אינה מכילה מאכל או משקה מוכר. אנא צלם תמונה ברורה של המנה.',
          isFallback: false
        };
        imageAnalysisCache.set(cacheKey, notFoodResult);
        return notFoodResult;
      }

      const result_data = {
        is_food: true,
        food_name: parsedData.food_name || 'ארוחה מצולמת',
        analysis_confidence: Number(parsedData.analysis_confidence) || 95,
        total_calories: Math.max(0, Math.round(Number(parsedData.total_calories) || 0)),
        protein_g: Math.max(0, Math.round(Number(parsedData.protein_g) || 0)),
        carbs_g: Math.max(0, Math.round(Number(parsedData.carbs_g) || 0)),
        fats_g: Math.max(0, Math.round(Number(parsedData.fats_g) || 0)),
        weight_grams: Math.max(10, Math.round(Number(parsedData.weight_grams) || 200)),
        ingredients: Array.isArray(parsedData.ingredients) ? parsedData.ingredients : [],
        explanation: parsedData.explanation || 'זיהוי ניתוח תזונתי מתקדם של Gemini AI.',
        isFallback: false
      };
      imageAnalysisCache.set(cacheKey, result_data);
      return result_data;
    } catch (err) {
      console.warn(`Model ${modelName} vision attempt failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה בחיבור לשרתי Gemini AI');
}

/**
 * Text-Based Universal AI Meal Analysis supporting flexible portion units
 */
export async function analyzeMealText(foodName, portionAmount = 100, portionUnit = 'גרם') {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  // Standardize parameters if amount/unit are passed flexibly
  let amount = Number(portionAmount) > 0 ? Number(portionAmount) : 1;
  let unit = portionUnit || 'גרם';

  // If user included unit in foodName or unit wasn't specified separately
  if (!portionUnit && typeof portionAmount === 'number' && portionAmount > 10) {
    unit = 'גרם';
  }

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.8-flash', 'gemini-3.6-flash'];

  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: TEXT_NUTRITIONIST_PROMPT,
        generationConfig: {
          temperature: 0.0,
          topP: 0.1,
          topK: 1,
          responseMimeType: 'application/json'
        }
      });
      const prompt = `User text entry: "${foodName}", quantity: ${amount}, unit: "${unit}".
Parse items and compute exact USDA nutritional values for ${amount} ${unit} of "${foodName}".
Return JSON with total_calories, protein_g, carbs_g, fats_g, estimated weight_grams, and portion_display (e.g. "${amount} ${unit}").`;

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const textOutput = response.text();

      const parsedData = cleanAndParseJSON(textOutput);

      const isFood = parsedData.is_food !== false && parsedData.food_name !== 'לא ניתן לזיהוי';

      if (!isFood) {
        return {
          is_food: false,
          food_name: 'לא ניתן לזיהוי',
          total_calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fats_g: 0,
          weight_grams: 0,
          portion_display: `${amount} ${unit}`,
          portion_amount: amount,
          portion_unit: unit,
          explanation: parsedData.explanation || 'הטקסט שהוזן אינו מתאר מאכל או משקה מוכר. נא להזין שם מאכל תקין.',
          isFallback: false
        };
      }

      const weight = Math.max(1, Math.round(Number(parsedData.weight_grams) || (unit === 'גרם' || unit === 'מ"ל' ? amount : 100)));
      const displayPortion = parsedData.portion_display || `${amount} ${unit}`;

      return {
        is_food: true,
        food_name: parsedData.food_name || foodName,
        analysis_confidence: Number(parsedData.analysis_confidence) || 100,
        total_calories: Math.max(0, Math.round(Number(parsedData.total_calories) || 0)),
        protein_g: Math.max(0, Math.round(Number(parsedData.protein_g) || 0)),
        carbs_g: Math.max(0, Math.round(Number(parsedData.carbs_g) || 0)),
        fats_g: Math.max(0, Math.round(Number(parsedData.fats_g) || 0)),
        weight_grams: weight,
        portion_display: displayPortion,
        portion_amount: amount,
        portion_unit: unit,
        ingredients: Array.isArray(parsedData.ingredients) ? parsedData.ingredients : [],
        explanation: parsedData.explanation || `זיהוי: ${parsedData.food_name || foodName} (${displayPortion}).`,
        isFallback: false
      };
    } catch (err) {
      console.warn(`Text model ${modelName} failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה בחיבור לשרתי Gemini AI');
}

/**
 * AI Personalized Meal Plan Generator
 */
const MEAL_PLANNER_PROMPT = `You are a master sports dietitian and executive chef. Create a highly customized, delicious, realistic daily meal plan tailored strictly to the user's nutritional targets and preferences.

OUTPUT RULES:
- Output MUST be strictly valid JSON in HEBREW.
- Ensure the SUM of calories and macros across all meals matches the total daily targets closely (within +/- 3%).

JSON Schema:
{
  "plan_title": string (Hebrew catchy title e.g. "תפריט חיטוב מבוקר 2000 קלוריות"),
  "summary_note": string (1-2 sentences in Hebrew giving professional dietitian advice for this plan),
  "total_plan_calories": number,
  "total_plan_protein": number,
  "total_plan_carbs": number,
  "total_plan_fats": number,
  "meals": [
    {
      "meal_type": string (e.g. "ארוחת בוקר", "ארוחת צהריים", "ארוחת ערב", "ארוחת ביניים / נשנוש"),
      "food_name": string (Hebrew meal title),
      "weight_grams": number,
      "total_calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fats_g": number,
      "explanation": string (Short 1 sentence Hebrew description of ingredients and preparation)
    }
  ]
}`;

export async function generateAiMealPlan({ userProfile, dailyTargets, preferences = {}, mealCount = 3 }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastError = null;

  const goalText = userProfile?.goal === 'cut' ? 'חיטוב ושריפת שומן' : userProfile?.goal === 'bulk' ? 'עלייה במסת שריר' : 'שמירה על משקל';
  const paceText = userProfile?.pace === 'fast' ? 'מהיר/אגרסיבי' : userProfile?.pace === 'slow' ? 'איטי ומבוקר' : 'בינוני/מאוזן';
  const dietaryPref = preferences.diet || 'ללא הגבלה (כשר/רגיל)';
  const notes = preferences.notes || '';

  const prompt = `Create a ${mealCount}-meal daily plan for a user with the following targets:
- Goal: ${goalText} (Pace: ${paceText})
- Target Calories: ${dailyTargets.targetCalories} kcal
- Target Protein: ${dailyTargets.proteinGrams}g
- Target Carbs: ${dailyTargets.carbGrams}g
- Target Fats: ${dailyTargets.fatGrams}g
- Dietary preference: ${dietaryPref}
- Special requests: ${notes}

Ensure exactly ${mealCount} meals. Return valid JSON only in Hebrew according to schema.`;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: MEAL_PLANNER_PROMPT,
        generationConfig: {
          temperature: 0.2,
          topP: 0.8,
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const textOutput = response.text();

      return cleanAndParseJSON(textOutput);
    } catch (err) {
      console.warn(`Meal plan model ${modelName} failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה ביצירת תפריט מ-Gemini AI');
}

/**
 * AI 3-Options Per Meal Type Generator for "התפריט שלי"
 */
const THREE_OPTIONS_MEAL_PLANNER_PROMPT = `You are an elite sports nutritionist. Generate EXACTLY 3 distinct, delicious, realistic meal options for EACH of the 4 meal times of the day (Breakfast, Lunch, Dinner, Snack).
Total 12 options (3 Breakfast, 3 Lunch, 3 Dinner, 3 Snack).

OUTPUT RULES:
- Output MUST be strictly valid JSON in HEBREW.
- Each meal option must specify realistic macros (calories, protein, carbs, fats) appropriate for that meal time.

JSON Schema:
{
  "plan_title": string (Hebrew title e.g. "תפריט AI אישי - 3 אופציות לכל ארוחה"),
  "summary_note": string (Hebrew guidance note),
  "breakfast_options": [
    {
      "id": string (e.g. "b1"),
      "category": "breakfast",
      "option_title": string (e.g. "אופציה 1: חלבונית ומהירה"),
      "food_name": string (Hebrew dish name),
      "weight_grams": number,
      "total_calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fats_g": number,
      "explanation": string
    }
  ],
  "lunch_options": [... 3 items with category "lunch"],
  "dinner_options": [... 3 items with category "dinner"],
  "snack_options": [... 3 items with category "snack"]
}`;

export async function generateAi3OptionsMealPlan({ userProfile, dailyTargets, preferences = {} }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastError = null;

  const goalText = userProfile?.goal === 'cut' ? 'חיטוב وشריפת שומן' : userProfile?.goal === 'bulk' ? 'עלייה במסת שריר' : 'שמירה על משקל';
  const dietaryPref = preferences.diet || 'ללא הגבלה (כשר/רגיל)';
  const notes = preferences.notes || '';

  const prompt = `Create a 3-options-per-meal-type daily plan for a user with the following targets:
- Goal: ${goalText}
- Target Daily Calories: ${dailyTargets.targetCalories} kcal (Breakfast ~30%, Lunch ~35%, Dinner ~25%, Snack ~10%)
- Target Daily Protein: ${dailyTargets.proteinGrams}g
- Target Daily Carbs: ${dailyTargets.carbGrams}g
- Target Daily Fats: ${dailyTargets.fatGrams}g
- Dietary preference: ${dietaryPref}
- Special requests: ${notes}

Ensure EXACTLY 3 distinct options for breakfast_options, 3 for lunch_options, 3 for dinner_options, 3 for snack_options (total 12 options). Return valid JSON in Hebrew according to schema.`;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: THREE_OPTIONS_MEAL_PLANNER_PROMPT,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const textOutput = response.text();

      return cleanAndParseJSON(textOutput);
    } catch (err) {
      console.warn(`3-Options Meal plan model ${modelName} failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה ביצירת תפריט 3 אופציות מ-Gemini AI');
}

/**
 * AI Fridge & Pantry Recipe Generator ("מה לבשל ממה שיש בבית")
 */
const FRIDGE_RECIPE_PROMPT = `You are a creative chef and dietitian. Create a single delicious, quick, high-protein recipe using strictly or primarily the ingredients the user lists, designed to fit their remaining daily calories and protein.

OUTPUT RULES:
- Output MUST be strictly valid JSON in HEBREW.
- Make the recipe simple, realistic, and tasty.

JSON Schema:
{
  "recipe_name": string (Hebrew title),
  "prep_time_minutes": number,
  "difficulty": string (e.g. "קל מאוד" or "מהיר"),
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "weight_grams": number,
  "ingredients_list": [string],
  "instructions": [string],
  "dietitian_tip": string
}`;

export async function generateFridgeRecipe({ ingredients, remainingCalories = 500, remainingProtein = 35 }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastError = null;

  const prompt = `User has these ingredients at home: "${ingredients}".
Target for this meal: ~${remainingCalories} kcal, ~${remainingProtein}g protein.
Create 1 creative, fast, healthy recipe. Return valid JSON only in Hebrew according to schema.`;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: FRIDGE_RECIPE_PROMPT,
        generationConfig: {
          temperature: 0.3,
          topP: 0.8,
          responseMimeType: 'application/json'
        }
      });

      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const textOutput = response.text();

      return cleanAndParseJSON(textOutput);
    } catch (err) {
      console.warn(`Fridge recipe model ${modelName} failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה ביצירת מתכון ב-Gemini AI');
}

/**
 * AI Body Composition & DEXA Photo Analyzer
 */
const BODY_COMPOSITION_PROMPT = `You are a clinical DEXA body composition specialist and expert physique coach.
Analyze the user's body photo and metrics to estimate body fat %, muscle mass, and projected target physique.

OUTPUT RULES:
- Output MUST be strictly valid JSON in HEBREW.
- Provide realistic, supportive, professional fitness evaluation.

JSON Schema:
{
  "is_human_body": boolean,
  "estimated_body_fat_pct": number (e.g. 15.5),
  "body_fat_category": string (Hebrew e.g. "חטוב מאוד (קוביות בולטות)", "אתלטי", "כושר טוב", "עודף משקל קל"),
  "visual_assessment": string (2-3 sentences in Hebrew analyzing abdominal definition, muscle tone, and body frame),
  "target_physique_projection": string (2-3 sentences in Hebrew describing visual transformation when reaching target weight),
  "estimated_lean_mass_kg": number,
  "estimated_fat_mass_kg": number,
  "recommendations": [string] (3 short actionable Hebrew tips for training & diet to reach target)
}`;

export async function analyzeBodyCompositionImage(dataUrl, userProfile = {}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const { base64Data, mimeType } = await getBase64FromUrlOrDataUrl(dataUrl);

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.8-flash', 'gemini-3.6-flash'];
  let lastError = null;

  const currentWeight = Number(userProfile.currentWeightKg) || 70;
  const targetWeight = Number(userProfile.targetWeightKg) || 65;
  const height = Number(userProfile.heightCm) || 175;
  const gender = userProfile.gender || 'male';

  const prompt = `Analyze this body composition photo.
User metrics: Gender: ${gender}, Current Weight: ${currentWeight}kg, Target Weight: ${targetWeight}kg, Height: ${height}cm.
Estimate body fat %, body fat category, visual assessment, and projected visual transformation at target weight ${targetWeight}kg.
Return strictly valid JSON in Hebrew according to schema.`;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: BODY_COMPOSITION_PROMPT,
        generationConfig: {
          temperature: 0.2,
          topP: 0.2,
          responseMimeType: 'application/json'
        }
      });

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const textOutput = response.text();

      return cleanAndParseJSON(textOutput);
    } catch (err) {
      console.warn(`Body composition model ${modelName} attempt failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה בניתוח תמונת הרכב הגוף ב-Gemini AI');
}








