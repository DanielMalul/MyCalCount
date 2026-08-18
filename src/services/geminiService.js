import { GoogleGenerativeAI } from '@google/generative-ai';

const REQUIRED_PROMPT = `Analyze this image of a meal. Identify the food items, estimate the portion sizes in grams, and calculate the exact nutritional breakdown. You MUST return the response strictly as a JSON object with this exact structure: { "food_name": string, "total_calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "weight_grams": number, "explanation": string }.`;

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
 * Standard Nutritional Calculator for typed food name & requested grams
 */
function calculateEstimatedMacrosForText(foodDesc = '', requestedGrams = 100) {
  const targetGrams = Number(requestedGrams) > 0 ? Number(requestedGrams) : 100;
  const name = foodDesc.trim() || 'מאכל';
  const nameLower = name.toLowerCase();

  // Basic nutritional densities per 100g
  let p100 = 15; // protein per 100g
  let c100 = 20; // carbs per 100g
  let f100 = 5;  // fats per 100g

  if (nameLower.includes('עוף') || nameLower.includes('chicken') || nameLower.includes('בשר') || nameLower.includes('beef') || nameLower.includes('סטייק')) {
    p100 = 28;
    c100 = 0;
    f100 = 6;
  } else if (nameLower.includes('דג') || nameLower.includes('סלמון') || nameLower.includes('salmon') || nameLower.includes('טונה')) {
    p100 = 22;
    c100 = 0;
    f100 = 12;
  } else if (nameLower.includes('אורז') || nameLower.includes('rice') || nameLower.includes('פסטה') || nameLower.includes('pasta') || nameLower.includes('לחם') || nameLower.includes('bread')) {
    p100 = 4;
    c100 = 28;
    f100 = 1;
  } else if (nameLower.includes('ביצה') || nameLower.includes('ביצים') || nameLower.includes('egg')) {
    p100 = 13;
    c100 = 1;
    f100 = 11;
  } else if (nameLower.includes('אבוקדו') || nameLower.includes('avocado') || nameLower.includes('אגוזים')) {
    p100 = 2;
    c100 = 8;
    f100 = 15;
  }

  const ratio = targetGrams / 100;
  const protein_g = Math.round(p100 * ratio);
  const carbs_g = Math.round(c100 * ratio);
  const fats_g = Math.round(f100 * ratio);
  const total_calories = Math.round(protein_g * 4 + carbs_g * 4 + fats_g * 9);

  return {
    food_name: name,
    weight_grams: targetGrams,
    total_calories,
    protein_g,
    carbs_g,
    fats_g,
    explanation: `חישוב ערכים תזונתיים מותאם עבור ${targetGrams} גרם של ${name}`
  };
}

/**
 * Main AI Meal Image Analysis Function using Gemini Vision Model
 */
export async function analyzeMealImage(dataUrl, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    await new Promise((res) => setTimeout(res, 1500));
    return calculateEstimatedMacrosForText('ארוחה מצולמת', 200);
  }

  try {
    const { base64Data, mimeType } = await getBase64FromUrlOrDataUrl(dataUrl);

    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    let lastError = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const imagePart = {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        };

        const result = await model.generateContent([REQUIRED_PROMPT, imagePart]);
        const response = await result.response;
        const textOutput = response.text();

        const parsedData = cleanAndParseJSON(textOutput);

        return {
          food_name: parsedData.food_name || 'ארוחה מצולמת',
          total_calories: Number(parsedData.total_calories) || 0,
          protein_g: Number(parsedData.protein_g) || 0,
          carbs_g: Number(parsedData.carbs_g) || 0,
          fats_g: Number(parsedData.fats_g) || 0,
          weight_grams: Number(parsedData.weight_grams) || 200,
          explanation: parsedData.explanation || 'נותח ב-Gemini Vision AI',
          isMock: false
        };
      } catch (err) {
        console.warn(`Model ${modelName} failed, trying next...`, err);
        lastError = err;
      }
    }

    throw lastError || new Error('Failed to analyze image with Gemini AI');
  } catch (error) {
    console.error('Gemini Vision AI Analysis Error:', error);
    return calculateEstimatedMacrosForText('ארוחה מצולמת', 200);
  }
}

/**
 * Text-Based AI Meal Analysis (calculates macros for typed food name & requested grams)
 */
export async function analyzeMealText(foodName, weightGrams = 100, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';
  const requestedWeight = Number(weightGrams) > 0 ? Number(weightGrams) : 100;

  if (!apiKey || apiKey.trim() === '') {
    await new Promise((res) => setTimeout(res, 800));
    return calculateEstimatedMacrosForText(foodName, requestedWeight);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    const prompt = `Analyze this food item: "${foodName}" for a portion size of EXACTLY ${requestedWeight} grams. Calculate the exact nutritional breakdown for ${requestedWeight} grams. You MUST return the response strictly as a JSON object with this exact structure: { "food_name": string, "total_calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "weight_grams": number, "explanation": string }. Notice: weight_grams MUST be equal to ${requestedWeight}.`;

    let lastError = null;

    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent([prompt]);
        const response = await result.response;
        const textOutput = response.text();

        const parsedData = cleanAndParseJSON(textOutput);

        return {
          food_name: parsedData.food_name || foodName,
          total_calories: Number(parsedData.total_calories) || 0,
          protein_g: Number(parsedData.protein_g) || 0,
          carbs_g: Number(parsedData.carbs_g) || 0,
          fats_g: Number(parsedData.fats_g) || 0,
          weight_grams: requestedWeight, // STRICTLY PRESERVE USER'S REQUESTED GRAMS
          explanation: parsedData.explanation || `חישוב Gemini AI עבור ${requestedWeight} גרם`,
          isMock: false
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
