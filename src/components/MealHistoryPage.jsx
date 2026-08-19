import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Camera, Plus, Sparkles, Calendar, Search, Dumbbell, Wheat, PieChart } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import MealLogItem from './MealLogItem';

export default function MealHistoryPage({ onOpenScanner }) {
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const loggedMeals = useFitnessStore((state) => state.loggedMeals);
  const getDailyTotals = useFitnessStore((state) => state.getDailyTotals);

  const [searchTerm, setSearchTerm] = useState('');

  const dailyTotals = getDailyTotals();
  const filteredMeals = loggedMeals
    .filter((m) => m.date === selectedDate)
    .filter((m) => m.food_name.toLowerCase().includes(searchTerm.toLowerCase().trim()));

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header Summary Panel */}
      <section className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-md">
              <Flame className="w-5 h-5 sm:w-6 sm:h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-white">יומן ארוחות ומעקב יומי</h2>
              <p className="text-xs text-slate-400">
                ריכוז כל הארוחות שנרשמו לתאריך הנבחר
              </p>
            </div>
          </div>

          <button
            onClick={onOpenScanner}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" /> הוסף ארוחה ליומן
          </button>
        </div>

        {/* Totals Summary Banner */}
        <div className="grid grid-cols-4 gap-2 text-center bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">קלוריות</span>
            <span className="text-sm sm:text-base font-black text-emerald-400">{dailyTotals.calories}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">חלבון</span>
            <span className="text-sm sm:text-base font-black text-indigo-400">{dailyTotals.protein}ג'</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">פחמימות</span>
            <span className="text-sm sm:text-base font-black text-amber-400">{dailyTotals.carbs}ג'</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-400 block font-medium">שומנים</span>
            <span className="text-sm sm:text-base font-black text-rose-400">{dailyTotals.fats}ג'</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
          <input
            type="text"
            placeholder="חפש ארוחה ביומן..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-4 pr-10 py-2.5 rounded-xl glass-input text-xs font-bold focus:border-emerald-400"
          />
        </div>
      </section>

      {/* Logged Meal Cards List */}
      <section className="glass-panel p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200">
            ארוחות לתאריך זה ({filteredMeals.length})
          </h3>
        </div>

        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredMeals.length > 0 ? (
              filteredMeals.map((meal) => <MealLogItem key={meal.id} meal={meal} />)
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-8 sm:p-12 text-center bg-slate-900/40 rounded-2xl border border-dashed border-slate-800 space-y-3"
              >
                <Camera className="w-10 h-10 mx-auto text-slate-600" />
                <p className="text-sm font-semibold text-slate-400">טרם נרשמו ארוחות לתאריך זה</p>
                <button
                  onClick={onOpenScanner}
                  className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-all inline-flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> סרוק / הוסף ארוחה ראשונה
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
