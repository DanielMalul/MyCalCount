import { GoogleGenerativeAI } from '@google/generative-ai';

const REQUIRED_PROMPT = `Analyze this image of a meal. Identify the food items, estimate the portion sizes in grams, and calculate the exact nutritional breakdown. You MUST return the response strictly as a JSON object with this exact structure: { "food_name": string, "total_calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "weight_grams": number, "explanation": string }.`;

/**
 * Extracts raw base64 data and mimeType from data URL string
 */
function parseBase64Image(dataUrl) {
  if (!dataUrl) throw new Error('No image data provided');
  
  if (dataUrl.includes(',')) {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0].match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
    const base64Data = parts[1];
    return { base64Data, mimeType };
  }

  return { base64Data: dataUrl, mimeType: 'image/jpeg' };
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
 * Realistic Mock Analyzer fallback when no Gemini API Key is configured
 */
function generateMockMealAnalysis(foodDesc = '') {
  const mockDatabase = [
    {
      food_name: foodDesc || 'Grilled Chicken Breast & Rice',
      total_calories: 480,
      protein_g: 42,
      carbs_g: 45,
      fats_g: 10,
      weight_grams: 350,
      explanation: 'Balanced fitness meal calculation based on lean protein and complex carbs.'
    },
    {
      food_name: foodDesc || 'Avocado Egg Toast',
      total_calories: 390,
      protein_g: 18,
      carbs_g: 32,
      fats_g: 22,
      weight_grams: 250,
      explanation: 'Healthy fats, complex carbs, and moderate protein breakfast.'
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
    console.warn('Gemini API Key missing. Returning realistic simulated meal analysis.');
    await new Promise((res) => setTimeout(res, 1800));
    return generateMockMealAnalysis();
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const { base64Data, mimeType } = parseBase64Image(dataUrl);

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
      food_name: parsedData.food_name || 'Scanned Meal',
      total_calories: Number(parsedData.total_calories) || 0,
      protein_g: Number(parsedData.protein_g) || 0,
      carbs_g: Number(parsedData.carbs_g) || 0,
      fats_g: Number(parsedData.fats_g) || 0,
      weight_grams: Number(parsedData.weight_grams) || 200,
      explanation: parsedData.explanation || 'Analyzed by Gemini Vision AI',
      isMock: false
    };
  } catch (error) {
    console.error('Gemini Vision AI Analysis Error:', error);
    throw new Error(error?.message || 'Failed to analyze meal with Gemini AI.');
  }
}

/**
 * Text-Based AI Meal Analysis (calculates macros for typed food name & grams)
 */
export async function analyzeMealText(foodName, weightGrams = 200, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    await new Promise((res) => setTimeout(res, 1200));
    return generateMockMealAnalysis(foodName);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Analyze this food item: "${foodName}" weighing ${weightGrams} grams. Calculate the exact nutritional breakdown. You MUST return the response strictly as a JSON object with this exact structure: { "food_name": string, "total_calories": number, "protein_g": number, "carbs_g": number, "fats_g": number, "weight_grams": number, "explanation": string }.`;

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
      explanation: parsedData.explanation || 'Calculated by Gemini AI',
      isMock: false
    };
  } catch (error) {
    console.error('Gemini Text AI Analysis Error:', error);
    throw new Error(error?.message || 'Failed to calculate macros with Gemini AI.');
  }
}
