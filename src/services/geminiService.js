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
 * Universal Dynamic Nutritional Estimator for ANY food category in Hebrew
 */
export function calculateEstimatedMacrosForText(foodDesc = '', requestedGrams = 200) {
  const targetGrams = Number(requestedGrams) > 0 ? Number(requestedGrams) : 200;
  const name = foodDesc.trim() || 'ארוחה מצולמת';
  const nameLower = name.toLowerCase();

  let p100 = 8;
  let c100 = 15;
  let f100 = 5;

  if (nameLower.includes('נס') || nameLower.includes('קפה') || nameLower.includes('coffee') || nameLower.includes('nescafe') || nameLower.includes('תה') || nameLower.includes('tea') || nameLower.includes('אספרסו') || nameLower.includes('אייסקפה') || nameLower.includes('לאטה')) {
    if (nameLower.includes('שחור') || nameLower.includes('אספרסו') || nameLower.includes('ללא חלב')) {
      p100 = 0.2;
      c100 = 0.4;
      f100 = 0;
    } else {
      // Coffee with milk (~22 kcal per 100g/ml)
      p100 = 1.0;
      c100 = 2.5;
      f100 = 0.8;
    }
  } else if (nameLower.includes('ביצה') || nameLower.includes('חביתה') || nameLower.includes('מקושקשת') || nameLower.includes('אומלט') || nameLower.includes('egg')) {
    p100 = 13;
    c100 = 1;
    f100 = 10;
  } else if (nameLower.includes('אבטיח') || nameLower.includes('מלון') || nameLower.includes('תפוח') || nameLower.includes('פרי') || nameLower.includes('תות') || nameLower.includes('ענבים') || nameLower.includes('בננה')) {
    p100 = 0.6;
    c100 = 12;
    f100 = 0.2;
  } else if (nameLower.includes('עוף') || nameLower.includes('בשר') || nameLower.includes('הודו') || nameLower.includes('שניצל') || nameLower.includes('המבורגר') || nameLower.includes('סטייק') || nameLower.includes('פרגית') || nameLower.includes('קציצות') || nameLower.includes('שווארמה')) {
    p100 = 25;
    c100 = 2;
    f100 = 8;
  } else if (nameLower.includes('דג') || nameLower.includes('סלמון') || nameLower.includes('טונה') || nameLower.includes('סושי')) {
    p100 = 20;
    c100 = 8;
    f100 = 7;
  } else if (nameLower.includes('אורז') || nameLower.includes('פסטה') || nameLower.includes('פתיתים') || nameLower.includes('קוסקוס') || nameLower.includes('לחם') || nameLower.includes('פיתה') || nameLower.includes('שיבולת שועל') || nameLower.includes('תפוחי אדמה') || nameLower.includes('בטטה')) {
    p100 = 4;
    c100 = 28;
    f100 = 1.5;
  } else if (nameLower.includes('פיצה') || nameLower.includes('בורקס') || nameLower.includes('מלוואח') || nameLower.includes("ג'חנון") || nameLower.includes('פלאפל')) {
    p100 = 10;
    c100 = 32;
    f100 = 14;
  } else if (nameLower.includes('סלט') || nameLower.includes('ירקות') || nameLower.includes('מלפפון') || nameLower.includes('עגבניה') || nameLower.includes('ברוקולי')) {
    p100 = 1.5;
    c100 = 4;
    f100 = 3;
  } else if (nameLower.includes('גבינה') || nameLower.includes("קוטג'") || nameLower.includes('יוגורט') || nameLower.includes('חלב')) {
    p100 = 10;
    c100 = 4;
    f100 = 4;
  } else if (nameLower.includes('אגוזים') || nameLower.includes('שוקולד') || nameLower.includes('עוגה') || nameLower.includes('עוגיה') || nameLower.includes('גלידה')) {
    p100 = 6;
    c100 = 45;
    f100 = 20;
  }

  const ratio = targetGrams / 100;
  const protein_g = Math.round(p100 * ratio);
  const carbs_g = Math.round(c100 * ratio);
  const fats_g = Math.round(f100 * ratio);
  const total_calories = Math.round(protein_g * 4 + carbs_g * 4 + fats_g * 9);

  return {
    is_food: true,
    food_name: name,
    weight_grams: targetGrams,
    total_calories,
    protein_g,
    carbs_g,
    fats_g,
    explanation: `זיהוי משוער: ${name} (חישוב לפי קטגוריית מזון ומשקל ${targetGrams} גרם).`,
    isFallback: true
  };
}

/**
 * High-Precision Gemini Vision AI Meal Image Analysis Function
 */
export async function analyzeMealImage(dataUrl, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  // Check if API key is invalid/placeholder
  const isKeyValid = apiKey && apiKey.trim() !== '' && !apiKey.startsWith('AQ.');

  if (!isKeyValid) {
    await new Promise((res) => setTimeout(res, 800));
    const fallback = calculateEstimatedMacrosForText('ארוחה מצולמת', 200);
    fallback.isFallback = true;
    fallback.fallbackReason = 'מפתח Gemini API חסר או לא תקין. נא להגדיר מפתח תקין בהגדרות AI.';
    return fallback;
  }

  try {
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
          explanation: parsedData.explanation || 'זיהוי ראייה ממוחשבת מתקדם של Gemini AI.',
          isFallback: false
        };
      } catch (err) {
        console.warn(`Model ${modelName} precision attempt failed, trying next...`, err);
        lastError = err;
      }
    }

    throw lastError || new Error('שגיאה בחיבור לשרתי Gemini AI');
  } catch (error) {
    console.error('Gemini Vision AI Analysis Error:', error);
    const fallback = calculateEstimatedMacrosForText('ארוחה מצולמת', 200);
    fallback.isFallback = true;
    fallback.fallbackReason = `שגיאת תקשורת עם ה-AI: ${error.message || 'לא ניתן לנתח תמונה זו'}. התקבל ניתוח משוער.`;
    return fallback;
  }
}


/**
 * Text-Based Universal AI Meal Analysis
 */
export async function analyzeMealText(foodName, weightGrams = 100, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const requestedWeight = Number(weightGrams) > 0 ? Number(weightGrams) : 100;

  const isKeyValid = apiKey && apiKey.trim() !== '' && !apiKey.startsWith('AQ.');

  if (!isKeyValid) {
    await new Promise((res) => setTimeout(res, 500));
    return calculateEstimatedMacrosForText(foodName, requestedWeight);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = ['gemini-2.0-flash', 'gemini-1.5-flash'];
    const prompt = `You are a clinical dietitian. Analyze "${foodName}" for EXACTLY ${requestedWeight} grams. Identify the exact food or drink item and name it in HEBREW. Apply USDA nutrient densities per 100g. Return strictly JSON: { "food_name": string (HEBREW), "total_calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "weight_grams": number, "explanation": string (HEBREW) }. Notice: weight_grams MUST be equal to ${requestedWeight}.`;

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

    throw lastError || new Error('Failed to analyze text with Gemini AI');
  } catch (error) {
    console.error('Gemini Text AI Analysis Error:', error);
    return calculateEstimatedMacrosForText(foodName, requestedWeight);
  }
}


