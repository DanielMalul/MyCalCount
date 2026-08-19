import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_NUTRITIONIST_PROMPT = `You are an elite, board-certified clinical dietitian and advanced computer vision expert specializing in universal food & beverage recognition, USDA nutritional database calculations, and geometric volumetric estimation.

Analyze the image provided with maximum scientific precision. Follow this protocol:

STEP 1: NON-FOOD VS FOOD VERIFICATION
- FIRST, carefully inspect if the image contains any edible food, dish, meal, ingredient, snack, fruit, vegetable, beverage, coffee, tea, shake, or packaged food item.
- IF THE IMAGE DOES NOT CONTAIN ANY FOOD OR DRINK (e.g. shoes, furniture, electronics, cars, animals, documents, people, random household objects, walls):
  You MUST set "is_food": false, "food_name": "לא ניתן לזיהוי", "total_calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0, "weight_grams": 0, and "explanation": "התמונה שצולמה אינה מכילה מאכל או משקה מוכר. אנא צלם תמונה ברורה של המנה."

STEP 2: UNIVERSAL ITEM IDENTIFICATION (IF FOOD IS PRESENT)
- If food/drink IS present, identify ANY food item, dish, cuisine, beverage, or snack in the world without any restrictions.
- Do NOT be limited to fixed examples. Recognize any meal (home cooking, restaurants, fast food, international cuisine, desserts, beverages, fruit, snacks).
- Formulate a clear, accurate Hebrew title describing the exact food item (e.g., "נס קפה עם חלב", "200 ג' חזה עוף בגריל עם אורז לבן", "סלט ירקות קצוץ עם שמן זית", "המבורגר בלחמניה עם צ'יפס", "קערת אסאי עם פירות").

STEP 3: VOLUMETRIC & PORTION ESTIMATION
- Estimate total mass/volume in grams or ml (weight_grams) using visual scale cues (plate diameter ~25cm, bowl depth, mug volume ~200-250ml, piece count, slice thickness).

STEP 4: CLINICAL MACRONUTRIENT BREAKDOWN
- Apply exact nutrient densities from official USDA database per 100g.
- Calculate: Total Calories = Math.round((protein_g * 4) + (carbs_g * 4) + (fats_g * 9)).

STEP 5: DETAILED HEBREW EXPLANATION
- Write a clear 2-3 sentence Hebrew report detailing what was identified, portion estimate, and nutrient summary.

You MUST return your response STRICTLY as a JSON object with this exact JSON schema:
{
  "is_food": boolean,
  "food_name": string (in HEBREW),
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "weight_grams": number,
  "explanation": string (in HEBREW)
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

/**
 * High-Precision Gemini Vision AI Meal Image Analysis Function
 */
export async function analyzeMealImage(dataUrl, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  const isKeyValid = apiKey && apiKey.trim() !== '' && !apiKey.startsWith('AQ.');

  if (!isKeyValid) {
    throw new Error('מפתח Gemini API חסר או לא תקין. נא להתחבר או להזין מפתח תקין בהגדרות ה-AI.');
  }

  const { base64Data, mimeType } = await getBase64FromUrlOrDataUrl(dataUrl);

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        }
      };

      const result = await model.generateContent([SYSTEM_NUTRITIONIST_PROMPT, imagePart]);
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
        total_calories: Math.max(0, Math.round(Number(parsedData.total_calories) || 0)),
        protein_g: Math.max(0, Math.round(Number(parsedData.protein_g) || 0)),
        carbs_g: Math.max(0, Math.round(Number(parsedData.carbs_g) || 0)),
        fats_g: Math.max(0, Math.round(Number(parsedData.fats_g) || 0)),
        weight_grams: Math.max(10, Math.round(Number(parsedData.weight_grams) || 200)),
        explanation: parsedData.explanation || 'זיהוי ניתוח תזונתי מדויק של Gemini AI.',
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
export async function analyzeMealText(foodName, weightGrams = 100, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const requestedWeight = Number(weightGrams) > 0 ? Number(weightGrams) : 100;

  const isKeyValid = apiKey && apiKey.trim() !== '' && !apiKey.startsWith('AQ.');

  if (!isKeyValid) {
    throw new Error('מפתח Gemini API חסר או לא תקין. נא להגדיר מפתח תקין בהגדרות AI.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash'];
  const prompt = `You are a clinical dietitian. Analyze "${foodName}" for EXACTLY ${requestedWeight} grams. Identify the exact food, ingredient or drink item and name it in HEBREW. Apply USDA nutrient densities per 100g. Return strictly JSON: { "food_name": string (HEBREW), "total_calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "weight_grams": number, "explanation": string (HEBREW) }. Notice: weight_grams MUST be equal to ${requestedWeight}.`;

  let lastError = null;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });
      const result = await model.generateContent([prompt]);
      const response = await result.response;
      const textOutput = response.text();

      const parsedData = cleanAndParseJSON(textOutput);

      return {
        food_name: parsedData.food_name || foodName,
        total_calories: Math.max(0, Math.round(Number(parsedData.total_calories) || 0)),
        protein_g: Math.max(0, Math.round(Number(parsedData.protein_g) || 0)),
        carbs_g: Math.max(0, Math.round(Number(parsedData.carbs_g) || 0)),
        fats_g: Math.max(0, Math.round(Number(parsedData.fats_g) || 0)),
        weight_grams: requestedWeight,
        explanation: parsedData.explanation || `זיהוי: ${parsedData.food_name || foodName} (חישוב מדויק ל-${requestedWeight} גרם).`,
        isFallback: false
      };
    } catch (err) {
      console.warn(`Text model ${modelName} failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה בחיבור לשרתי Gemini AI');
}



