import React from 'react';
import { motion } from 'framer-motion';
import { Trash2, Utensils, Clock, Weight } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function MealLogItem({ meal }) {
  const deleteMeal = useFitnessStore((state) => state.deleteMeal);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700/80 transition-all flex items-center justify-between gap-4 group"
    >
      <div className="flex items-center space-x-3.5 min-w-0">
        {/* Meal Image Thumbnail */}
        {meal.image ? (
          <img
            src={meal.image}
            alt={meal.food_name}
            className="w-14 h-14 rounded-2xl object-cover border border-slate-700/80 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-center text-cyan-400 shrink-0">
            <Utensils className="w-6 h-6" />
          </div>
        )}

        {/* Meal Details */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-bold text-slate-100 truncate">{meal.food_name}</h4>
          </div>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> {meal.timestamp}
            </span>
            {meal.weight_grams && (
              <span className="flex items-center gap-1">
                <Weight className="w-3 h-3 text-slate-400" /> {meal.weight_grams}g
              </span>
            )}
          </div>

          {/* Macro Pills */}
          <div className="flex items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {meal.total_calories} kcal
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              P: {meal.protein_g}g
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              C: {meal.carbs_g}g
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20">
              F: {meal.fats_g}g
            </span>
          </div>
        </div>
      </div>

      {/* Delete Action */}
      <button
        onClick={() => deleteMeal(meal.id)}
        className="p-2 rounded-xl text-slate-500 hover:text-pink-400 hover:bg-pink-500/10 transition-colors shrink-0"
        title="Delete Entry"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </motion.div>
  );
}
