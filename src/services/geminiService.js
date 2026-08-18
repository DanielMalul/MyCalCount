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

  // Fetch remote image URL (e.g. Unsplash sample photos) and convert blob to base64
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
 * Realistic Mock Analyzer fallback when no Gemini API Key is configured or API fails
 */
function generateMockMealAnalysis(foodDesc = '') {
  const mockDatabase = [
    {
      food_name: foodDesc || 'חזה עוף בגריל עם אורז וירקות',
      total_calories: 480,
      protein_g: 42,
      carbs_g: 45,
      fats_g: 10,
      weight_grams: 350,
      explanation: 'חישוב מבוסס מנה מאוזנת של חזה עוף ואורז'
    },
    {
      food_name: foodDesc || 'סלמון צרוב עם אבוקדו',
      total_calories: 560,
      protein_g: 38,
      carbs_g: 30,
      fats_g: 28,
      weight_grams: 380,
      explanation: 'מנה עשירה בחלבון איכותי ושומנים בריאים'
    }
  ];

  const randomSample = mockDatabase[Math.floor(Math.random() * mockDatabase.length)];
  return {
    ...randomSample,
    food_name: foodDesc || randomSample.food_name,
    isMock: true
  };
}

/**
 * Main AI Meal Image Analysis Function using Gemini Vision Model
 */
export async function analyzeMealImage(dataUrl, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    console.warn('Gemini API Key missing. Returning simulated meal analysis.');
    await new Promise((res) => setTimeout(res, 1500));
    return generateMockMealAnalysis();
  }

  try {
    const { base64Data, mimeType } = await getBase64FromUrlOrDataUrl(dataUrl);

    const genAI = new GoogleGenerativeAI(apiKey);
    // Standard compatible Gemini models (fallback loop)
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
    // Return graceful analysis fallback instead of crashing UI
    return generateMockMealAnalysis();
  }
}

/**
 * Text-Based AI Meal Analysis (calculates macros for typed food name & grams)
 */
export async function analyzeMealText(foodName, weightGrams = 200, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    await new Promise((res) => setTimeout(res, 1000));
    return generateMockMealAnalysis(foodName);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const modelNames = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-2.5-flash'];
    const prompt = `Analyze this food item: "${foodName}" weighing ${weightGrams} grams. Calculate the exact nutritional breakdown. You MUST return the response strictly as a JSON object with this exact structure: { "food_name": string, "total_calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "weight_grams": number, "explanation": string }.`;

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
          weight_grams: Number(parsedData.weight_grams) || Number(weightGrams),
          explanation: parsedData.explanation || 'חושב ב-Gemini AI',
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
    return generateMockMealAnalysis(foodName);
  }
}
