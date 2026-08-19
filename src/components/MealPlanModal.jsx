import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Utensils, Clock, Check, X, Wand2, AlertCircle, Calendar, PlusCircle, ChefHat, Dumbbell, Zap } from 'lucide-react';
import { generateAiMealPlan } from '../services/geminiService';
import { useFitnessStore } from '../store/useFitnessStore';
import { estimateTimeToGoal } from '../utils/fitnessMath';

export default function MealPlanModal({ isOpen, onClose }) {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const addMealsBatch = useFitnessStore((state) => state.addMealsBatch);

  const [diet, setDiet] = useState('כשר / רגיל');
  const [mealCount, setMealCount] = useState(3);
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isImported, setIsImported] = useState(false);

  if (!isOpen) return null;

  const estimatedInfo = estimateTimeToGoal(userProfile);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg('');
    setIsImported(false);

    try {
      const plan = await generateAiMealPlan({
        userProfile,
        dailyTargets,
        preferences: { diet, notes },
        mealCount
      });
      setGeneratedPlan(plan);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'יצירת התפריט נכשלה. אנא נסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportToLog = async () => {
    if (!generatedPlan || !Array.isArray(generatedPlan.meals) || generatedPlan.meals.length === 0) return;

    const formattedMeals = generatedPlan.meals.map((meal) => ({
      food_name: meal.food_name,
      total_calories: Number(meal.total_calories) || 0,
      protein_g: Number(meal.protein_g) || 0,
      carbs_g: Number(meal.carbs_g) || 0,
      fats_g: Number(meal.fats_g) || 0,
      weight_grams: Number(meal.weight_grams) || 200,
      explanation: `${meal.meal_type || 'ארוחה'}: ${meal.explanation || 'תפריט מותאם מ-Gemini AI'}`,
      image: null
    }));

    await addMealsBatch(formattedMeals);

    setIsImported(true);
    setTimeout(() => {
      onClose();
      setIsImported(false);
      setGeneratedPlan(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl glass-panel rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-slate-700/60 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2 space-x-reverse min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/20 shrink-0">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold text-white truncate">
                מחולל תפריטים אישי AI
              </h2>
              <p className="text-xs text-slate-400 truncate">
                בניית תפריט תזונה מדויק לפי היעדים וההעדפות שלך
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Goal & Pace Status Banner */}
        <div className="mb-5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between text-xs gap-2">
            <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Dumbbell className="w-4 h-4" />
              <span>יעד: {dailyTargets.targetCalories} קלוריות</span>
              <span className="text-slate-400 font-normal">| חלבון: {dailyTargets.proteinGrams}ג'</span>
            </div>
            {estimatedInfo.text && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 flex items-center gap-1">
                <Clock className="w-3 h-3" /> זמן משוער ליעד: {estimatedInfo.text}
              </span>
            )}
          </div>
        </div>

        {/* Generator Controls */}
        {!generatedPlan && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                העדפות תזונה וכשרות
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {['כשר / רגיל', 'עשיר בחלבון', 'טבעוני / צמחוני', 'דל פחמימה'].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setDiet(option)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      diet === option
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                מספר ארוחות ביום
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { count: 3, label: '3 ארוחות עיקריות' },
                  { count: 4, label: '3 ארוחות + נשנוש' },
                  { count: 5, label: '5 ארוחות קטנות' }
                ].map((item) => (
                  <button
                    key={item.count}
                    type="button"
                    onClick={() => setMealCount(item.count)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
                      mealCount === item.count
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-md'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                בקשות מיוחדות או מאכלים מעודפים/שנואים (אופציונלי)
              </label>
              <input
                type="text"
                placeholder="למשל: ללא ביצים / הכנה עד 15 דקות / אוהב עוף ואורז"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl glass-input text-xs font-bold focus:border-emerald-400"
              />
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-extrabold text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Gemini AI מרכיב עבורך תפריט תזונה מנצח...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-emerald-200 animate-pulse" />
                  <span>חולל תפריט AI מותאם אישית</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Display Generated Plan Result */}
        {generatedPlan && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-teal-950/40 border border-emerald-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold text-emerald-400 uppercase">תפריט שנבנה עבורך</span>
                <h3 className="text-base sm:text-lg font-extrabold text-white">{generatedPlan.plan_title}</h3>
                {generatedPlan.summary_note && (
                  <p className="text-xs text-slate-300 mt-1 italic">"{generatedPlan.summary_note}"</p>
                )}
              </div>
              <button
                onClick={() => setGeneratedPlan(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold shrink-0 border border-slate-700"
              >
                חולל תפריט חדש
              </button>
            </div>

            {/* Total Plan Nutrients Summary */}
            <div className="grid grid-cols-4 gap-2 text-center bg-slate-900/90 p-3 rounded-2xl border border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400">קלוריות</p>
                <p className="text-xs sm:text-sm font-black text-emerald-400">{generatedPlan.total_plan_calories || dailyTargets.targetCalories} <span className="text-[9px]">קל'</span></p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">חלבון</p>
                <p className="text-xs sm:text-sm font-black text-indigo-400">{generatedPlan.total_plan_protein || dailyTargets.proteinGrams}ג'</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">פחמימות</p>
                <p className="text-xs sm:text-sm font-black text-amber-400">{generatedPlan.total_plan_carbs || dailyTargets.carbGrams}ג'</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">שומנים</p>
                <p className="text-xs sm:text-sm font-black text-rose-400">{generatedPlan.total_plan_fats || dailyTargets.fatGrams}ג'</p>
              </div>
            </div>

            {/* Meals List Breakdown */}
            <div className="space-y-3 max-h-72 overflow-y-auto pl-1">
              {Array.isArray(generatedPlan.meals) && generatedPlan.meals.map((meal, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-400">{meal.meal_type || `ארוחה ${idx + 1}`}</span>
                    <span className="text-xs font-black text-white">{meal.total_calories} קל'</span>
                  </div>
                  <h4 className="text-sm font-extrabold text-slate-100">{meal.food_name}</h4>
                  {meal.explanation && (
                    <p className="text-xs text-slate-400 leading-relaxed">{meal.explanation}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-400 pt-1">
                    <span className="text-indigo-300">חלבון: {meal.protein_g}ג'</span>
                    <span className="text-amber-300">פחמימות: {meal.carbs_g}ג'</span>
                    <span className="text-rose-300">שומנים: {meal.fats_g}ג'</span>
                    {meal.weight_grams && <span className="text-slate-500">({meal.weight_grams} גרם)</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* 1-Click Import Action Button */}
            <button
              onClick={handleImportToLog}
              disabled={isImported}
              className={`w-full py-4 rounded-2xl text-white font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                isImported
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95'
              }`}
            >
              {isImported ? (
                <>
                  <Check className="w-5 h-5 animate-bounce" />
                  <span>הארוחות יובאו בהצלחה ליומן היומי שלך!</span>
                </>
              ) : (
                <>
                  <PlusCircle className="w-5 h-5" />
                  <span>ייבא את כל הארוחות ליומן היומי שלי (בלחיצה אחת)</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
