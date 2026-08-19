import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_NUTRITIONIST_PROMPT = `You are an elite clinical dietitian AI. Analyze the image to calculate precise USDA nutritional values.

OUTPUT RULES:
- Output MUST be strictly valid JSON in HEBREW.
- Keep the "explanation" concise (1-2 sentences in Hebrew).

JSON Schema:
{
  "is_food": boolean,
  "food_name": string (Hebrew dish name),
  "analysis_confidence": number (0-100),
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "weight_grams": number,
  "ingredients": [
    {
      "name": string (Hebrew ingredient name),
      "detection_reasoning": string (Short Hebrew note),
      "weight_grams": number,
      "calories": number
    }
  ],
  "explanation": string (Short 1-2 sentence Hebrew summary)
}`;

const TEXT_NUTRITIONIST_PROMPT = `You are an elite clinical dietitian AI. Parse the food items and quantities provided in the text and compute exact USDA nutritional values.

OUTPUT RULES:
- Output MUST be strictly valid JSON in HEBREW.
- Keep the "explanation" concise (1-2 sentences in Hebrew).

JSON Schema:
{
  "is_food": boolean,
  "food_name": string (Hebrew meal title),
  "analysis_confidence": number (0-100),
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "weight_grams": number,
  "ingredients": [
    {
      "name": string (Hebrew ingredient name),
      "detection_reasoning": string (Short Hebrew note),
      "weight_grams": number,
      "calories": number
    }
  ],
  "explanation": string (Short 1-2 sentence Hebrew summary)
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
function cleanAndParseJSON(text) {
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

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash'];
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_NUTRITIONIST_PROMPT,
        generationConfig: {
          temperature: 0.0,
          topP: 0.1,
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

      const result = await model.generateContent([imagePart]);
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
          explanation: parsedData.explanation || 'התמונה שצולמה אינה מכילה מאכל או משקה מוכר. אנא צלם תמונה ברורה של המנה.',
          isFallback: false
        };
      }

      return {
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
    } catch (err) {
      console.warn(`Model ${modelName} precision attempt failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה בחיבור לשרתי Gemini AI');
}

/**
 * Text-Based Universal AI Meal Analysis
 */
export async function analyzeMealText(foodName, weightGrams = 100) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const requestedWeight = Number(weightGrams) > 0 ? Number(weightGrams) : 100;

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash'];

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
      const prompt = `User text entry: "${foodName}" for ${requestedWeight} grams/ml. Parse items and compute exact USDA nutrients for ${requestedWeight} grams/ml. Ensure total weight_grams equals ${requestedWeight}.`;
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
          explanation: parsedData.explanation || 'הטקסט שהוזן אינו מתאר מאכל או משקה מוכר. נא להזין שם מאכל תקין.',
          isFallback: false
        };
      }

      return {
        is_food: true,
        food_name: parsedData.food_name || foodName,
        analysis_confidence: Number(parsedData.analysis_confidence) || 100,
        total_calories: Math.max(0, Math.round(Number(parsedData.total_calories) || 0)),
        protein_g: Math.max(0, Math.round(Number(parsedData.protein_g) || 0)),
        carbs_g: Math.max(0, Math.round(Number(parsedData.carbs_g) || 0)),
        fats_g: Math.max(0, Math.round(Number(parsedData.fats_g) || 0)),
        weight_grams: requestedWeight,
        ingredients: Array.isArray(parsedData.ingredients) ? parsedData.ingredients : [],
        explanation: parsedData.explanation || `זיהוי: ${parsedData.food_name || foodName} (${requestedWeight} גרם).`,
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
  const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash'];
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
  const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash'];
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







