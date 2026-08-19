import { GoogleGenerativeAI } from '@google/generative-ai';

const SYSTEM_NUTRITIONIST_PROMPT = `You are a state-of-the-art computer vision model and an elite clinical dietitian. Your task is to perform a forensic-level, phenomenally accurate nutritional and volumetric analysis of the provided image.

Execute this exact Chain-of-Thought protocol internally before outputting the final data:

1. VALIDATION: Determine with 100% certainty if the image contains edible food or beverages. If NO, immediately set "is_food": false, "food_name": "לא ניתן לזיהוי", zero values for all nutrients, and an explanation in Hebrew explaining that no food/drink was detected.
2. FORENSIC DECONSTRUCTION: Identify every single macroscopic and microscopic ingredient (e.g., distinguishing between olive oil gloss and water moisture, identifying exact meat cuts, recognizing specific cheese types based on texture).
3. SPATIAL & VOLUMETRIC CALIBRATION: Establish a 3D bounding box for each item. Use standard reference markers in the frame (plate diameter ~25cm, fork tines, shadow length, depth of field, cup rims ~200-250ml) to calculate exact volume in cubic centimeters (cm³).
4. DENSITY & MASS RESOLUTION: Map the calculated volume to precise physical density constants (g/cm³) to derive the absolute weight in grams with a margin of error < 5%.
5. MACRONUTRIENT SYNTHESIS: Cross-reference the identified ingredients and calculated mass against the USDA National Nutrient Database. Compute exact Calories (kcal), Protein (g), Carbohydrates (g), and Fat (g).

CRITICAL OUTPUT CONSTRAINTS:
- Output MUST be strictly valid JSON.
- NO conversational filler, NO markdown formatting outside the JSON, NO reasoning text outside the JSON object.
- All string descriptions inside the JSON MUST be in HEBREW.

Return your response strictly adhering to this JSON schema:
{
  "is_food": boolean,
  "food_name": string (Hebrew title of the dish),
  "analysis_confidence": number (0.0 to 100.0),
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "weight_grams": number,
  "ingredients": [
    {
      "name": string (Hebrew name of ingredient),
      "detection_reasoning": string (Brief Hebrew explanation of visual volume/density estimation),
      "weight_grams": number,
      "calories": number
    }
  ],
  "explanation": string (Comprehensive Hebrew summary of analysis, visual cues, and breakdown)
}`;

const TEXT_NUTRITIONIST_PROMPT = `You are an elite clinical dietitian and advanced nutritional data parser. Your objective is to process a user's manual text entry of food items and quantities, and calculate the exact macronutrient breakdown based on the official USDA National Nutrient Database.

Execute this protocol:
1. TEXT PARSING: Extract every listed food item and its associated quantity, weight, or volume from the user's input.
2. WEIGHT STANDARDIZATION: If quantities are provided in volumes (e.g., cups, tablespoons) or abstract units (e.g., "one medium apple", "a slice of bread"), convert them mathematically to exact weight in grams (g) using standard USDA density/weight conversions. If grams are provided, use them directly.
3. MACRONUTRIENT SYNTHESIS: Cross-reference the exact mass in grams against the USDA database. Compute exact Calories (kcal), Protein (g), Carbohydrates (g), and Fat (g) for each ingredient.
4. NON-FOOD HANDLING: If the text does not describe edible food or drink, set "is_food": false and output zero values with an explanation in Hebrew.

CRITICAL OUTPUT CONSTRAINTS:
- Output MUST be strictly valid JSON.
- NO conversational filler, NO markdown formatting outside the JSON, NO reasoning text outside the JSON object.
- All string descriptions inside the JSON MUST be in HEBREW.

Return your response strictly adhering to this JSON schema:
{
  "is_food": boolean,
  "food_name": string (Hebrew title summarizing the meal),
  "analysis_confidence": number (0.0 to 100.0),
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "weight_grams": number,
  "ingredients": [
    {
      "name": string (Hebrew name of ingredient),
      "detection_reasoning": string (Brief Hebrew explanation of weight calculation/extraction),
      "weight_grams": number,
      "calories": number
    }
  ],
  "explanation": string (Comprehensive Hebrew summary of parsed entry and final breakdown)
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
  const modelNames = ['gemini-2.0-flash'];
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
  const modelNames = ['gemini-2.0-flash'];

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






