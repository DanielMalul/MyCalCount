import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, Target, Activity, Dumbbell, ChevronRight, ChevronLeft, Check, Sparkles } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { calculateTargets, GOALS, ACTIVITY_LEVELS } from '../utils/fitnessMath';

export default function OnboardingModal({ isOpen, onClose }) {
  const completeOnboarding = useFitnessStore((state) => state.completeOnboarding);
  const currentProfile = useFitnessStore((state) => state.userProfile);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    age: currentProfile.age || 25,
    gender: currentProfile.gender || 'male',
    heightCm: currentProfile.heightCm || 175,
    currentWeightKg: currentProfile.currentWeightKg || 75,
    targetWeightKg: currentProfile.targetWeightKg || 70,
    goal: currentProfile.goal || 'cut',
    activityLevel: currentProfile.activityLevel || 'moderate'
  });

  if (!isOpen) return null;

  const handleChange = (field, val) => {
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const calculated = calculateTargets(formData);

  const handleFinish = () => {
    completeOnboarding(formData);
    if (onClose) onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl glass-panel rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-700/50"
      >
        {/* Top Header Badge & Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-600 shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
                Setup Profile
              </h2>
              <p className="text-xs text-slate-400">Mifflin-St Jeor AI Math Engine</p>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 bg-slate-900/60 px-3 py-1.5 rounded-full border border-slate-800">
            <span className="text-xs font-semibold text-cyan-400">Step {step}</span>
            <span className="text-xs text-slate-500">/ 3</span>
          </div>
        </div>

        {/* Step Progress Bar */}
        <div className="w-full bg-slate-800/60 rounded-full h-1.5 mb-8 overflow-hidden">
          <motion.div
            className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 h-full"
            initial={{ width: '33%' }}
            animate={{ width: `${(step / 3) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Form Steps */}
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Dumbbell className="w-5 h-5 text-cyan-400" /> Personal Biometrics
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Gender */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-medium text-slate-400 mb-2">Biological Sex</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange('gender', 'male')}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                        formData.gender === 'male'
                          ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Male
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('gender', 'female')}
                      className={`py-3 rounded-xl border text-sm font-semibold transition-all ${
                        formData.gender === 'female'
                          ? 'bg-purple-500/20 border-purple-400 text-purple-300 shadow-lg shadow-purple-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      Female
                    </button>
                  </div>
                </div>

                {/* Age */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Age (years)</label>
                  <input
                    type="number"
                    min="14"
                    max="100"
                    value={formData.age}
                    onChange={(e) => handleChange('age', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                {/* Height */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    min="100"
                    max="250"
                    value={formData.heightCm}
                    onChange={(e) => handleChange('heightCm', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>

                {/* Current Weight */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-2">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    value={formData.currentWeightKg}
                    onChange={(e) => handleChange('currentWeightKg', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" /> Target Weight & Goal
              </h3>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Target Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  min="30"
                  max="300"
                  value={formData.targetWeightKg}
                  onChange={(e) => handleChange('targetWeightKg', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl glass-input text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2">Primary Goal</label>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(GOALS).map(([key, item]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleChange('goal', key)}
                      className={`p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        formData.goal === key
                          ? 'bg-purple-500/20 border-purple-400 shadow-lg shadow-purple-500/10'
                          : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <p className={`font-bold text-sm ${formData.goal === key ? 'text-purple-300' : 'text-slate-200'}`}>
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        formData.goal === key ? 'border-purple-400 bg-purple-500/40 text-white' : 'border-slate-600'
                      }`}>
                        {formData.goal === key && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" /> Daily Activity Level
              </h3>

              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {Object.entries(ACTIVITY_LEVELS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleChange('activityLevel', key)}
                    className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                      formData.activityLevel === key
                        ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-medium">{item.label}</span>
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      formData.activityLevel === key ? 'border-emerald-400 bg-emerald-500 text-white' : 'border-slate-600'
                    }`}>
                      {formData.activityLevel === key && <Check className="w-3 h-3" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Live Calculation Preview Footer Card */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="flex items-center gap-1 text-cyan-400 font-semibold">
              <Flame className="w-3.5 h-3.5" /> Calculated Daily Targets
            </span>
            <span>BMR: {calculated.bmr} kcal | TDEE: {calculated.tdee} kcal</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-slate-800">
            <div>
              <p className="text-xs text-slate-400">Calories</p>
              <p className="text-sm font-bold text-cyan-300">{calculated.targetCalories} <span className="text-[10px]">kcal</span></p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Protein</p>
              <p className="text-sm font-bold text-purple-400">{calculated.proteinGrams}g</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Carbs</p>
              <p className="text-sm font-bold text-amber-400">{calculated.carbGrams}g</p>
            </div>
            <div>
              <p className="text-xs text-slate-400">Fats</p>
              <p className="text-sm font-bold text-pink-400">{calculated.fatGrams}g</p>
            </div>
          </div>
        </div>

        {/* Modal Controls */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-800">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 hover:bg-slate-800 flex items-center gap-1.5 text-xs font-semibold"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              type="button"
              onClick={() => setStep((s) => s + 1)}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 hover:opacity-95 flex items-center gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/30 hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              Save & Generate Plan <Check className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
