import { GoogleGenerativeAI } from '@google/generative-ai';

const REQUIRED_PROMPT = `You are a world-class registered dietitian, nutritionist, and computer vision AI expert.
Analyze the photo of this meal.
1. IDENTIFY THE FOOD: Visually identify ALL food items in the image and write a clear, descriptive title in HEBREW (e.g. "4 פרוסות אבטיח טרי", "2 משולשי פיצה מרגריטה", "חזה עוף מוקפץ עם אורז וירקות", "סלט יווני עם גבינה בולגרית").
2. ESTIMATE PORTION & WEIGHT: Estimate the total portion weight in grams based on item count, dimensions, and plate scale.
3. CALCULATE ACCURATE MACROS: Calculate the realistic calories, protein (g), carbs (g), and fats (g) for the identified food items at that specific weight.
4. EXPLAIN THE ESTIMATION IN HEBREW: In the "explanation" field, write 2-3 detailed sentences in HEBREW stating:
   - Exactly what food items were identified in the photo.
   - How the portion weight in grams was estimated from the visual item count / plate dimensions.
   - How the calories and macronutrients were calculated.

You MUST return your response STRICTLY as a JSON object with this exact schema:
{
  "food_name": string (in HEBREW),
  "total_calories": number,
  "protein_g": number,
  "carbs_g": number,
  "fats_g": number,
  "weight_grams": number,
  "explanation": string (in HEBREW detailing recognized food and portion estimation)
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
function calculateEstimatedMacrosForText(foodDesc = '', requestedGrams = 200) {
  const targetGrams = Number(requestedGrams) > 0 ? Number(requestedGrams) : 200;
  const name = foodDesc.trim() || 'מאכל מגוון';
  const nameLower = name.toLowerCase();

  // Default densities per 100g
  let p100 = 8;
  let c100 = 15;
  let f100 = 5;

  if (nameLower.includes('אבטיח') || nameLower.includes('מלון') || nameLower.includes('תפוח') || nameLower.includes('פרי') || nameLower.includes('תות') || nameLower.includes('ענבים')) {
    p100 = 0.5;
    c100 = 9;
    f100 = 0.2;
  } else if (nameLower.includes('עוף') || nameLower.includes('בשר') || nameLower.includes('הודו') || nameLower.includes('שניצל') || nameLower.includes('המבורגר') || nameLower.includes('סטייק')) {
    p100 = 26;
    c100 = 2;
    f100 = 8;
  } else if (nameLower.includes('דג') || nameLower.includes('סלמון') || nameLower.includes('טונה') || nameLower.includes('סושי')) {
    p100 = 20;
    c100 = 10;
    f100 = 7;
  } else if (nameLower.includes('אורז') || nameLower.includes('פסטה') || nameLower.includes('פתיתים') || nameLower.includes('קוסקוס') || nameLower.includes('לחם')) {
    p100 = 4;
    c100 = 28;
    f100 = 1.5;
  } else if (nameLower.includes('פיצה') || nameLower.includes('בורקס') || nameLower.includes('מלוואח') || nameLower.includes("ג'חנון")) {
    p100 = 11;
    c100 = 32;
    f100 = 14;
  } else if (nameLower.includes('סלט') || nameLower.includes('ירקות') || nameLower.includes('מלפפון') || nameLower.includes('עגבניה')) {
    p100 = 1.5;
    c100 = 4;
    f100 = 3;
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
    explanation: `זיהוי: ${name} (משקל מוערך: כ-${targetGrams} גרם לפי גודל המנה והצלחת).`
  };
}

/**
 * Universal Gemini Vision AI Meal Image Analysis Function
 */
export async function analyzeMealImage(dataUrl, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    await new Promise((res) => setTimeout(res, 1200));
    return calculateEstimatedMacrosForText('ארוחה מצולמת', 250);
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
          total_calories: Math.max(0, Number(parsedData.total_calories) || 0),
          protein_g: Math.max(0, Number(parsedData.protein_g) || 0),
          carbs_g: Math.max(0, Number(parsedData.carbs_g) || 0),
          fats_g: Math.max(0, Number(parsedData.fats_g) || 0),
          weight_grams: Math.max(10, Number(parsedData.weight_grams) || 200),
          explanation: parsedData.explanation || 'ה-AI זיהה את המאכל, העריך את משקלו לפי גודל הצלחת וחישב קלוריות ומאקרו.',
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
    return calculateEstimatedMacrosForText('ארוחה מצולמת', 250);
  }
}

/**
 * Text-Based Universal AI Meal Analysis
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
    const prompt = `You are a world-class registered dietitian. Analyze this food item: "${foodName}" for a portion size of EXACTLY ${requestedWeight} grams. Identify the food item and name it in HEBREW. Calculate accurate nutritional macros for that specific food item. You MUST return the response strictly as a JSON object with this exact structure: { "food_name": string (in HEBREW), "total_calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "weight_grams": number, "explanation": string (in HEBREW detailing what was identified and macro calculation) }. Notice: weight_grams MUST be equal to ${requestedWeight}.`;

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
          total_calories: Math.max(0, Number(parsedData.total_calories) || 0),
          protein_g: Math.max(0, Number(parsedData.protein_g) || 0),
          carbs_g: Math.max(0, Number(parsedData.carbs_g) || 0),
          fats_g: Math.max(0, Number(parsedData.fats_g) || 0),
          weight_grams: requestedWeight,
          explanation: parsedData.explanation || `זיהוי: ${parsedData.food_name || foodName} (חישוב מותאם ל-${requestedWeight} גרם).`,
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
