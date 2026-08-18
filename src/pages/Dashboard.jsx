import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Plus,
  Flame,
  Dumbbell,
  Wheat,
  PieChart,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Target
} from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import Navbar from '../components/Navbar';
import CircularProgress from '../components/CircularProgress';
import MacroProgressBar from '../components/MacroProgressBar';
import StepTrackerWidget from '../components/StepTrackerWidget';
import WaterTrackerWidget from '../components/WaterTrackerWidget';
import MealScannerModal from '../components/MealScannerModal';
import MealLogItem from '../components/MealLogItem';
import OnboardingModal from '../components/OnboardingModal';
import AuthModal from '../components/AuthModal';
import BottomNav from '../components/BottomNav';

export default function Dashboard() {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const onboardingCompleted = useFitnessStore((state) => state.onboardingCompleted);
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const loggedMeals = useFitnessStore((state) => state.loggedMeals);
  const user = useFitnessStore((state) => state.user);
  const getDailyTotals = useFitnessStore((state) => state.getDailyTotals);

  // Modal open states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Auto trigger onboarding if not completed yet
  useEffect(() => {
    if (!onboardingCompleted) {
      setIsOnboardingOpen(true);
    }
  }, [onboardingCompleted]);

  const dailyTotals = getDailyTotals();

  // Filter logged meals for selected date
  const filteredMeals = loggedMeals.filter((m) => m.date === selectedDate);

  const goalLabels = {
    cut: { label: 'חיטוב (ירידה בשומן)', icon: TrendingDown, color: 'text-rose-400' },
    bulk: { label: 'מסה (עלייה בשריר)', icon: TrendingUp, color: 'text-emerald-400' },
    recomp: { label: 'שמירה על משקל', icon: Target, color: 'text-indigo-400' }
  };

  const currentGoalObj = goalLabels[userProfile.goal] || goalLabels.cut;
  const GoalIcon = currentGoalObj.icon;

  return (
    <div className="min-h-screen pb-28 md:pb-24 text-slate-100 selection:bg-emerald-500 selection:text-black">
      {/* Background Ambient Lights */}
      <div className="fixed top-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 left-10 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Header / Navbar */}
      <Navbar
        onOpenProfileModal={() => setIsOnboardingOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
      />

      <main className="max-w-5xl mx-auto px-3.5 sm:px-6 pt-4 sm:pt-6 space-y-4 sm:space-y-6">
        
        {/* User Target & Metric Banner */}
        <section className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800/60 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5 space-x-reverse w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
              <GoalIcon className={`w-6 h-6 ${currentGoalObj.color}`} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">מטרת התזונה</span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {currentGoalObj.label}
                </span>
                {user && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    סנכרון ענן
                  </span>
                )}
              </div>
              <p className="text-sm sm:text-base font-extrabold text-white mt-0.5">
                {userProfile.currentWeightKg} ק"ג <span className="text-slate-400 text-xs font-normal">נוכחי</span> ←{' '}
                <span className="text-emerald-400">{userProfile.targetWeightKg} ק"ג</span> <span className="text-slate-400 text-xs font-normal">משקל יעד</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 space-x-reverse text-xs text-slate-300 bg-slate-900/60 px-3.5 py-2.5 rounded-2xl border border-slate-800 w-full md:w-auto justify-between md:justify-start">
            <div className="text-center md:text-right">
              <span className="text-slate-400 text-[10px] block">BMR</span>
              <span className="font-bold text-slate-200">{dailyTargets.bmr} קל'</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center md:text-right">
              <span className="text-slate-400 text-[10px] block">TDEE</span>
              <span className="font-bold text-slate-200">{dailyTargets.tdee} קל'</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center md:text-right">
              <span className="text-slate-400 text-[10px] block">יעד קלוריות</span>
              <span className="font-extrabold text-emerald-400">{dailyTargets.targetCalories} קל'</span>
            </div>
          </div>
        </section>

        {/* Core Progress Grid: Circular Calorie Ring & Macro Bars */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6">
          <div className="md:col-span-5 flex flex-col">
            <CircularProgress
              consumed={dailyTotals.calories}
              target={dailyTargets.targetCalories}
              bmr={dailyTargets.bmr}
              tdee={dailyTargets.tdee}
            />
          </div>

          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            <MacroProgressBar
              label="חלבון"
              consumed={dailyTotals.protein}
              target={dailyTargets.proteinGrams}
              color="purple"
              icon={Dumbbell}
            />
            <MacroProgressBar
              label="פחמימות"
              consumed={dailyTotals.carbs}
              target={dailyTargets.carbGrams}
              color="amber"
              icon={Wheat}
            />
            <MacroProgressBar
              label="שומנים"
              consumed={dailyTotals.fats}
              target={dailyTargets.fatGrams}
              color="pink"
              icon={PieChart}
            />
          </div>
        </section>

        {/* AI Scanner Hero Banner */}
        <section className="glass-panel p-5 sm:p-6 rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/20 shadow-xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 text-center sm:text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> סורק ארוחות חכם
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white">הוסף ארוחה בצילום תמונה או הזנה ידנית</h2>
              <p className="text-xs text-slate-300 max-w-md">
                צלם את האוכל בצלחת או הכנס משקל בגרמים לקבלת חישוב קלוריות, חלבונים, פחמימות ושומנים בשניות.
              </p>
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 shrink-0"
            >
              <Camera className="w-5 h-5" /> סרוק ארוחה עכשיו
            </button>
          </div>
        </section>

        {/* Widgets Row: Step Tracker & Water Tracker */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <StepTrackerWidget />
          <WaterTrackerWidget />
        </section>

        {/* Meals Logged Timeline Section */}
        <section className="glass-panel p-4 sm:p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-emerald-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">יומן ארוחות להיום</h3>
                <p className="text-xs text-slate-400">
                  {filteredMeals.length} ארוחות נרשמו להיום
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-emerald-400 text-xs font-bold border border-slate-700/80 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> הוסף ארוחה
            </button>
          </div>

          {/* Logged Meal Cards List */}
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredMeals.length > 0 ? (
                filteredMeals.map((meal) => <MealLogItem key={meal.id} meal={meal} />)
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-8 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3"
                >
                  <Camera className="w-10 h-10 mx-auto text-slate-600" />
                  <p className="text-sm font-semibold text-slate-400">טרם נרשמו ארוחות לתאריך זה</p>
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> סרוק ארוחה ראשונה
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>

      {/* Floating Desktop Camera Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsScannerOpen(true)}
        className="hidden md:flex fixed bottom-6 left-6 z-40 p-4 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-500 text-white shadow-xl border border-white/20 items-center justify-center"
        title="הוסף ארוחה"
      >
        <Camera className="w-6 h-6" />
      </motion.button>

      {/* Native Mobile Bottom Navigation Bar */}
      <BottomNav
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenProfile={() => setIsOnboardingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Modals */}
      <MealScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}
