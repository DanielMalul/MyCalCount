import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChefHat, Check, Plus, Search, Utensils, Dumbbell, Sparkles, Flame, Wheat, PieChart, Star, CheckCircle2, Wand2, AlertCircle } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { analyzeMealText } from '../services/geminiService';

export const PRESET_MEALS_DATABASE = {
  cut: [
    // Breakfast (3 options)
    { id: 'cut_b1', category: 'breakfast', food_name: 'חביתת 3 ביצים עם תרד וגבינה בולגרית 5%', weight_grams: 220, total_calories: 280, protein_g: 26, carbs_g: 3, fats_g: 18, explanation: 'אופציה 1: חלבון גבוה ודל פחמימה לחיטוב ושריפת שומן' },
    { id: 'cut_b2', category: 'breakfast', food_name: 'שיבולת שועל עם חלב דל שומן, סקופ חלבון ופירות יער', weight_grams: 300, total_calories: 340, protein_g: 32, carbs_g: 40, fats_g: 5, explanation: 'אופציה 2: ארוחת בוקר משביעה ועשירה בסיבים תזונתיים וחלבון' },
    { id: 'cut_b3', category: 'breakfast', food_name: 'יוגורט פרו 20ג\' חלבון עם כפית חמאת בוטנים טבעית וחצי תפוח', weight_grams: 250, total_calories: 230, protein_g: 22, carbs_g: 18, fats_g: 7, explanation: 'אופציה 3: ארוחת בוקר קלה ומהירה להכנה' },

    // Lunch (3 options)
    { id: 'cut_l1', category: 'lunch', food_name: 'חזה עוף בגריל (200ג\') עם 150ג\' אורז בסמטי וסלט ירקות עשיר', weight_grams: 450, total_calories: 450, protein_g: 52, carbs_g: 42, fats_g: 6, explanation: 'אופציה 1: ארוחת צהריים קלאסית לחיטוב איכותי' },
    { id: 'cut_l2', category: 'lunch', food_name: 'פילה סלומון בתנור (180ג\') עם בטטה אפויה ופרחי ברוקולי', weight_grams: 400, total_calories: 490, protein_g: 42, carbs_g: 30, fats_g: 22, explanation: 'אופציה 2: אומגה 3, שומנים בריאים וחלבון איכותי' },
    { id: 'cut_l3', category: 'lunch', food_name: 'קופסת טונה במים עם קינואה מבושלת, מלפפון, עגבניה וכפית שמן זית', weight_grams: 350, total_calories: 380, protein_g: 38, carbs_g: 35, fats_g: 10, explanation: 'אופציה 3: סלט טונה וקינואה קל, משביע ומהיר' },

    // Dinner (3 options)
    { id: 'cut_d1', category: 'dinner', food_name: 'סלט עוף גדול: חזה עוף (180ג\') עלי בייבי, עגבניות שרי וכף טחינה', weight_grams: 400, total_calories: 360, protein_g: 46, carbs_g: 12, fats_g: 14, explanation: 'אופציה 1: ארוחת ערב קלה עם חלבון גבוה ודלת פחמימות' },
    { id: 'cut_d2', category: 'dinner', food_name: 'שקשוקה בייתית מ-2 ביצים + 100ג\' גבינה לבנה 3% ולחם קל (2 פרוסות)', weight_grams: 350, total_calories: 350, protein_g: 28, carbs_g: 24, fats_g: 15, explanation: 'אופציה 2: ארוחת ערב ישראלית משביעה ומאוזנת' },
    { id: 'cut_d3', category: 'dinner', food_name: 'פילה דג דניס בתנור (200ג\') עם ירקות ירוקים מוקפצים בשמן זית', weight_grams: 380, total_calories: 370, protein_g: 40, carbs_g: 10, fats_g: 18, explanation: 'אופציה 3: ארוחת ערב קלה לעיכול ועתירת חלבון' },

    // Snacks (3 options)
    { id: 'cut_s1', category: 'snack', food_name: 'עוגיות פריכיות אורז (3 יח\') עם מעט גבינה לבנה 5% ופרוסות מלפפון', weight_grams: 120, total_calories: 130, protein_g: 7, carbs_g: 20, fats_g: 2, explanation: 'אופציה 1: נשנוש קל בין ארוחות' },
    { id: 'cut_s2', category: 'snack', food_name: 'חטיף חלבון (60ג\') 20ג\' חלבון', weight_grams: 60, total_calories: 210, protein_g: 20, carbs_g: 22, fats_g: 7, explanation: 'אופציה 2: פתרון מתוק וזמין לחלבון' },
    { id: 'cut_s3', category: 'snack', food_name: 'פרוסת לחם קל עם פרוסת גבינה צהובה 9% ועגבניה', weight_grams: 80, total_calories: 120, protein_g: 9, carbs_g: 12, fats_g: 3, explanation: 'אופציה 3: נשנוש מהיר, דל קלוריות וטעים' }
  ],
  bulk: [
    // Breakfast (3 options)
    { id: 'bulk_b1', category: 'breakfast', food_name: 'שייק מסה עשיר: 2 כוסות חלב, 2 סקופ חלבון, 80ג\' שיבולת שועל וכף חמאת בוטנים', weight_grams: 550, total_calories: 780, protein_g: 62, carbs_g: 80, fats_g: 22, explanation: 'אופציה 1: פצצת קלוריות וחלבון לעלייה במסת שריר' },
    { id: 'bulk_b2', category: 'breakfast', food_name: 'חביתה מ-4 ביצים עם 2 פרוסות לחם מלא, אבוקדו שלם וגבינה צהובה', weight_grams: 400, total_calories: 650, protein_g: 36, carbs_g: 38, fats_g: 38, explanation: 'אופציה 2: ארוחת בוקר עשירה בשומנים בריאים וחלבון' },
    { id: 'bulk_b3', category: 'breakfast', food_name: 'פנקייק חלבון: 2 ביצים, סקופ חלבון, 70ג\' שיבולת שועל, בננה וכף דבש', weight_grams: 350, total_calories: 620, protein_g: 45, carbs_g: 75, fats_g: 14, explanation: 'אופציה 3: פנקייק מפנק ועשיר בפחמימות מורכבות וחלבון' },

    // Lunch (3 options)
    { id: 'bulk_l1', category: 'lunch', food_name: 'המבורגר בקר נקי (250ג\') בלחמניה מקמח מלא עם תפוחי אדמה אפויים', weight_grams: 500, total_calories: 820, protein_g: 58, carbs_g: 75, fats_g: 32, explanation: 'אופציה 1: ארוחת צהריים מפנקת ועשירה בקלוריות לבניית שריר' },
    { id: 'bulk_l2', category: 'lunch', food_name: 'פרגיות בגריל (250ג\') עם 250ג\' פסטה ברוטב עגבניות ושמן זית', weight_grams: 550, total_calories: 890, protein_g: 64, carbs_g: 90, fats_g: 28, explanation: 'אופציה 2: עודף קלורי איכותי להתאוששות וגדילה' },
    { id: 'bulk_l3', category: 'lunch', food_name: 'חזה עוף מוקפץ בטריאקי (250ג\') עם נודלס מקמח מלא וירקות', weight_grams: 500, total_calories: 790, protein_g: 60, carbs_g: 85, fats_g: 20, explanation: 'אופציה 3: ארוחת מוקפץ עשירה בפחמימות זמינות וחלבון' },

    // Dinner (3 options)
    { id: 'bulk_d1', category: 'dinner', food_name: 'טורטיה מקמח מלא במילוי בשר טחון (200ג\'), שעועית אדומה, אורז וטחינה', weight_grams: 450, total_calories: 720, protein_g: 48, carbs_g: 70, fats_g: 26, explanation: 'אופציה 1: טורטיה מקסיקנית עשירה ומזינה' },
    { id: 'bulk_d2', category: 'dinner', food_name: 'סטייק סינטה עסיסי (250ג\') עם פירה תפוחי אדמה וסלט ירוק', weight_grams: 480, total_calories: 750, protein_g: 62, carbs_g: 50, fats_g: 30, explanation: 'אופציה 2: ארוחת ערב עשירה בברזל, קריאטין וחלבון' },
    { id: 'bulk_d3', category: 'dinner', food_name: 'פיצה חלבון ביתית: בסיס קמח מלא, 150ג\' עוף טחון, גבינה 15% וירקות', weight_grams: 420, total_calories: 680, protein_g: 55, carbs_g: 65, fats_g: 22, explanation: 'אופציה 3: פיצה עשירה בחלבון ללא רגשות אשם' },

    // Snacks (3 options)
    { id: 'bulk_s1', category: 'snack', food_name: 'חופן אגוזי מלך ושקדים (50ג\') + בננה גדולה', weight_grams: 170, total_calories: 420, protein_g: 10, carbs_g: 35, fats_g: 28, explanation: 'אופציה 1: נשנוש עתיר אנרגיה ושומן בריא' },
    { id: 'bulk_s2', category: 'snack', food_name: 'יוגורט יווני עשיר (200ג\') עם גרנולה, דבש ו-20ג\' שקדים', weight_grams: 280, total_calories: 440, protein_g: 24, carbs_g: 48, fats_g: 16, explanation: 'אופציה 2: נשנוש מתוק, עשיר בקלוריות וחלבון' },
    { id: 'bulk_s3', category: 'snack', food_name: '2 פרוסות לחם מלא עם 2 כפות חמאת בוטנים וסילאן טבעי', weight_grams: 150, total_calories: 460, protein_g: 16, carbs_g: 52, fats_g: 20, explanation: 'אופציה 3: כריך אנרגטי ומהיר להכנה' }
  ],
  recomp: [
    // Breakfast (3 options)
    { id: 'recomp_b1', category: 'breakfast', food_name: 'חביתה מ-2 ביצים + חלבונים עם פרוסת לחם דגנים ואבוקדו (חצי)', weight_grams: 250, total_calories: 360, protein_g: 22, carbs_g: 20, fats_g: 20, explanation: 'אופציה 1: מאוזן באופן מושלם לריקומפ' },
    { id: 'recomp_b2', category: 'breakfast', food_name: 'שיבולת שועל (50ג\') עם כוס חלב, סקופ חלבון וקורט קינמון', weight_grams: 320, total_calories: 390, protein_g: 32, carbs_g: 45, fats_g: 8, explanation: 'אופציה 2: ארוחת בוקר מאוזנת לשמירה על מסת שריר' },
    { id: 'recomp_b3', category: 'breakfast', food_name: 'יוגורט עיזים/יווני (200ג\') עם פירות העונה וכף זרעי צ\'יה', weight_grams: 260, total_calories: 310, protein_g: 20, carbs_g: 28, fats_g: 11, explanation: 'אופציה 3: פרוביוטיקה, סיבים וחלבון מזין' },

    // Lunch (3 options)
    { id: 'recomp_l1', category: 'lunch', food_name: 'חזה עוף (200ג\') עם בטטה אפויה בתנור (200ג\') וירקות ירוקים', weight_grams: 450, total_calories: 520, protein_g: 48, carbs_g: 48, fats_g: 12, explanation: 'אופציה 1: איזון מדויק לפחמימה, חלבון ושומן' },
    { id: 'recomp_l2', category: 'lunch', food_name: 'פילה סלומון אפוי (200ג\') עם כוס אורז מלא וסלט קצוץ', weight_grams: 430, total_calories: 560, protein_g: 44, carbs_g: 40, fats_g: 24, explanation: 'אופציה 2: שומנים איכותיים מאומגה 3 ופחמימה מורכבת' },
    { id: 'recomp_l3', category: 'lunch', food_name: 'חזה הודו שווארמה ביתי (200ג\') בצלחת עם כוס בורגול וטחינה', weight_grams: 420, total_calories: 540, protein_g: 50, carbs_g: 42, fats_g: 18, explanation: 'אופציה 3: ארוחה עשירה בברזל וחלבון רזה' },

    // Dinner (3 options)
    { id: 'recomp_d1', category: 'dinner', food_name: 'סלט טונה עם ביצה קשה, תירס, מלפפון חמוץ וכף מיונז לייט', weight_grams: 350, total_calories: 420, protein_g: 38, carbs_g: 18, fats_g: 20, explanation: 'אופציה 1: ארוחת ערב טעימה ומשביעה' },
    { id: 'recomp_d2', category: 'dinner', food_name: 'שקשוקה טופו / ביצים מ-2 ביצים, גבינה צהובה 9% וסלט קצוץ', weight_grams: 380, total_calories: 410, protein_g: 30, carbs_g: 16, fats_g: 24, explanation: 'אופציה 2: ארוחת ערב קלה לעיכול וטעימה' },
    { id: 'recomp_d3', category: 'dinner', food_name: 'כריך חזה עוף/טונה בלחם קל עם ממרח אבוקדו וירקות חתוכים', weight_grams: 300, total_calories: 380, protein_g: 36, carbs_g: 30, fats_g: 12, explanation: 'אופציה 3: כריך ערב קליל ומשביע' },

    // Snacks (3 options)
    { id: 'recomp_s1', category: 'snack', food_name: 'חטיף חלבון 20ג\' חלבון + תפוח עץ ירוק', weight_grams: 180, total_calories: 260, protein_g: 21, carbs_g: 32, fats_g: 6, explanation: 'אופציה 1: נשנוש מאוזן בין ארוחות' },
    { id: 'recomp_s2', category: 'snack', food_name: 'מעדן חלבון פרו 20ג\' עם 10 שקדים טבעיים', weight_grams: 220, total_calories: 240, protein_g: 22, carbs_g: 15, fats_g: 9, explanation: 'אופציה 2: נשנוש קל דל פחמימה ועשיר בחלבון' },
    { id: 'recomp_s3', category: 'snack', food_name: '2 פריכיות דגנים עם כף חמאת בוטנים ופרוסות בננה', weight_grams: 100, total_calories: 250, protein_g: 8, carbs_g: 32, fats_g: 10, explanation: 'אופציה 3: אנרגיה זמינה לפני אימון' }
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
  const [isCalculatingAi, setIsCalculatingAi] = useState(false);
  const [calcError, setCalcError] = useState('');
  const [showManualFields, setShowManualFields] = useState(false);

  const [newPresetForm, setNewPresetForm] = useState({
    food_name: '',
    category: 'lunch',
    weight_grams: 200,
    total_calories: '',
    protein_g: '',
    carbs_g: '',
    fats_g: '',
    explanation: ''
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

  const handleSaveCustomPreset = async (e) => {
    e.preventDefault();
    if (!newPresetForm.food_name.trim()) return;

    const requestedWeight = Number(newPresetForm.weight_grams) > 0 ? Number(newPresetForm.weight_grams) : 200;

    // If user filled manual values, save directly:
    if (showManualFields && newPresetForm.total_calories) {
      const newPreset = {
        id: 'custom_preset_' + Date.now(),
        category: newPresetForm.category,
        food_name: newPresetForm.food_name.trim(),
        weight_grams: requestedWeight,
        total_calories: Number(newPresetForm.total_calories) || 0,
        protein_g: Number(newPresetForm.protein_g) || 0,
        carbs_g: Number(newPresetForm.carbs_g) || 0,
        fats_g: Number(newPresetForm.fats_g) || 0,
        explanation: newPresetForm.explanation || `ארוחה מותאמת אישית בתפריט שלי (${requestedWeight}ג')`
      };

      setCustomPresets([newPreset, ...customPresets]);
      setIsAddModalOpen(false);
      setNewPresetForm({ food_name: '', category: 'lunch', weight_grams: 200, total_calories: '', protein_g: '', carbs_g: '', fats_g: '', explanation: '' });
      setShowManualFields(false);
      return;
    }

    // Otherwise: Automatic calculation with Gemini AI!
    setIsCalculatingAi(true);
    setCalcError('');

    try {
      const res = await analyzeMealText(newPresetForm.food_name.trim(), requestedWeight);

      const newPreset = {
        id: 'custom_preset_' + Date.now(),
        category: newPresetForm.category,
        food_name: res.food_name || newPresetForm.food_name.trim(),
        weight_grams: requestedWeight,
        total_calories: res.total_calories || 0,
        protein_g: res.protein_g || 0,
        carbs_g: res.carbs_g || 0,
        fats_g: res.fats_g || 0,
        explanation: res.explanation || `חישוב אוטומטי מ-Gemini AI (${requestedWeight}ג')`
      };

      setCustomPresets([newPreset, ...customPresets]);
      setIsAddModalOpen(false);
      setNewPresetForm({ food_name: '', category: 'lunch', weight_grams: 200, total_calories: '', protein_g: '', carbs_g: '', fats_g: '', explanation: '' });
      setShowManualFields(false);
    } catch (err) {
      console.error(err);
      setCalcError(err.message || 'חישוב הקלוריות ב-AI נכשל. נסה שנית או הזן ידנית.');
      setShowManualFields(true);
    } finally {
      setIsCalculatingAi(false);
    }
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
            onClick={() => {
              setCalcError('');
              setIsAddModalOpen(true);
            }}
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

      {/* Add Custom Preset Modal with Automatic AI Calculation */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="w-full max-w-md glass-panel rounded-3xl p-6 text-white border border-slate-700 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-400 animate-pulse" /> הוספת ארוחה קבועה (חישוב AI אוטומטי)
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs flex items-center gap-2">
              <Sparkles className="w-4 h-4 shrink-0 text-purple-400" />
              <span>הזן רק שם ומשקל - Gemini AI יחשב עבורך אוטומטית את כל הקלוריות והמאקרו!</span>
            </div>

            <form onSubmit={handleSaveCustomPreset} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">שם המאכל / הארוחה</label>
                <input
                  type="text"
                  placeholder="למשל: שקשוקה 2 ביצים עם לחם קל"
                  value={newPresetForm.food_name}
                  onChange={(e) => setNewPresetForm({ ...newPresetForm, food_name: e.target.value })}
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
                    value={newPresetForm.weight_grams}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, weight_grams: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold focus:border-purple-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">קטגוריה בתפריט</label>
                  <select
                    value={newPresetForm.category}
                    onChange={(e) => setNewPresetForm({ ...newPresetForm, category: e.target.value })}
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
                      value={newPresetForm.total_calories}
                      onChange={(e) => setNewPresetForm({ ...newPresetForm, total_calories: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">חלבון</label>
                    <input
                      type="number"
                      placeholder="30"
                      value={newPresetForm.protein_g}
                      onChange={(e) => setNewPresetForm({ ...newPresetForm, protein_g: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">פחמימות</label>
                    <input
                      type="number"
                      placeholder="25"
                      value={newPresetForm.carbs_g}
                      onChange={(e) => setNewPresetForm({ ...newPresetForm, carbs_g: e.target.value })}
                      className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-center font-bold text-amber-400"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-400 mb-1">שומנים</label>
                    <input
                      type="number"
                      placeholder="10"
                      value={newPresetForm.fats_g}
                      onChange={(e) => setNewPresetForm({ ...newPresetForm, fats_g: e.target.value })}
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
                      <span>Gemini AI מחשב קלוריות וערכים...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-purple-200" />
                      <span>חשב ב-AI ושמור לתפריט שלי</span>
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
