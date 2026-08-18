import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, X, Check, RefreshCw, AlertCircle, Edit3, PlusCircle, Scale, Flame, Dumbbell, Wheat, PieChart, Wand2 } from 'lucide-react';
import { analyzeMealImage, analyzeMealText } from '../services/geminiService';
import { useFitnessStore } from '../store/useFitnessStore';

export default function MealScannerModal({ isOpen, onClose }) {
  const addMeal = useFitnessStore((state) => state.addMeal);
  const geminiApiKey = useFitnessStore((state) => state.geminiApiKey);

  // Tab State: 'ai' | 'manual'
  const [activeTab, setActiveTab] = useState('ai');

  // AI Camera State
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Manual Form State
  const [manualForm, setManualForm] = useState({
    food_name: '',
    weight_grams: 200,
    total_calories: 350,
    protein_g: 25,
    carbs_g: 35,
    fats_g: 10,
    explanation: 'Manual Meal Entry'
  });
  const [isAiCalculatingManual, setIsAiCalculatingManual] = useState(false);

  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setAnalysisResult(null);
      setErrorMsg('');
      processImageWithGemini(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const processImageWithGemini = async (imageDataUrl) => {
    setIsAnalyzing(true);
    setErrorMsg('');
    try {
      const result = await analyzeMealImage(imageDataUrl, geminiApiKey);
      setAnalysisResult(result);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to analyze meal image.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiCalculateManual = async () => {
    if (!manualForm.food_name.trim()) {
      setErrorMsg('Please enter a food name to auto-calculate (e.g. "Chicken breast & rice").');
      return;
    }
    setIsAiCalculatingManual(true);
    setErrorMsg('');
    try {
      const res = await analyzeMealText(manualForm.food_name, manualForm.weight_grams, geminiApiKey);
      setManualForm({
        ...manualForm,
        food_name: res.food_name,
        total_calories: res.total_calories,
        protein_g: res.protein_g,
        carbs_g: res.carbs_g,
        fats_g: res.fats_g,
        weight_grams: res.weight_grams,
        explanation: res.explanation
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to auto-calculate macros with Gemini AI.');
    } finally {
      setIsAiCalculatingManual(false);
    }
  };

  const handleSaveAiMeal = () => {
    if (!analysisResult) return;
    addMeal({
      ...analysisResult,
      image: imagePreview
    });
    handleReset();
    onClose();
  };

  const handleSaveManualMeal = (e) => {
    e.preventDefault();
    if (!manualForm.food_name.trim()) {
      setErrorMsg('Please enter a food name.');
      return;
    }

    addMeal({
      food_name: manualForm.food_name,
      weight_grams: Number(manualForm.weight_grams) || 100,
      total_calories: Number(manualForm.total_calories) || 0,
      protein_g: Number(manualForm.protein_g) || 0,
      carbs_g: Number(manualForm.carbs_g) || 0,
      fats_g: Number(manualForm.fats_g) || 0,
      explanation: manualForm.explanation || 'Manually logged meal entry',
      image: null
    });

    handleReset();
    onClose();
  };

  const handleReset = () => {
    setImagePreview(null);
    setAnalysisResult(null);
    setErrorMsg('');
    setIsAnalyzing(false);
    setIsEditing(false);
    setIsAiCalculatingManual(false);
    setManualForm({
      food_name: '',
      weight_grams: 200,
      total_calories: 350,
      protein_g: 25,
      carbs_g: 35,
      fats_g: 10,
      explanation: 'Manual Meal Entry'
    });
  };

  const handleSampleMeal = (sampleType) => {
    const samples = {
      chicken: {
        url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
        name: 'Grilled Chicken & Rice Bowl'
      },
      salmon: {
        url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=600&q=80',
        name: 'Seared Salmon Avocado Salad'
      },
      steak: {
        url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
        name: 'Ribeye Steak with Roasted Potatoes'
      }
    };

    const choice = samples[sampleType] || samples.chicken;
    setImagePreview(choice.url);
    setAnalysisResult(null);
    processImageWithGemini(choice.url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl glass-panel rounded-3xl p-6 text-white shadow-2xl border border-slate-700/60 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 shadow-md">
              {activeTab === 'ai' ? <Camera className="w-5 h-5 text-white" /> : <Edit3 className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">Add Meal Entry</h2>
              <p className="text-xs text-slate-400">Scan photo with Gemini AI or enter manually</p>
            </div>
          </div>
          <button
            onClick={() => {
              handleReset();
              onClose();
            }}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher: AI Vision Scan vs Manual Entry */}
        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ai');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> AI Camera Scan
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Manual Grams & Macros
          </button>
        </div>

        {/* TAB 1: AI CAMERA SCAN */}
        {activeTab === 'ai' && (
          <div className="space-y-4">
            {!imagePreview && (
              <div className="space-y-4">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-700 hover:border-cyan-400 rounded-3xl p-8 text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-cyan-500/5 group"
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-800/80 group-hover:bg-cyan-500/10 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors">
                    <Upload className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-bold text-slate-200">Tap to Upload or Snap Meal Photo</p>
                  <p className="text-xs text-slate-400 mt-1">Supports JPG, PNG, WEBP</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-400 font-semibold mb-2">Or try a sample meal image:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handleSampleMeal('chicken')}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-400/50 text-left transition-all"
                    >
                      <p className="text-xs font-bold text-slate-200 truncate">🍗 Chicken Bowl</p>
                      <p className="text-[10px] text-slate-400">High protein</p>
                    </button>
                    <button
                      onClick={() => handleSampleMeal('salmon')}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-400/50 text-left transition-all"
                    >
                      <p className="text-xs font-bold text-slate-200 truncate">🐟 Salmon Salad</p>
                      <p className="text-[10px] text-slate-400">Healthy fats</p>
                    </button>
                    <button
                      onClick={() => handleSampleMeal('steak')}
                      className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-400/50 text-left transition-all"
                    >
                      <p className="text-xs font-bold text-slate-200 truncate">🥩 Steak & Veg</p>
                      <p className="text-[10px] text-slate-400">Bulking meal</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {imagePreview && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden max-h-56 bg-black border border-slate-800">
                  <img src={imagePreview} alt="Scanned Meal" className="w-full h-full object-cover" />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 right-3 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black"
                    title="Change Image"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                    <p className="text-sm font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 animate-bounce" /> Gemini Vision AI Analyzing Portion & Macros...
                    </p>
                    <p className="text-xs text-slate-400">Estimating food weight (g), calories, protein, carbs & fats</p>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {analysisResult && !isAnalyzing && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5">
                          {analysisResult.isMock ? 'Simulated AI' : 'Gemini Vision Verified'}
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">{analysisResult.weight_grams}g portion</span>
                      </div>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-xs text-cyan-400 flex items-center gap-1 hover:underline font-semibold"
                      >
                        <Edit3 className="w-3 h-3" /> {isEditing ? 'Done' : 'Edit Values'}
                      </button>
                    </div>

                    {isEditing ? (
                      <input
                        type="text"
                        value={analysisResult.food_name}
                        onChange={(e) => setAnalysisResult({ ...analysisResult, food_name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl glass-input text-sm font-bold"
                      />
                    ) : (
                      <h3 className="text-base font-extrabold text-white">{analysisResult.food_name}</h3>
                    )}

                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">Calories</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={analysisResult.total_calories}
                            onChange={(e) =>
                              setAnalysisResult({ ...analysisResult, total_calories: Number(e.target.value) })
                            }
                            className="w-full text-center text-xs font-bold bg-transparent text-cyan-300"
                          />
                        ) : (
                          <p className="text-sm font-black text-cyan-300">{analysisResult.total_calories} <span className="text-[10px]">kcal</span></p>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">Protein</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={analysisResult.protein_g}
                            onChange={(e) =>
                              setAnalysisResult({ ...analysisResult, protein_g: Number(e.target.value) })
                            }
                            className="w-full text-center text-xs font-bold bg-transparent text-purple-400"
                          />
                        ) : (
                          <p className="text-sm font-black text-purple-400">{analysisResult.protein_g}g</p>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">Carbs</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={analysisResult.carbs_g}
                            onChange={(e) => setAnalysisResult({ ...analysisResult, carbs_g: Number(e.target.value) })}
                            className="w-full text-center text-xs font-bold bg-transparent text-amber-400"
                          />
                        ) : (
                          <p className="text-sm font-black text-amber-400">{analysisResult.carbs_g}g</p>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">Fats</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={analysisResult.fats_g}
                            onChange={(e) => setAnalysisResult({ ...analysisResult, fats_g: Number(e.target.value) })}
                            className="w-full text-center text-xs font-bold bg-transparent text-pink-400"
                          />
                        ) : (
                          <p className="text-sm font-black text-pink-400">{analysisResult.fats_g}g</p>
                        )}
                      </div>
                    </div>

                    {analysisResult.explanation && (
                      <p className="text-xs text-slate-300 italic bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
                        "{analysisResult.explanation}"
                      </p>
                    )}

                    <button
                      onClick={handleSaveAiMeal}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> Add Meal to Daily Tracker
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MANUAL ENTRY FORM WITH AI AUTO-ESTIMATE */}
        {activeTab === 'manual' && (
          <form onSubmit={handleSaveManualMeal} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Food / Dish Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g., 2 Scrambled Eggs with Avocado & Whole Wheat Toast"
                  value={manualForm.food_name}
                  onChange={(e) => setManualForm({ ...manualForm, food_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={handleAiCalculateManual}
                  disabled={isAiCalculatingManual}
                  className="px-3.5 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white text-xs font-bold shadow-md hover:scale-105 transition-all flex items-center gap-1.5 shrink-0"
                  title="Auto-calculate calories and macros using Gemini AI"
                >
                  {isAiCalculatingManual ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-cyan-300 animate-pulse" /> AI Estimate
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-cyan-400" /> Portion Weight (g)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={manualForm.weight_grams}
                  onChange={(e) => setManualForm({ ...manualForm, weight_grams: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-cyan-400" /> Total Calories (kcal)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={manualForm.total_calories}
                  onChange={(e) => setManualForm({ ...manualForm, total_calories: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold text-cyan-300"
                />
              </div>
            </div>

            {/* Macros Breakdown Form */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-400 mb-2">Nutritional Breakdown (Grams)</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <label className="block text-[10px] font-bold text-purple-400 mb-1 flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" /> Protein (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={manualForm.protein_g}
                    onChange={(e) => setManualForm({ ...manualForm, protein_g: Number(e.target.value) })}
                    className="w-full text-center py-1.5 rounded-lg bg-slate-800/80 text-xs font-black text-purple-300 border border-purple-500/20"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <label className="block text-[10px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Wheat className="w-3 h-3" /> Carbs (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1000"
                    value={manualForm.carbs_g}
                    onChange={(e) => setManualForm({ ...manualForm, carbs_g: Number(e.target.value) })}
                    className="w-full text-center py-1.5 rounded-lg bg-slate-800/80 text-xs font-black text-amber-300 border border-amber-500/20"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <label className="block text-[10px] font-bold text-pink-400 mb-1 flex items-center gap-1">
                    <PieChart className="w-3 h-3" /> Fats (g)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={manualForm.fats_g}
                    onChange={(e) => setManualForm({ ...manualForm, fats_g: Number(e.target.value) })}
                    className="w-full text-center py-1.5 rounded-lg bg-slate-800/80 text-xs font-black text-pink-300 border border-pink-500/20"
                  />
                </div>
              </div>
            </div>

            {manualForm.explanation && (
              <p className="text-xs text-slate-300 italic bg-slate-800/40 p-2.5 rounded-xl border border-slate-700/40">
                "{manualForm.explanation}"
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mt-4"
            >
              <PlusCircle className="w-4 h-4" /> Save Manual Meal Entry
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
