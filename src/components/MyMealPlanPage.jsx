import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Check, Plus, Search, Utensils, Dumbbell, Sparkles, Flame, Wheat, PieChart, Star, CheckCircle2 } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export const PRESET_MEALS_DATABASE = {
  cut: [
    // Breakfast
    { id: 'cut_b1', category: 'breakfast', food_name: 'חביתת 3 ביצים עם תרד וגבינה בולגרית 5%', weight_grams: 220, total_calories: 280, protein_g: 26, carbs_g: 3, fats_g: 18, explanation: 'חלבון גבוה ודל פחמימה לחיטוב ושריפת שומן' },
    { id: 'cut_b2', category: 'breakfast', food_name: 'שיבולת שועל על בסיס מים/חלב דל שומן עם סקופ חלבון ופירות יער', weight_grams: 300, total_calories: 340, protein_g: 32, carbs_g: 40, fats_g: 5, explanation: 'ארוחת בוקר משביעה ועשירה בסיבים תזונתיים וחלבון' },
    { id: 'cut_b3', category: 'breakfast', food_name: 'יוגורט פרו 20ג\' חלבון עם כפית חמאת בוטנים טבעית וחצי תפוח', weight_grams: 250, total_calories: 230, protein_g: 22, carbs_g: 18, fats_g: 7, explanation: 'ארוחת בוקר קלה ומהירה להכנה' },

    // Lunch
    { id: 'cut_l1', category: 'lunch', food_name: 'חזה עוף בגריל (200ג\') עם 150ג\' אורז בסמטי וסלט ירקות עשיר', weight_grams: 450, total_calories: 450, protein_g: 52, carbs_g: 42, fats_g: 6, explanation: 'ארוחת צהריים קלאסית לחיטוב איכותי' },
    { id: 'cut_l2', category: 'lunch', food_name: 'פילה סלומון בתנור (180ג\') עם בטטה אפויה ופרחי ברוקולי', weight_grams: 400, total_calories: 490, protein_g: 42, carbs_g: 30, fats_g: 22, explanation: 'אומגה 3, שומנים בריאים וחלבון איכותי' },
    { id: 'cut_l3', category: 'lunch', food_name: 'קופסת טונה במים עם קינואה מבושלת, מלפפון, עגבניה וכפית שמן זית', weight_grams: 350, total_calories: 380, protein_g: 38, carbs_g: 35, fats_g: 10, explanation: 'סלט טונה וקינואה קל, משביע ומהיר' },

    // Dinner
    { id: 'cut_d1', category: 'dinner', food_name: 'סלט עוף גדול: חזה עוף (180ג\') עלי בייבי, עגבניות שרי וכף טחינה', weight_grams: 400, total_calories: 360, protein_g: 46, carbs_g: 12, fats_g: 14, explanation: 'ארוחת ערב קלה עם חלבון גבוה ודלת פחמימות' },
    { id: 'cut_d2', category: 'dinner', food_name: 'שקשוקה בייתית מ-2 ביצים + 100ג\' גבינה לבנה 3% ולחם קל (2 פרוסות)', weight_grams: 350, total_calories: 350, protein_g: 28, carbs_g: 24, fats_g: 15, explanation: 'ארוחת ערב ישראלית משביעה ומאוזנת' },

    // Snacks
    { id: 'cut_s1', category: 'snack', food_name: 'עוגיות פריכיות אורז (3 יח\') עם מעט גבינה לבנה 5% ופרוסות מלפפון', weight_grams: 120, total_calories: 130, protein_g: 7, carbs_g: 20, fats_g: 2, explanation: 'נשנוש קל בין ארוחות' },
    { id: 'cut_s2', category: 'snack', food_name: 'חטיף חלבון (60ג\') 20ג\' חלבון', weight_grams: 60, total_calories: 210, protein_g: 20, carbs_g: 22, fats_g: 7, explanation: 'פתרון מתוק וזמין לחלבון' }
  ],
  bulk: [
    // Breakfast
    { id: 'bulk_b1', category: 'breakfast', food_name: 'שייק מסה עשיר: 2 כוסות חלב, 2 סקופ חלבון, 80ג\' שיבולת שועל וכף חמאת בוטנים', weight_grams: 550, total_calories: 780, protein_g: 62, carbs_g: 80, fats_g: 22, explanation: 'פצצת קלוריות וחלבון לעלייה במסת שריר' },
    { id: 'bulk_b2', category: 'breakfast', food_name: 'חביתה מ-4 ביצים עם 2 פרוסות לחם מלא, אבוקדו שלם וגבינה צהובה', weight_grams: 400, total_calories: 650, protein_g: 36, carbs_g: 38, fats_g: 38, explanation: 'ארוחת בוקר עשירה בשומנים בריאים וחלבון' },

    // Lunch
    { id: 'bulk_l1', category: 'lunch', food_name: 'המבורגר בקר נקי (250ג\') בלחמניה מקמח מלא עם תפוחי אדמה אפויים', weight_grams: 500, total_calories: 820, protein_g: 58, carbs_g: 75, fats_g: 32, explanation: 'ארוחת צהריים מפנקת ועשירה בקלוריות לבניית שריר' },
    { id: 'bulk_l2', category: 'lunch', food_name: 'פרגיות בגריל (250ג\') עם 250ג\' פסטה ברוטב עגבניות ושמן זית', weight_grams: 550, total_calories: 890, protein_g: 64, carbs_g: 90, fats_g: 28, explanation: 'עודף קלורי איכותי להתאוששות וגדילה' },

    // Dinner
    { id: 'bulk_d1', category: 'dinner', food_name: 'טורטיה מקמח מלא במילוי בשר טחון (200ג\'), שעועית אדומה, אורז וטחינה', weight_grams: 450, total_calories: 720, protein_g: 48, carbs_g: 70, fats_g: 26, explanation: 'טורטיה מקסיקנית עשירה ומזינה' },

    // Snacks
    { id: 'bulk_s1', category: 'snack', food_name: 'חופן אגוזי מלך ושקדים (50ג\') + בננה גדולה', weight_grams: 170, total_calories: 420, protein_g: 10, carbs_g: 35, fats_g: 28, explanation: 'נשנוש עתיר אנרגיה ושומן בריא' }
  ],
  recomp: [
    // Breakfast
    { id: 'recomp_b1', category: 'breakfast', food_name: 'חביתה מ-2 ביצים + חלבונים עם פרוסת לחם דגנים ואבוקדו (חצי)', weight_grams: 250, total_calories: 360, protein_g: 22, carbs_g: 20, fats_g: 20, explanation: 'מאוזן באופן מושלם לריקומפ' },
    // Lunch
    { id: 'recomp_l1', category: 'lunch', food_name: 'חזה עוף (200ג\') עם בטטה אפויה בתנור (200ג\') וירקות ירוקים', weight_grams: 450, total_calories: 520, protein_g: 48, carbs_g: 48, fats_g: 12, explanation: 'איזון מדויק לפחמימה, חלבון ושומן' },
    // Dinner
    { id: 'recomp_d1', category: 'dinner', food_name: 'סלט טונה עם ביצה קשה, תירס, מלפפון חמוץ וכף מיונז לייט', weight_grams: 350, total_calories: 420, protein_g: 38, carbs_g: 18, fats_g: 20, explanation: 'ארוחת ערב טעימה ומשביעה' }
  ]
};

export default function MyMealPlanPage() {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const addMeal = useFitnessStore((state) => state.addMeal);

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [addedMealIds, setAddedMealIds] = useState({});
  const [customPresets, setCustomPresets] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newPresetForm, setNewPresetForm] = useState({
    food_name: '',
    category: 'lunch',
    weight_grams: 200,
    total_calories: 350,
    protein_g: 30,
    carbs_g: 30,
    fats_g: 10,
    explanation: 'ארוחה מותאמת אישית בתפריט שלי'
  });

  const currentGoal = userProfile.goal || 'cut';
  const defaultList = PRESET_MEALS_DATABASE[currentGoal] || PRESET_MEALS_DATABASE.cut;
  const allMeals = [...customPresets, ...defaultList];

  const categoryLabels = {
    all: 'הכל',
    breakfast: '🥣 ארוחות בוקר',
    lunch: '🥗 ארוחות צהריים',
    dinner: '🍲 ארוחות ערב',
    snack: '🍎 נשנושים'
  };

  const filteredMeals = allMeals.filter((m) => {
    const matchesCat = activeCategory === 'all' || m.category === activeCategory;
    const matchesSearch = m.food_name.toLowerCase().includes(searchTerm.toLowerCase().trim());
    return matchesCat && matchesSearch;
  });

  const handleToggleEatMeal = async (meal) => {
    await addMeal({
      food_name: meal.food_name,
      total_calories: meal.total_calories,
      protein_g: meal.protein_g,
      carbs_g: meal.carbs_g,
      fats_g: meal.fats_g,
      weight_grams: meal.weight_grams,
      explanation: `נבחר מהתפריט שלי (${categoryLabels[meal.category] || 'ארוחה'})`,
      image: null
    });

    setAddedMealIds((prev) => ({
      ...prev,
      [meal.id]: (prev[meal.id] || 0) + 1
    }));
  };

  const handleSaveCustomPreset = (e) => {
    e.preventDefault();
    if (!newPresetForm.food_name.trim()) return;

    const newPreset = {
      ...newPresetForm,
      id: 'custom_preset_' + Date.now(),
      weight_grams: Number(newPresetForm.weight_grams) || 200,
      total_calories: Number(newPresetForm.total_calories) || 0,
      protein_g: Number(newPresetForm.protein_g) || 0,
      carbs_g: Number(newPresetForm.carbs_g) || 0,
      fats_g: Number(newPresetForm.fats_g) || 0
    };

    setCustomPresets([newPreset, ...customPresets]);
    setIsAddModalOpen(false);
    setNewPresetForm({
      food_name: '',
      category: 'lunch',
      weight_grams: 200,
      total_calories: 350,
      protein_g: 30,
      carbs_g: 30,
      fats_g: 10,
      explanation: 'ארוחה מותאמת אישית בתפריט שלי'
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Banner */}
      <section className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-md shrink-0">
              <ChefHat className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-white truncate">ספרית התפריט שלי</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {currentGoal === 'cut' ? 'חיטוב' : currentGoal === 'bulk' ? 'מסה' : 'שמירה'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 truncate">
                בחר ארוחה מותאמת וסמן ב-✓ להוספה מיידית לערכי היום
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold text-xs border border-purple-500/30 flex items-center justify-center gap-1.5 shrink-0 transition-colors"
          >
            <Plus className="w-4 h-4" /> הוסף ארוחה קבועה לתפריט שלי
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
            placeholder="חפש ארוחה בתפריט שלי..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl glass-input text-xs font-bold focus:border-purple-400"
          />
        </div>
      </section>

      {/* Preset Meals List Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredMeals.map((meal) => {
          const timesAdded = addedMealIds[meal.id] || 0;
          return (
            <motion.div
              key={meal.id}
              whileHover={{ scale: 1.01 }}
              className={`p-4 rounded-2xl glass-panel border transition-all flex flex-col justify-between space-y-3 ${
                timesAdded > 0 ? 'border-emerald-500/50 bg-emerald-950/20' : 'border-slate-800/80 bg-slate-900/60'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-800 text-slate-300">
                    {categoryLabels[meal.category] || 'ארוחה'}
                  </span>
                  <span className="text-xs font-black text-emerald-400">{meal.total_calories} קל'</span>
                </div>
                <h3 className="text-sm font-extrabold text-white leading-snug">{meal.food_name}</h3>
                {meal.explanation && (
                  <p className="text-xs text-slate-400 leading-relaxed">{meal.explanation}</p>
                )}
              </div>

              {/* Macro Bar Badges & V Button */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 text-[11px] font-bold text-slate-300">
                  <span className="text-indigo-400">{meal.protein_g}ג' חלבון</span>
                  <span className="text-amber-400">{meal.carbs_g}ג' פחמימה</span>
                  <span className="text-rose-400">{meal.fats_g}ג' שומן</span>
                  <span className="text-slate-500">({meal.weight_grams}ג')</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleEatMeal(meal)}
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

      {/* Add Custom Preset Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 text-white border border-slate-700 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-purple-400" /> הוספת ארוחה קבועה לתפריט שלי
            </h3>

            <form onSubmit={handleSaveCustomPreset} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">שם הארוחה</label>
                <input
                  type="text"
                  placeholder="למשל: סלט חזה עוף ואבוקדו"
                  value={newPresetForm.food_name}
                  onChange={(e) => setNewPresetForm({ ...newPresetForm, food_name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">קטגוריה</label>
                  <select
                    value={newPresetForm.category}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 text-xs font-bold text-white border border-slate-800"
                  >
                    <option value="breakfast">ארוחת בוקר</option>
                    <option value="lunch">ארוחת צהריים</option>
                    <option value="dinner">ארוחת ערב</option>
                    <option value="snack">נשנוש / ביניים</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">משקל (גרם/מ"ל)</label>
                  <input
                    type="number"
                    value={newPresetForm.weight_grams}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, weight_grams: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-xs font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">קלוריות</label>
                  <input
                    type="number"
                    value={newPresetForm.total_calories}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, total_calories: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-emerald-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">חלבון</label>
                  <input
                    type="number"
                    value={newPresetForm.protein_g}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, protein_g: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-indigo-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">פחמימות</label>
                  <input
                    type="number"
                    value={newPresetForm.carbs_g}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, carbs_g: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">שומנים</label>
                  <input
                    type="number"
                    value={newPresetForm.fats_g}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, fats_g: e.target.value })}
                    className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-rose-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white text-xs font-bold"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md"
                >
                  שמור לתפריט שלי
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
