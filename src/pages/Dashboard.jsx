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
  Target,
  AlertTriangle,
  Edit3,
  Check,
  RotateCcw,
  ChefHat,
  Wand2,
  ChevronLeft,
  Bot
} from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import Navbar from '../components/Navbar';
import CircularProgress from '../components/CircularProgress';
import MacroProgressBar from '../components/MacroProgressBar';
import StepTrackerWidget from '../components/StepTrackerWidget';
import WaterTrackerWidget from '../components/WaterTrackerWidget';
import MealScannerModal from '../components/MealScannerModal';
import MealPlanModal from '../components/MealPlanModal';
import MealLogItem from '../components/MealLogItem';
import OnboardingModal from '../components/OnboardingModal';
import AuthModal from '../components/AuthModal';
import BottomNav from '../components/BottomNav';
import MyMealPlanPage from '../components/MyMealPlanPage';
import MealHistoryPage from '../components/MealHistoryPage';
import FitnessAvatarWidget from '../components/FitnessAvatarWidget';
import AiCoachModal from '../components/AiCoachModal';

export default function Dashboard() {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const onboardingCompleted = useFitnessStore((state) => state.onboardingCompleted);
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const loggedMeals = useFitnessStore((state) => state.loggedMeals);
  const user = useFitnessStore((state) => state.user);
  const getDailyTotals = useFitnessStore((state) => state.getDailyTotals);
  const updateProfile = useFitnessStore((state) => state.updateProfile);

  // Tab Navigation State: 'dashboard' | 'menu' | 'history'
  const [activeTab, setActiveTab] = useState('dashboard');

  // Modal open states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isMealPlanOpen, setIsMealPlanOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAiCoachOpen, setIsAiCoachOpen] = useState(false);

  // Inline calorie target editing state
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [customCalInput, setCustomCalInput] = useState('');

  const handleSaveCustomTarget = (e) => {
    if (e) e.preventDefault();
    const val = Number(customCalInput);
    if (val > 0) {
      updateProfile({ customTargetCalories: val });
    }
    setIsEditingTarget(false);
  };

  const handleResetCustomTarget = () => {
    updateProfile({ customTargetCalories: null });
    setIsEditingTarget(false);
  };

  // STRICT ORDER FLOW:
  // 1. If user is NOT logged in, show AuthModal FIRST.
  // 2. If user IS logged in but HAS NOT completed onboarding, show OnboardingModal.
  useEffect(() => {
    if (!user) {
      setIsAuthOpen(true);
      setIsOnboardingOpen(false);
    } else if (!onboardingCompleted) {
      setIsAuthOpen(false);
      setIsOnboardingOpen(true);
    }
  }, [user, onboardingCompleted]);

  const dailyTotals = getDailyTotals();
  const filteredMeals = loggedMeals.filter((m) => m.date === selectedDate);

  const goalLabels = {
    cut: { label: 'חיטוב (ירידה בשומן)', icon: TrendingDown, color: 'text-rose-400' },
    bulk: { label: 'מסה (עלייה במסת שריר)', icon: TrendingUp, color: 'text-emerald-400' },
    recomp: { label: 'שמירה על משקל', icon: Target, color: 'text-indigo-400' }
  };

  const currentGoalObj = goalLabels[userProfile.goal] || goalLabels.cut;
  const GoalIcon = currentGoalObj.icon;

  return (
    <div className="min-h-screen pb-28 md:pb-24 text-slate-100 selection:bg-emerald-500 selection:text-black overflow-x-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 left-10 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Header */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenProfileModal={() => setIsOnboardingOpen(true)}
        onOpenAuthModal={() => setIsAuthOpen(true)}
      />

      <main className="max-w-5xl mx-auto px-3 sm:px-6 pt-3 sm:pt-6 space-y-4 sm:space-y-6">
        
        {/* Guest Mode Cloud Sync Warning Banner */}
        {!user && (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col sm:flex-row items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>אינך מחובר לחשבון. הארוחות נשמרות במכשיר זה בלבד. התחבר לחשבון עם אותו אימייל במחשב ובטלפון כדי לסנכרן בלייב!</span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs shrink-0 border border-amber-500/30 transition-colors"
            >
              התחברות לחשבון
            </button>
          </div>
        )}

        {/* TAB 1: MAIN DASHBOARD */}
        {activeTab === 'dashboard' && (
          <>
            {/* Gamified Avatar & XP Level Widget */}
            <FitnessAvatarWidget onOpenCoach={() => setIsAiCoachOpen(true)} />

            {/* User Target & Metric Banner */}
            <section className="glass-panel p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800/60 shadow-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 space-x-reverse min-w-0">
                  <div className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 text-emerald-400 shrink-0">
                    <GoalIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${currentGoalObj.color}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">מטרת התזונה</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {currentGoalObj.label}
                      </span>
                    </div>
                    <p className="text-sm sm:text-base font-extrabold text-white mt-0.5 truncate">
                      {userProfile.currentWeightKg} ק"ג <span className="text-slate-400 text-xs font-normal">נוכחי</span> ←{' '}
                      <span className="text-emerald-400">{userProfile.targetWeightKg} ק"ג</span> <span className="text-slate-400 text-xs font-normal">יעד</span>
                    </p>
                  </div>
                </div>

                {/* BMR / TDEE Grid */}
                <div className="grid grid-cols-3 gap-1.5 sm:gap-3 text-center bg-slate-900/60 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border border-slate-800 w-full sm:w-auto">
                  <div className="px-1">
                    <span className="text-slate-400 text-[10px] block">BMR</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-200">{dailyTargets.bmr} קל'</span>
                  </div>
                  <div className="px-1 border-r border-l border-slate-800">
                    <span className="text-slate-400 text-[10px] block">TDEE</span>
                    <span className="font-bold text-xs sm:text-sm text-slate-200">{dailyTargets.tdee} קל'</span>
                  </div>
                  <div className="px-1 relative">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-slate-400 text-[10px] block">יעד קלוריות</span>
                      <button
                        onClick={() => {
                          setCustomCalInput(userProfile.customTargetCalories || dailyTargets.targetCalories);
                          setIsEditingTarget(!isEditingTarget);
                        }}
                        className="text-slate-400 hover:text-emerald-400 transition-colors p-0.5"
                        title="ערוך יעד קלוריות ידנית"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-400" />
                      </button>
                    </div>
                    {isEditingTarget ? (
                      <form onSubmit={handleSaveCustomTarget} className="flex items-center gap-1 mt-0.5 justify-center">
                        <input
                          type="number"
                          min="500"
                          max="10000"
                          value={customCalInput}
                          onChange={(e) => setCustomCalInput(e.target.value)}
                          className="w-16 px-1 py-0.5 rounded bg-slate-800 text-center font-extrabold text-xs text-emerald-400 border border-emerald-500/50 focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="p-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/40 text-[10px] font-bold"
                          title="שמור יעד"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        {userProfile.customTargetCalories && (
                          <button
                            type="button"
                            onClick={handleResetCustomTarget}
                            className="p-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400 text-[10px]"
                            title="חזור לחישוב אוטומטי"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                        )}
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCustomCalInput(userProfile.customTargetCalories || dailyTargets.targetCalories);
                          setIsEditingTarget(true);
                        }}
                        className="font-extrabold text-xs sm:text-sm text-emerald-400 hover:underline flex items-center justify-center gap-0.5 mx-auto"
                        title="לחץ לעריכת יעד קלוריות"
                      >
                        <span>{dailyTargets.targetCalories} קל'</span>
                        {userProfile.customTargetCalories && (
                          <span className="text-[9px] font-normal text-amber-400" title="יעד הוגדר ידנית">(ידני)</span>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Core Progress Grid */}
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

            {/* AI Scanner & Meal Plan Hero Banner */}
            <section className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800/80 bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/20 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
                <div className="space-y-1 text-center sm:text-right">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> סורק ארוחות ומנטור AI
                  </div>
                  <h2 className="text-base sm:text-xl font-bold text-white">סרוק ארוחה או התייעץ עם מאמן התזונה AI</h2>
                  <p className="text-xs text-slate-300 max-w-md">
                    צלם ארוחה לניתוח קלוריות, חולל 3 אופציות לכל ארוחה, או התייעץ בזמן אמת עם מאמן התזונה האישי.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <button
                    onClick={() => setIsAiCoachOpen(true)}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-extrabold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-purple-200" /> מאמן AI (24/7)
                  </button>
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="w-full sm:w-auto px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-extrabold text-xs sm:text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4 sm:w-5 sm:h-5" /> סרוק ארוחה
                  </button>
                </div>
              </div>
            </section>

            {/* Widgets Row */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <StepTrackerWidget />
              <WaterTrackerWidget />
            </section>

            {/* Quick Teaser Link to Meal History */}
            <section className="glass-panel p-4 rounded-2xl border border-slate-800/80 shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">ארוחות להיום ({filteredMeals.length})</h3>
                  <p className="text-xs text-slate-400">צפה ונהל את כל הארוחות ביומן הנפרד</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('history')}
                className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/20 transition-all flex items-center gap-1 shrink-0"
              >
                <span>לצפייה ביומן המלא</span>
                <ChevronLeft className="w-4 h-4" />
              </button>
            </section>
          </>
        )}

        {/* TAB 2: MY MEAL PLAN PRESET LIBRARY */}
        {activeTab === 'menu' && (
          <MyMealPlanPage />
        )}

        {/* TAB 3: MEAL HISTORY LOG */}
        {activeTab === 'history' && (
          <MealHistoryPage onOpenScanner={() => setIsScannerOpen(true)} />
        )}

      </main>

      {/* Floating AI Coach Floating Button */}
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsAiCoachOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 px-4 py-3 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-teal-500 text-white shadow-2xl border border-white/20 flex items-center gap-2 text-xs font-extrabold"
        title="מנטור התזונה שלי AI"
      >
        <Bot className="w-5 h-5 text-purple-200 animate-pulse" />
        <span className="hidden xs:inline">מנטור AI</span>
      </motion.button>

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
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenProfile={() => setIsOnboardingOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

      {/* Modals */}
      <MealScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
      />
      <MealPlanModal
        isOpen={isMealPlanOpen}
        onClose={() => setIsMealPlanOpen(false)}
      />
      <AiCoachModal
        isOpen={isAiCoachOpen}
        onClose={() => setIsAiCoachOpen(false)}
      />
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </div>
  );
}


