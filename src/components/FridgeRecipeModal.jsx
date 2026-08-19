import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Utensils, Clock, Check, X, Wand2, AlertCircle, ChefHat, Plus, Flame } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { generateFridgeRecipe } from '../services/geminiService';

export default function FridgeRecipeModal({ isOpen, onClose }) {
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const getDailyTotals = useFitnessStore((state) => state.getDailyTotals);
  const addMeal = useFitnessStore((state) => state.addMeal);

  const [ingredientsText, setIngredientsText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isImported, setIsImported] = useState(false);

  if (!isOpen) return null;

  const dailyTotals = getDailyTotals();
  const remCalories = Math.max(200, (dailyTargets.targetCalories || 2000) - (dailyTotals.calories || 0));
  const remProtein = Math.max(15, (dailyTargets.proteinGrams || 150) - (dailyTotals.protein || 0));

  const stapleTags = ['🥚 ביצים', '🧀 גבינה לבנה/בולגרית', '🍅 עגבניה', '🍞 לחם קל/דגנים', '🍗 חזה עוף', '🥫 קופסת טונה', '🥑 אבוקדו', '🥣 שיבולת שועל'];

  const handleAddTag = (tagStr) => {
    const cleanTag = tagStr.split(' ')[1] || tagStr;
    if (!ingredientsText.includes(cleanTag)) {
      setIngredientsText((prev) => (prev ? `${prev}, ${cleanTag}` : cleanTag));
    }
  };

  const handleGenerate = async () => {
    if (!ingredientsText.trim()) {
      setErrorMsg('אנא רשום או בחר לפחות מצרך אחד שיש לך בבית.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg('');
    setIsImported(false);

    try {
      const recipe = await generateFridgeRecipe({
        ingredients: ingredientsText.trim(),
        remainingCalories: remCalories,
        remainingProtein: remProtein
      });

      setGeneratedRecipe(recipe);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'יצירת המתכון נכשלה. אנא נסה שנית.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleImportToLog = async () => {
    if (!generatedRecipe) return;

    await addMeal({
      food_name: generatedRecipe.recipe_name,
      total_calories: Number(generatedRecipe.total_calories) || 0,
      protein_g: Number(generatedRecipe.protein_g) || 0,
      carbs_g: Number(generatedRecipe.carbs_g) || 0,
      fats_g: Number(generatedRecipe.fats_g) || 0,
      weight_grams: Number(generatedRecipe.weight_grams) || 250,
      explanation: `מתכון מקרר AI: ${generatedRecipe.ingredients_list?.join(', ') || ''}`,
      image: null
    });

    setIsImported(true);
    setTimeout(() => {
      onClose();
      setIsImported(false);
      setGeneratedRecipe(null);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl glass-panel rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-slate-700/60 max-h-[90vh] overflow-y-auto space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-400 shadow-lg shadow-amber-500/20 shrink-0 text-white">
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold text-white truncate">
                סורק המקרר והארון AI
              </h2>
              <p className="text-xs text-slate-400 truncate">
                מה לבשל ממה שיש בבית? Gemini AI מכין מתכון לפי מצרכים
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Phase */}
        {!generatedRecipe ? (
          <div className="space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400">יעד קלוריות/חלבון נותר להיום:</span>
              <div className="font-extrabold text-emerald-400 flex items-center gap-3">
                <span>{remCalories} קלוריות</span>
                <span>{remProtein}ג' חלבון</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                מה המצרכים שיש לך במקרר/ארון כעת?
              </label>
              <textarea
                rows={3}
                placeholder="למשל: 2 ביצים, גבינה בולגרית 5%, עגבניה, 2 פרוסות לחם קל..."
                value={ingredientsText}
                onChange={(e) => setIngredientsText(e.target.value)}
                className="w-full p-3.5 rounded-2xl glass-input text-xs font-bold focus:border-amber-400"
              />
            </div>

            {/* Quick Ingredient Tags */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-400">לחץ להוספה מהירה:</span>
              <div className="flex flex-wrap gap-1.5">
                {stapleTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleAddTag(tag)}
                    className="px-2.5 py-1 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-300 text-xs font-bold border border-slate-700/60 transition-colors"
                  >
                    + {tag}
                  </button>
                ))}
              </div>
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
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 text-white font-extrabold text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Gemini AI מכין מתכון מנצח מהמצרכים שלך...</span>
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 text-amber-200" />
                  <span>המצא מתכון AI מהמקרר שלי</span>
                </>
              )}
            </button>
          </div>
        ) : (
          /* Recipe Display Phase */
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-amber-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {generatedRecipe.prep_time_minutes || 15} דק' הכנה • {generatedRecipe.difficulty || 'קל'}
                </span>
                <button
                  onClick={() => setGeneratedRecipe(null)}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  חזור לעריכת מצרכים
                </button>
              </div>

              <h3 className="text-base sm:text-lg font-extrabold text-white">{generatedRecipe.recipe_name}</h3>
              {generatedRecipe.dietitian_tip && (
                <p className="text-xs text-amber-200/90 italic">"{generatedRecipe.dietitian_tip}"</p>
              )}
            </div>

            {/* Nutrients Bar */}
            <div className="grid grid-cols-4 gap-2 text-center bg-slate-950/80 p-3 rounded-2xl border border-slate-800 font-extrabold">
              <div>
                <span className="text-[10px] text-slate-400 block">קלוריות</span>
                <span className="text-xs sm:text-sm text-emerald-400">{generatedRecipe.total_calories} קל'</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">חלבון</span>
                <span className="text-xs sm:text-sm text-indigo-400">{generatedRecipe.protein_g}ג'</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">פחמימות</span>
                <span className="text-xs sm:text-sm text-amber-400">{generatedRecipe.carbs_g}ג'</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block">שומנים</span>
                <span className="text-xs sm:text-sm text-rose-400">{generatedRecipe.fats_g}ג'</span>
              </div>
            </div>

            {/* Ingredients & Steps */}
            <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80 text-xs">
              {Array.isArray(generatedRecipe.ingredients_list) && (
                <div>
                  <h4 className="font-extrabold text-amber-300 mb-1">🛒 מצרכים דרושים:</h4>
                  <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                    {generatedRecipe.ingredients_list.map((ing, i) => (
                      <li key={i}>{ing}</li>
                    ))}
                  </ul>
                </div>
              )}

              {Array.isArray(generatedRecipe.instructions) && (
                <div>
                  <h4 className="font-extrabold text-emerald-300 mb-1 mt-2">👨‍🍳 הוראות הכנה:</h4>
                  <ol className="list-decimal list-inside text-slate-300 space-y-1">
                    {generatedRecipe.instructions.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            {/* Import Button */}
            <button
              onClick={handleImportToLog}
              disabled={isImported}
              className={`w-full py-4 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 text-white ${
                isImported ? 'bg-emerald-600' : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95'
              }`}
            >
              {isImported ? (
                <>
                  <Check className="w-5 h-5 animate-bounce" />
                  <span>המתכון נוסף בהצלחה ליומן היומי! 🎉</span>
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  <span>אכלתי את המתכון הזה (✓) - הוסף ליומן היומי</span>
                </>
              )}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
