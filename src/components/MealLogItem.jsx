import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, Utensils, Clock, Weight, Edit3, Check, X, Scale } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function MealLogItem({ meal }) {
  const deleteMeal = useFitnessStore((state) => state.deleteMeal);
  const updateMeal = useFitnessStore((state) => state.updateMeal);

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    food_name: meal.food_name,
    weight_grams: meal.weight_grams || 200,
    total_calories: meal.total_calories || 0,
    protein_g: meal.protein_g || 0,
    carbs_g: meal.carbs_g || 0,
    fats_g: meal.fats_g || 0
  });

  // Handle Grams Change with proportional Macro Recalculation
  const handleWeightChange = (newGrams) => {
    const parsedGrams = Number(newGrams) || 1;
    const oldGrams = Number(meal.weight_grams) || 1;
    const ratio = parsedGrams / oldGrams;

    setEditForm({
      ...editForm,
      weight_grams: parsedGrams,
      total_calories: Math.round((meal.total_calories || 0) * ratio),
      protein_g: Math.round((meal.protein_g || 0) * ratio),
      carbs_g: Math.round((meal.carbs_g || 0) * ratio),
      fats_g: Math.round((meal.fats_g || 0) * ratio)
    });
  };

  const handleSave = () => {
    updateMeal(meal.id, {
      food_name: editForm.food_name,
      weight_grams: Number(editForm.weight_grams),
      total_calories: Number(editForm.total_calories),
      protein_g: Number(editForm.protein_g),
      carbs_g: Number(editForm.carbs_g),
      fats_g: Number(editForm.fats_g)
    });
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="p-4 rounded-2xl glass-panel border border-slate-800/80 hover:border-slate-700/80 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
    >
      <div className="flex items-center space-x-3.5 space-x-reverse min-w-0 w-full sm:w-auto">
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
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-bold text-slate-100 truncate">{meal.food_name}</h4>

          <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyan-400" /> {meal.timestamp}
            </span>
            {meal.weight_grams && (
              <span className="flex items-center gap-1">
                <Weight className="w-3 h-3 text-slate-400" /> {meal.weight_grams} גרם
              </span>
            )}
          </div>

          {/* Macro Badges */}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {meal.total_calories} קלוריות
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/20">
              חלבון: {meal.protein_g}ג'
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
              פחמימות: {meal.carbs_g}ג'
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-500/10 text-pink-300 border border-pink-500/20">
              שומנים: {meal.fats_g}ג'
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons: Edit Grams & Delete Meal */}
      <div className="flex items-center space-x-2 space-x-reverse self-end sm:self-center shrink-0">
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-cyan-400 hover:text-cyan-300 text-xs font-bold border border-slate-700/80 flex items-center gap-1 transition-colors"
          title="שנה משקל בגרמים או ערכים"
        >
          <Edit3 className="w-3.5 h-3.5" /> שנה גרמים
        </button>

        <button
          onClick={() => deleteMeal(meal.id)}
          className="p-2 rounded-xl text-slate-500 hover:text-pink-400 hover:bg-pink-500/10 transition-colors"
          title="מחק ארוחה"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* EDIT MEAL MODAL / INLINE CARD */}
      <AnimatePresence>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md glass-panel rounded-3xl p-6 text-white border border-slate-700/80 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Scale className="w-4 h-4 text-cyan-400" /> עריכת ארוחה ושינוי גרמים
                </h3>
                <button
                  onClick={() => setIsEditing(false)}
                  className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">שם הארוחה</label>
                <input
                  type="text"
                  value={editForm.food_name}
                  onChange={(e) => setEditForm({ ...editForm, food_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl glass-input text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-cyan-400 mb-1">
                  משקל המנה בגרמים (משנה ערכים יחסית)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={editForm.weight_grams}
                  onChange={(e) => handleWeightChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl glass-input text-sm font-black text-cyan-300"
                />
              </div>

              <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-800">
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">קלוריות</span>
                  <input
                    type="number"
                    value={editForm.total_calories}
                    onChange={(e) => setEditForm({ ...editForm, total_calories: Number(e.target.value) })}
                    className="w-full text-center text-xs font-bold bg-transparent text-cyan-300"
                  />
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">חלבון</span>
                  <input
                    type="number"
                    value={editForm.protein_g}
                    onChange={(e) => setEditForm({ ...editForm, protein_g: Number(e.target.value) })}
                    className="w-full text-center text-xs font-bold bg-transparent text-purple-400"
                  />
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">פחמימות</span>
                  <input
                    type="number"
                    value={editForm.carbs_g}
                    onChange={(e) => setEditForm({ ...editForm, carbs_g: Number(e.target.value) })}
                    className="w-full text-center text-xs font-bold bg-transparent text-amber-400"
                  />
                </div>
                <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                  <span className="text-[10px] text-slate-400 block">שומנים</span>
                  <input
                    type="number"
                    value={editForm.fats_g}
                    onChange={(e) => setEditForm({ ...editForm, fats_g: Number(e.target.value) })}
                    className="w-full text-center text-xs font-bold bg-transparent text-pink-400"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 space-x-reverse pt-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSave}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 text-white font-bold text-xs shadow-md hover:scale-105 transition-transform flex items-center gap-1"
                >
                  <Check className="w-4 h-4" /> שמור שינויים
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
