import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Plus,
  Flame,
  Dumbbell,
  Wheat,
  PieChart,
  Calendar,
  Sparkles,
  Info,
  ChevronRight,
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
import ApiKeyModal from '../components/ApiKeyModal';

export default function Dashboard() {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const onboardingCompleted = useFitnessStore((state) => state.onboardingCompleted);
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const loggedMeals = useFitnessStore((state) => state.loggedMeals);
  const getDailyTotals = useFitnessStore((state) => state.getDailyTotals);

  // Modal open states
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isApiKeyOpen, setIsApiKeyOpen] = useState(false);

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
    cut: { label: 'Fat Loss (Cut)', icon: TrendingDown, color: 'text-pink-400' },
    bulk: { label: 'Muscle Gain (Bulk)', icon: TrendingUp, color: 'text-cyan-400' },
    recomp: { label: 'Recomp / Maintain', icon: Target, color: 'text-purple-400' }
  };

  const currentGoalObj = goalLabels[userProfile.goal] || goalLabels.cut;
  const GoalIcon = currentGoalObj.icon;

  return (
    <div className="min-h-screen pb-24 text-slate-100 selection:bg-cyan-500 selection:text-black">
      {/* Background Decorative Ambient Lights */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-1/3 right-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 left-1/3 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

      {/* Main Header / Navbar */}
      <Navbar
        onOpenApiKeyModal={() => setIsApiKeyOpen(true)}
        onOpenProfileModal={() => setIsOnboardingOpen(true)}
      />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        
        {/* User Target & Metric Banner */}
        <section className="glass-panel p-5 rounded-3xl border border-slate-800/80 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-4 w-full md:w-auto">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/80 text-cyan-400 shrink-0">
              <GoalIcon className={`w-6 h-6 ${currentGoalObj.color}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Plan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  {currentGoalObj.label}
                </span>
              </div>
              <p className="text-base font-extrabold text-white mt-0.5">
                {userProfile.currentWeightKg} kg <span className="text-slate-400 text-xs font-normal">current</span> →{' '}
                <span className="text-cyan-300">{userProfile.targetWeightKg} kg</span> <span className="text-slate-400 text-xs font-normal">target</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 text-xs text-slate-300 bg-slate-900/60 px-4 py-2.5 rounded-2xl border border-slate-800 w-full md:w-auto justify-between md:justify-start">
            <div className="text-center md:text-left">
              <span className="text-slate-400 text-[10px] block">BMR</span>
              <span className="font-bold text-slate-200">{dailyTargets.bmr} kcal</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center md:text-left">
              <span className="text-slate-400 text-[10px] block">TDEE</span>
              <span className="font-bold text-slate-200">{dailyTargets.tdee} kcal</span>
            </div>
            <div className="h-6 w-px bg-slate-800" />
            <div className="text-center md:text-left">
              <span className="text-slate-400 text-[10px] block">Target Goal</span>
              <span className="font-extrabold text-cyan-400">{dailyTargets.targetCalories} kcal</span>
            </div>
          </div>
        </section>

        {/* Core Progress Grid: Circular Calorie Ring & Macro Bars */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Calorie Circular Progress Ring */}
          <div className="md:col-span-5 flex flex-col">
            <CircularProgress
              consumed={dailyTotals.calories}
              target={dailyTargets.targetCalories}
              bmr={dailyTargets.bmr}
              tdee={dailyTargets.tdee}
            />
          </div>

          {/* Macro Progress Fills */}
          <div className="md:col-span-7 flex flex-col justify-between space-y-3">
            <MacroProgressBar
              label="Protein"
              consumed={dailyTotals.protein}
              target={dailyTargets.proteinGrams}
              color="purple"
              icon={Dumbbell}
            />
            <MacroProgressBar
              label="Carbohydrates"
              consumed={dailyTotals.carbs}
              target={dailyTargets.carbGrams}
              color="amber"
              icon={Wheat}
            />
            <MacroProgressBar
              label="Fats"
              consumed={dailyTotals.fats}
              target={dailyTargets.fatGrams}
              color="pink"
              icon={PieChart}
            />
          </div>
        </section>

        {/* AI Scanner Quick Hero Banner */}
        <section className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-900/60 to-purple-950/30 shadow-2xl relative overflow-hidden">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 text-center sm:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 mb-1">
                <Sparkles className="w-3.5 h-3.5" /> Instant AI Vision Analysis
              </div>
              <h2 className="text-xl font-extrabold text-white">Log Meals with Camera & Gemini AI</h2>
              <p className="text-xs text-slate-300 max-w-md">
                Snap a picture of your dish to automatically calculate grams, calories, protein, carbs, and fats in seconds.
              </p>
            </div>
            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-extrabold text-sm shadow-xl shadow-cyan-500/30 hover:scale-105 transition-all flex items-center gap-2 shrink-0"
            >
              <Camera className="w-5 h-5" /> Scan Meal Now
            </button>
          </div>
        </section>

        {/* Widgets Row: Step Tracker & Water Tracker */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StepTrackerWidget />
          <WaterTrackerWidget />
        </section>

        {/* Meals Logged Timeline Section */}
        <section className="glass-panel p-6 rounded-3xl border border-slate-800/80 shadow-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">Today's Meals</h3>
                <p className="text-xs text-slate-400">
                  {filteredMeals.length} {filteredMeals.length === 1 ? 'entry' : 'entries'} logged
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsScannerOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-bold border border-slate-700/80 flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" /> Add Meal
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
                  <p className="text-sm font-semibold text-slate-400">No meals logged for this date yet</p>
                  <button
                    onClick={() => setIsScannerOpen(true)}
                    className="px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-bold hover:bg-cyan-500/20 transition-all inline-flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Scan Your First Meal
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>

      </main>

      {/* Floating Camera Button for Quick Mobile Access */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsScannerOpen(true)}
        className="fixed bottom-6 right-6 z-40 p-4 rounded-full bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 text-white shadow-2xl shadow-cyan-500/40 border border-white/20 flex items-center justify-center"
        title="Quick AI Meal Scan"
      >
        <Camera className="w-7 h-7" />
      </motion.button>

      {/* Modals */}
      <MealScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => setIsOnboardingOpen(false)} />
      <ApiKeyModal isOpen={isApiKeyOpen} onClose={() => setIsApiKeyOpen(false)} />
    </div>
  );
}
