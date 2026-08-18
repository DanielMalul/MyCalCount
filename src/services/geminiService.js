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
  
  // Remove markdown codeblock syntax if present (```json ... ```)
  if (cleanText.startsWith('```')) {
    cleanText = cleanText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  // Attempt direct JSON parse
  try {
    return JSON.parse(cleanText);
  } catch (err) {
    // If there's leading/trailing non-json text, regex extract the first JSON object
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
function generateMockMealAnalysis(base64Image) {
  const mockDatabase = [
    {
      food_name: 'Grilled Chicken Breast with Quinoa & Roasted Veggies',
      total_calories: 520,
      protein_g: 46,
      carbs_g: 48,
      fats_g: 14,
      weight_grams: 410,
      explanation: 'High-protein balanced fitness meal with lean chicken breast, nutrient-dense quinoa, and roasted broccoli with olive oil.'
    },
    {
      food_name: 'Salmon Avocado Power Bowl',
      total_calories: 640,
      protein_g: 38,
      carbs_g: 42,
      fats_g: 32,
      weight_grams: 450,
      explanation: 'Healthy fats & protein rich meal featuring seared Atlantic salmon, ripe avocado slices, brown rice, and edamame.'
    },
    {
      food_name: 'Oatmeal with Whey Protein, Berries & Almond Butter',
      total_calories: 430,
      protein_g: 28,
      carbs_g: 54,
      fats_g: 12,
      weight_grams: 350,
      explanation: 'Complex carbohydrates and fast-digesting protein breakfast with blueberry antioxidants and almond butter.'
    },
    {
      food_name: 'Ribeye Steak with Sweet Potato & Asparagus',
      total_calories: 780,
      protein_g: 58,
      carbs_g: 36,
      fats_g: 42,
      weight_grams: 480,
      explanation: 'High calorie muscle-building meal with 250g grilled ribeye, baked sweet potato wedges, and buttered asparagus.'
    }
  ];

  const randomSample = mockDatabase[Math.floor(Math.random() * mockDatabase.length)];
  return {
    ...randomSample,
    isMock: true
  };
}

/**
 * Main AI Meal Analysis Function using Gemini Vision Model
 */
export async function analyzeMealImage(dataUrl, customApiKey = '') {
  const apiKey = customApiKey || import.meta.env.VITE_GEMINI_API_KEY || '';

  // If no API Key is available, use smooth fallback mock response
  if (!apiKey || apiKey.trim() === '') {
    console.warn('Gemini API Key missing. Returning realistic simulated meal analysis.');
    await new Promise((res) => setTimeout(res, 1800)); // Simulate AI processing delay
    return generateMockMealAnalysis(dataUrl);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Using standard fast vision model
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

    // Validate required fields
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
    // Fallback if API call fails (e.g., quota error or bad key)
    throw new Error(error?.message || 'Failed to analyze meal with Gemini AI.');
  }
}
