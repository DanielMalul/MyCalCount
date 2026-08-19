import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Check, Plus, Search, Utensils, Dumbbell, Sparkles, Flame, Wheat, PieChart, Star, CheckCircle2, Wand2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { generateAi3OptionsMealPlan, analyzeMealText } from '../services/geminiService';

export default function MyMealPlanPage() {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const addMeal = useFitnessStore((state) => state.addMeal);

  // Filter & tab states
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedMealIds, setAddedMealIds] = useState({});

  // AI Generator state
  const [diet, setDiet] = useState('כשר / רגיל');
  const [notes, setNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState(null);
  const [genError, setGenError] = useState('');

  // Custom meal modal state
  const [customMeals, setCustomMeals] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCalculatingAi, setIsCalculatingAi] = useState(false);
  const [calcError, setCalcError] = useState('');
  const [showManualFields, setShowManualFields] = useState(false);
  const [newMealForm, setNewMealForm] = useState({
    food_name: '',
    category: 'lunch',
    weight_grams: 200,
    total_calories: '',
    protein_g: '',
    carbs_g: '',
    fats_g: '',
    explanation: ''
  });

  const categoryLabels = {
    all: 'הכל',
    breakfast: '🥣 ארוחות בוקר',
    lunch: '🥗 ארוחות צהריים',
    dinner: '🍲 ארוחות ערב',
    snack: '🍎 נשנושים'
  };

  // Generate 3 options per meal time via Gemini AI
  const handleGenerate3Options = async () => {
    setIsGenerating(true);
    setGenError('');

    try {
      const plan = await generateAi3OptionsMealPlan({
        userProfile,
        dailyTargets,
        preferences: { diet, notes }
      });
      setGeneratedOptions(plan);
    } catch (err) {
      console.error(err);
      setGenError(err.message || 'יצירת התפריט נכשל. נסה שוב.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Extract all generated options into a unified flat list for display & filtering
  const getUnifiedMealsList = () => {
    const list = [...customMeals];

    if (generatedOptions) {
      const { breakfast_options, lunch_options, dinner_options, snack_options } = generatedOptions;
      if (Array.isArray(breakfast_options)) list.push(...breakfast_options.map((m, i) => ({ ...m, category: 'breakfast', option_num: i + 1 })));
      if (Array.isArray(lunch_options)) list.push(...lunch_options.map((m, i) => ({ ...m, category: 'lunch', option_num: i + 1 })));
      if (Array.isArray(dinner_options)) list.push(...dinner_options.map((m, i) => ({ ...m, category: 'dinner', option_num: i + 1 })));
      if (Array.isArray(snack_options)) list.push(...snack_options.map((m, i) => ({ ...m, category: 'snack', option_num: i + 1 })));
    }

    return list;
  };

  const allMeals = getUnifiedMealsList();

  const filteredMeals = allMeals.filter((m) => {
    const matchesCat = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch = m.food_name.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCat && matchesSearch;
  });

  const handleEatMeal = async (meal) => {
    await addMeal({
      food_name: meal.food_name,
      total_calories: Number(meal.total_calories) || 0,
      protein_g: Number(meal.protein_g) || 0,
      carbs_g: Number(meal.carbs_g) || 0,
      fats_g: Number(meal.fats_g) || 0,
      weight_grams: Number(meal.weight_grams) || 200,
      explanation: `${meal.food_name} (${categoryLabels[meal.category] || 'ארוחה'})`,
      image: null
    });

    setAddedMealIds((prev) => ({
      ...prev,
      [meal.id || meal.food_name]: (prev[meal.id || meal.food_name] || 0) + 1
    }));
  };

  const handleSaveCustomMeal = async (e) => {
    e.preventDefault();
    if (!newMealForm.food_name.trim()) return;

    const requestedWeight = Number(newMealForm.weight_grams) > 0 ? Number(newMealForm.weight_grams) : 200;

    if (showManualFields && newMealForm.total_calories) {
      const newMeal = {
        id: 'custom_' + Date.now(),
        category: newMealForm.category,
        food_name: newMealForm.food_name.trim(),
        weight_grams: requestedWeight,
        total_calories: Number(newMealForm.total_calories) || 0,
        protein_g: Number(newMealForm.protein_g) || 0,
        carbs_g: Number(newMealForm.carbs_g) || 0,
        fats_g: Number(newMealForm.fats_g) || 0,
        explanation: newMealForm.explanation || `ארוחה אישית (${requestedWeight}ג')`
      };

      setCustomMeals([newMeal, ...customMeals]);
      setIsAddModalOpen(false);
      setNewMealForm({ food_name: '', category: 'lunch', weight_grams: 200, total_calories: '', protein_g: '', carbs_g: '', fats_g: '', explanation: '' });
      setShowManualFields(false);
      return;
    }

    setIsCalculatingAi(true);
    setCalcError('');

    try {
      const res = await analyzeMealText(newMealForm.food_name.trim(), requestedWeight);

      const newMeal = {
        id: 'custom_' + Date.now(),
        category: newMealForm.category,
        food_name: res.food_name || newMealForm.food_name.trim(),
        weight_grams: requestedWeight,
        total_calories: res.total_calories || 0,
        protein_g: res.protein_g || 0,
        carbs_g: res.carbs_g || 0,
        fats_g: res.fats_g || 0,
        explanation: res.explanation || `ארוחה אישית מ-Gemini AI (${requestedWeight}ג')`
      };

      setCustomMeals([newMeal, ...customMeals]);
      setIsAddModalOpen(false);
      setNewMealForm({ food_name: '', category: 'lunch', weight_grams: 200, total_calories: '', protein_g: '', carbs_g: '', fats_g: '', explanation: '' });
      setShowManualFields(false);
    } catch (err) {
      console.error(err);
      setCalcError(err.message || 'חישוב הקלוריות ב-AI נכשל. נסה שוב.');
      setShowManualFields(true);
    } finally {
      setIsCalculatingAi(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      
      {/* Header & Goal Banner */}
      <section className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-md shrink-0">
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white truncate">התפריט שלי - מחולל ארוחות AI</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {userProfile.goal === 'cut' ? 'חיטוב' : userProfile.goal === 'bulk' ? 'מסה' : 'שמירה'} ({dailyTargets.targetCalories} קל')
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                חולל 3 אופציות מותאמות לכל ארוחה, וסמן ב-✓ את מה שאכלת להוספה מיידית ליומן!
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              setCalcError('');
              setIsAddModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center justify-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" /> הוסף ארוחה אישית
          </button>
        </div>

        {/* Embedded AI Generator Card */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-3.5 shadow-inner">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-purple-400 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-extrabold text-white">
                חולל 3 אופציות לכל ארוחה ביום (בוקר, צהריים, ערב, נשנוש)
              </h3>
            </div>
            {generatedOptions && (
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                12 אופציות מוכנות 🎉
              </span>
            )}
          </div>

          {/* Preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">העדפת כשרות / תזונה</label>
              <div className="grid grid-cols-2 gap-1.5">
                {['כשר / רגיל', 'עשיר בחלבון', 'טבעוני / צמחוני', 'דל פחמימה'].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setDiet(opt)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all border ${
                      diet === opt
                        ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow'
                        : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">בקשות מיוחדות (אופציונלי)</label>
              <input
                type="text"
                placeholder="למשל: ללא ביצים / הכנה קלה עד 15 דק' / אוהב עוף"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold focus:border-purple-400"
              />
            </div>
          </div>

          {genError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{genError}</span>
            </div>
          )}

          <button
            onClick={handleGenerate3Options}
            disabled={isGenerating}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-xl hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Gemini AI מכין עבורך 3 אופציות מנצחות לכל ארוחה...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-purple-200" />
                <span>{generatedOptions ? 'חולל 3 אופציות חדשות ב-AI' : 'חולל תפריט AI (3 אופציות לכל ארוחה)'}</span>
              </>
            )}
          </button>
        </div>

        {/* Category Tabs Filter */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
          {Object.entries(categoryLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveCategory(key)}
              className={`flex-1 min-w-[90px] py-2 px-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap text-center ${
                activeCategory === key
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="חפש באופציות התפריט שלי..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl glass-input text-xs font-bold focus:border-purple-400"
          />
        </div>
      </section>

      {/* Generated & Custom Meal Cards Grid */}
      {filteredMeals.length > 0 ? (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeals.map((meal, idx) => {
            const mealKey = meal.id || `${meal.category}_${idx}_${meal.food_name}`;
            const timesAdded = addedMealIds[mealKey] || 0;

            return (
              <motion.div
                key={mealKey}
                whileHover={{ scale: 1.01 }}
                className={`p-4 rounded-2xl glass-panel border transition-all flex flex-col justify-between space-y-3 ${
                  timesAdded > 0 ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800/80 bg-slate-900/60'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                        {categoryLabels[meal.category] || 'ארוחה'}
                      </span>
                      {meal.option_num && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          אופציה {meal.option_num}
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-black text-emerald-400">{meal.total_calories} קל'</span>
                  </div>

                  <h3 className="text-sm font-extrabold text-white leading-snug">{meal.food_name}</h3>
                  {meal.explanation && (
                    <p className="text-xs text-slate-400 leading-relaxed">{meal.explanation}</p>
                  )}
                </div>

                {/* Macro Bar Badges & V Checkmark Button */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-300">
                    <span className="text-indigo-400">{meal.protein_g}ג' חלבון</span>
                    <span className="text-amber-400">{meal.carbs_g}ג' פחמימה</span>
                    <span className="text-rose-400">{meal.fats_g}ג' שומן</span>
                    <span className="text-slate-500">({meal.weight_grams}ג')</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleEatMeal(meal)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shrink-0 ${
                      timesAdded > 0
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                    }`}
                    title="סמן כנאכל והוסף ליומן של היום"
                  >
                    <CheckCircle2 className={`w-4 h-4 ${timesAdded > 0 ? 'text-white' : 'text-emerald-400'}`} />
                    <span>{timesAdded > 0 ? `נוסף (${timesAdded})` : 'אכלתי (✓)'}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </section>
      ) : (
        <section className="p-8 sm:p-12 text-center glass-panel rounded-3xl border border-dashed border-slate-800 space-y-4">
          <ChefHat className="w-12 h-12 mx-auto text-purple-400/60" />
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">טרם חולל תפריט AI</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              לחץ על הכפתור הסגול למעלה "חולל תפריט AI" כדי ש-Gemini AI ירכיב עבורך 3 אופציות מותאמות לכל ארוחה!
            </p>
          </div>
          <button
            onClick={handleGenerate3Options}
            disabled={isGenerating}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs shadow-lg inline-flex items-center gap-2"
          >
            <Wand2 className="w-4 h-4 text-purple-200" />
            <span>חולל 3 אופציות לכל ארוחה כעת</span>
          </button>
        </section>
      )}

      {/* Add Custom Meal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 text-white border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> הוספת ארוחה אישית לתפריט
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              הזן שם ומשקל - Gemini AI יחשב עבורך אוטומטית קלוריות וערכים!
            </p>

            <form onSubmit={handleSaveCustomMeal} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">שם המאכל / הארוחה</label>
                <input
                  type="text"
                  placeholder="למשל: סלט עוף ואבוקדו"
                  value={newMealForm.food_name}
                  onChange={(e) => setNewMealForm({ ...newMealForm, food_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold focus:border-purple-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">משקל מנה (גרם / מ"ל)</label>
                  <input
                    type="number"
                    placeholder="200"
                    value={newMealForm.weight_grams}
                    onChange={(e) => setNewMealForm({ ...newMealForm, weight_grams: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold focus:border-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">קטגוריה בתפריט</label>
                  <select
                    value={newMealForm.category}
                    onChange={(e) => setNewMealForm({ ...newMealForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 text-xs font-bold text-white border border-slate-800"
                  >
                    <option value="breakfast">🥣 ארוחת בוקר</option>
                    <option value="lunch">🥗 ארוחת צהריים</option>
                    <option value="dinner">🍲 ארוחת ערב</option>
                    <option value="snack">🍎 נשנוש / ביניים</option>
                  </select>
                </div>
              </div>

              {/* Optional Manual Overrides */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualFields(!showManualFields)}
                  className="text-[11px] font-bold text-purple-400 hover:underline flex items-center gap-1"
                >
                  <span>{showManualFields ? 'הסתר הזנה ידנית' : 'הזן קלוריות וערכים ידנית (אופציונלי)'}</span>
                </button>
              </div>

              {showManualFields && (
                <div className="grid grid-cols-4 gap-2 text-center pt-1 bg-slate-900/60 p-2.5 rounded-2xl border border-slate-800">
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">קלוריות</label>
                    <input
                      type="number"
                      placeholder="350"
                      value={newMealForm.total_calories}
                      onChange={(e) => setNewMealForm({ ...newMealForm, total_calories: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">חלבון</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={newMealForm.protein_g}
                      onChange={(e) => setNewMealForm({ ...newMealForm, protein_g: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">פחמימות</label>
                    <input
                      type="number"
                      placeholder="25"
                      value={newMealForm.carbs_g}
                      onChange={(e) => setNewMealForm({ ...newMealForm, carbs_g: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">שומנים</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={newMealForm.fats_g}
                      onChange={(e) => setNewMealForm({ ...newMealForm, fats_g: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-rose-400"
                    />
                  </div>
                </div>
              )}

              {calcError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{calcError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  disabled={isCalculatingAi}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-extrabold shadow-md flex items-center gap-2 disabled:opacity-50"
                >
                  {isCalculatingAi ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>מחשב ב-AI...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-purple-200" />
                      <span>חשב ב-AI ושמור לתפריט</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
