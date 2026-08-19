import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Flame, Clock, Plus, X, Wand2, AlertCircle, Check, Trash2, Zap } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { analyzeWorkoutText } from '../services/workoutAiService';

export default function WorkoutTrackerModal({ isOpen, onClose }) {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const loggedWorkouts = useFitnessStore((state) => state.loggedWorkouts || []);
  const addWorkout = useFitnessStore((state) => state.addWorkout);
  const deleteWorkout = useFitnessStore((state) => state.deleteWorkout);

  const [workoutName, setWorkoutName] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [isCalculating, setIsCalculating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const todayWorkouts = loggedWorkouts.filter((w) => w.date === selectedDate);
  const totalBurnedToday = todayWorkouts.reduce((acc, w) => acc + (Number(w.burned_calories) || 0), 0);

  const quickPresets = [
    { name: 'אימון כוח חדר כושר', duration: 45, calories: 280, icon: '🏋️‍♂️' },
    { name: 'ריצה בחוץ (10 קמ"ש)', duration: 30, calories: 330, icon: '🏃‍♂️' },
    { name: 'משחק כדורגל / כדורסל', duration: 60, calories: 480, icon: '⚽' },
    { name: 'אימון פילאטיס / יוגה', duration: 45, calories: 190, icon: '🧘‍♂️' },
    { name: 'רכיבה על אופניים', duration: 40, calories: 290, icon: '🚴‍♂️' },
    { name: 'אימון שחייה', duration: 30, calories: 310, icon: '🏊‍♂️' }
  ];

  const handleAddPreset = (preset) => {
    addWorkout({
      name: preset.name,
      duration_minutes: preset.duration,
      burned_calories: preset.calories,
      explanation: `בחירה מהירה (${preset.duration} דק')`
    });
  };

  const handleAiCalculateAndAdd = async (e) => {
    e.preventDefault();
    if (!workoutName.trim()) return;

    setIsCalculating(true);
    setErrorMsg('');

    try {
      const res = await analyzeWorkoutText({
        workoutName: workoutName.trim(),
        durationMinutes: Number(durationMinutes) || 45,
        userWeightKg: Number(userProfile.currentWeightKg) || 75
      });

      addWorkout({
        name: res.workout_name || workoutName.trim(),
        duration_minutes: res.duration_minutes || durationMinutes,
        burned_calories: res.burned_calories || 250,
        explanation: res.explanation || `ניתוח ב-AI (${res.intensity || 'עוצמה ממוצעת'})`
      });

      setWorkoutName('');
      setDurationMinutes(45);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'חישוב שריפת הקלוריות ב-AI נכשל. נסה שוב.');
    } finally {
      setIsCalculating(false);
    }
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
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-500 shadow-lg shadow-purple-500/20 shrink-0 text-white">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold text-white truncate">
                מחשבון שריפת קלוריות מאימונים
              </h2>
              <p className="text-xs text-slate-400 truncate">
                נשרפו להיום: <span className="text-purple-400 font-extrabold">{totalBurnedToday} קלוריות 🔥</span> (+100 XP על כל אימון!)
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

        {/* Quick Presets */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-300">הוספה מהירה בלחיצה:</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickPresets.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAddPreset(preset)}
                className="p-2.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/40 text-right space-y-1 transition-all group"
              >
                <div className="flex items-center justify-between text-xs font-extrabold text-white">
                  <span>{preset.icon} {preset.name}</span>
                </div>
                <div className="flex items-center justify-between text-[11px] font-bold text-slate-400">
                  <span>{preset.duration} דק'</span>
                  <span className="text-purple-400">~{preset.calories} קל'</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* AI Custom Workout Form */}
        <form onSubmit={handleAiCalculateAndAdd} className="space-y-3 pt-2 border-t border-slate-800">
          <label className="block text-xs font-bold text-slate-300">או הזן אימון מותאם אישית לחישוב AI:</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            <div className="sm:col-span-2">
              <input
                type="text"
                placeholder="למשל: אימון אינטרוולים HIIT בחוץ"
                value={workoutName}
                onChange={(e) => setWorkoutName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold focus:border-purple-400"
                required
              />
            </div>
            <div>
              <input
                type="number"
                placeholder="משך (דקות)"
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs font-bold focus:border-purple-400 text-center"
                required
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isCalculating || !workoutName.trim()}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-extrabold shadow-md flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isCalculating ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>מחשב קלוריות ב-Gemini AI...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4 text-purple-200" />
                <span>חשב שריפה ב-AI והוסף ליומן</span>
              </>
            )}
          </button>
        </form>

        {/* Logged Workouts List */}
        <div className="space-y-2 pt-2 border-t border-slate-800">
          <h3 className="text-xs font-bold text-slate-300">אימונים שנרשמו להיום ({todayWorkouts.length}):</h3>

          {todayWorkouts.length > 0 ? (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {todayWorkouts.map((w) => (
                <div
                  key={w.id}
                  className="p-3 rounded-2xl bg-slate-900/90 border border-purple-500/30 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-extrabold text-white">{w.name}</span>
                    <p className="text-[11px] text-slate-400">
                      {w.duration_minutes} דקות • <span className="text-purple-300 font-bold">-{w.burned_calories} קלוריות 🔥</span>
                    </p>
                  </div>
                  <button
                    onClick={() => deleteWorkout(w.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="מחק אימון"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center p-3">טרם נרשמו אימונים להיום.</p>
          )}
        </div>
      </motion.div>
    </div>
  );
}
