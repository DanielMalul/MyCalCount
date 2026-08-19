import { GoogleGenerativeAI } from '@google/generative-ai';
import { cleanAndParseJSON } from './geminiService';

const WORKOUT_CALC_PROMPT = `You are a sports science & exercise physiology expert. Estimate the total calories burned for the specified workout, duration, and user body weight using MET (Metabolic Equivalent of Task) standards.

OUTPUT RULES:
- Output MUST be strictly valid JSON in HEBREW.
- burned_calories must be realistic (e.g. 45 min strength training for 75kg user is ~250-350 kcal, 30 min running 10km/h is ~320-380 kcal).

JSON Schema:
{
  "workout_name": string (Hebrew title),
  "duration_minutes": number,
  "burned_calories": number,
  "intensity": string (Hebrew: "קלה", "בינונית", or "גבוהה / עצמתית"),
  "explanation": string (Brief Hebrew breakdown e.g. "לפי משקל 75 ק"ג ועוצמה בינונית (6 METs)")
}`;

export async function analyzeWorkoutText({ workoutName, durationMinutes = 45, userWeightKg = 75 }) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash'];
  let lastError = null;

  const prompt = `Workout: "${workoutName}", Duration: ${durationMinutes} minutes, User Weight: ${userWeightKg} kg.
Calculate estimated calories burned. Return valid JSON in Hebrew according to schema.`;

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: WORKOUT_CALC_PROMPT,
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
      console.warn(`Workout model ${modelName} failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה בחישוב קלוריות אימון ב-Gemini AI');
}
