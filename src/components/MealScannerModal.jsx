import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, X, Check, RefreshCw, AlertCircle, Edit2 } from 'lucide-react';
import { analyzeMealImage } from '../services/geminiService';
import { useFitnessStore } from '../store/useFitnessStore';

export default function MealScannerModal({ isOpen, onClose }) {
  const addMeal = useFitnessStore((state) => state.addMeal);
  const geminiApiKey = useFitnessStore((state) => state.geminiApiKey);

  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

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
      // Auto analyze when image is loaded
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

  const handleSaveMeal = () => {
    if (!analysisResult) return;
    addMeal({
      ...analysisResult,
      image: imagePreview
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
  };

  const handleSampleMeal = (sampleType) => {
    // Generate high quality sample food images
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
              <Camera className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">AI Meal Scanner</h2>
              <p className="text-xs text-slate-400">Gemini Vision Macro Analysis</p>
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

        {/* Upload Drop Zone / Camera Trigger */}
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

            {/* Quick Demo Sample Selector */}
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

        {/* Image Preview & Analysis State */}
        {imagePreview && (
          <div className="space-y-4">
            {/* Image Preview Card */}
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

            {/* Analyzing Spinner */}
            {isAnalyzing && (
              <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                <div className="w-10 h-10 mx-auto rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-cyan-300 flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-bounce" /> Gemini Vision AI Analyzing Portion & Macros...
                </p>
                <p className="text-xs text-slate-400">Estimating food weight (g), calories, protein, carbs & fats</p>
              </div>
            )}

            {/* Error Banner */}
            {errorMsg && (
              <div className="p-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* AI Results Display */}
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
                    <Edit2 className="w-3 h-3" /> {isEditing ? 'Done' : 'Edit Values'}
                  </button>
                </div>

                {/* Food Title */}
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

                {/* Macros Breakdown Grid */}
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

                {/* Explanation text */}
                {analysisResult.explanation && (
                  <p className="text-xs text-slate-300 italic bg-slate-800/40 p-3 rounded-xl border border-slate-700/40">
                    "{analysisResult.explanation}"
                  </p>
                )}

                {/* Save Button */}
                <button
                  onClick={handleSaveMeal}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" /> Add Meal to Daily Tracker
                </button>
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
