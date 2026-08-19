import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * AI Personal Nutrition & Fitness Coach Service
 */
export async function askAiNutritionCoach({
  userMessage,
  chatHistory = [],
  userProfile = {},
  dailyTargets = {},
  dailyTotals = {},
  loggedMeals = []
}) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  if (!apiKey || apiKey.trim() === '') {
    throw new Error('מפתח Gemini API חסר בקוד. נא להגדיר VITE_GEMINI_API_KEY בקובץ ה-env.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const modelNames = ['gemini-3.6-flash', 'gemini-3.5-flash'];
  let lastError = null;

  // Format today's logged meals context
  const mealsTodayStr = loggedMeals.length > 0
    ? loggedMeals.map((m) => `- ${m.food_name}: ${m.total_calories} קל' (${m.protein_g}ג' חלבון, ${m.carbs_g}ג' פחמימה, ${m.fats_g}ג' שומן)`).join('\n')
    : 'טרם נרשמו ארוחות להיום.';

  const goalText = userProfile.goal === 'cut' ? 'חיטוב ושריפת שומן' : userProfile.goal === 'bulk' ? 'עלייה במסת שריר' : 'שמירה על משקל';

  const remCalories = Math.max(0, (dailyTargets.targetCalories || 2000) - (dailyTotals.calories || 0));
  const remProtein = Math.max(0, (dailyTargets.proteinGrams || 150) - (dailyTotals.protein || 0));

  const systemInstruction = `אתה "מנטור התזונה של MyCalCount" - מאמן תזונה וכושר אישי AI מהשורה הראשונה בעולם.
תפקידך להעניק ייעוץ תזונתי מקצועי, מדרבן ומדויק בעברית טבעית, חמה ומעצימה.

נתוני המשתמש והיום הנוכחי:
- שם / יעד: ${goalText} (משקל נוכחי: ${userProfile.currentWeightKg || 70} ק"ג ← יעד: ${userProfile.targetWeightKg || 65} ק"ג)
- יעד קלוריות יומי: ${dailyTargets.targetCalories || 2000} קלוריות (חלבון: ${dailyTargets.proteinGrams || 150}ג', פחמימות: ${dailyTargets.carbGrams || 200}ג', שומנים: ${dailyTargets.fatGrams || 65}ג')
- נצטרכו להיום עד כה: ${dailyTotals.calories || 0} קלוריות (חלבון: ${dailyTotals.protein || 0}ג', פחמימות: ${dailyTotals.carbs || 0}ג', שומנים: ${dailyTotals.fats || 0}ג')
- נותר להיום: ${remCalories} קלוריות, ${remProtein}ג' חלבון.

ארוחות שנרשמו להיום:
${mealsTodayStr}

הנחיות מענה:
1. ענה בעברית רהוטה, מעודדת, בגובה העיניים ובקצרה (2-4 פסקאות קצרות עם אימוג'ים מתאימים).
2. התחס למצב הקלוריות והחלבון שנותרו לו להיום!
3. אם המשתמש שואל מה לאכול או מבקש רעיון לארוחה/נשנוש, תן המלצה מפורטת עם ערכים (שם, גרמים, קלוריות, חלבון).
4. אם המשתמש מדווח על ארוחה שאכל בחוץ, עזור לו לאמוד את הקלוריות והמאקרו בצורה מציאותית.`;

  // Build prompt with context & history
  let fullPrompt = '';
  if (chatHistory.length > 0) {
    const historyText = chatHistory
      .slice(-6)
      .map((h) => `${h.role === 'user' ? 'משתמש' : 'מאמן'}: ${h.content}`)
      .join('\n');
    fullPrompt = `שיחה קודמת:\n${historyText}\n\nשאלת המשתמש כעת: ${userMessage}`;
  } else {
    fullPrompt = `שאלת המשתמש: ${userMessage}`;
  }

  for (const modelName of modelNames) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          temperature: 0.4,
          topP: 0.9
        }
      });

      const result = await model.generateContent([fullPrompt]);
      const response = await result.response;
      return response.text();
    } catch (err) {
      console.warn(`AI Coach model ${modelName} failed, trying next...`, err);
      lastError = err;
    }
  }

  throw lastError || new Error('שגיאה בתקשורת עם מאמן התזונה AI');
}
