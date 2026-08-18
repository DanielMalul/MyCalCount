import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, Sparkles, X, Check, RefreshCw, AlertCircle, Edit3, PlusCircle, Scale, Flame, Dumbbell, Wheat, PieChart, Wand2 } from 'lucide-react';
import { analyzeMealImage, analyzeMealText } from '../services/geminiService';
import { useFitnessStore } from '../store/useFitnessStore';

export default function MealScannerModal({ isOpen, onClose }) {
  const addMeal = useFitnessStore((state) => state.addMeal);
  const geminiApiKey = useFitnessStore((state) => state.geminiApiKey);

  const [activeTab, setActiveTab] = useState('ai');

  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const [manualForm, setManualForm] = useState({
    food_name: '',
    weight_grams: 200,
    total_calories: 350,
    protein_g: 25,
    carbs_g: 35,
    fats_g: 10,
    explanation: 'הזנה ידנית של ארוחה'
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
      setErrorMsg(err.message || 'ניתוח התמונה נכשל.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAiCalculateManual = async () => {
    if (!manualForm.food_name.trim()) {
      setErrorMsg('אנא הכנס שם מאכל לחישוב (למשל "חזה עוף ואורז").');
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
      setErrorMsg('חישוב ה-AI נכשל.');
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
      setErrorMsg('אנא הכנס שם ארוחה.');
      return;
    }

    addMeal({
      food_name: manualForm.food_name,
      weight_grams: Number(manualForm.weight_grams) || 100,
      total_calories: Number(manualForm.total_calories) || 0,
      protein_g: Number(manualForm.protein_g) || 0,
      carbs_g: Number(manualForm.carbs_g) || 0,
      fats_g: Number(manualForm.fats_g) || 0,
      explanation: manualForm.explanation || 'הזנה ידנית',
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
      explanation: 'הזנה ידנית של ארוחה'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-xl glass-panel rounded-3xl p-6 text-white shadow-2xl border border-slate-700/60 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2 space-x-reverse">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 shadow-md">
              {activeTab === 'ai' ? <Camera className="w-5 h-5 text-white" /> : <Edit3 className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">הוספת ארוחה לתפריט</h2>
              <p className="text-xs text-slate-400">סריקה מצולמת עם Gemini AI או הזנת גרמים ידנית</p>
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

        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('ai');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> צילום ארוחה AI
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('manual');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> הזנת גרמים ידנית
          </button>
        </div>

        {activeTab === 'ai' && (
          <div className="space-y-4">
            {!imagePreview && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-emerald-400 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-emerald-500/5 group"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-slate-800/80 group-hover:bg-emerald-500/10 flex items-center justify-center text-slate-400 group-hover:text-emerald-400 transition-colors">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-200">לחץ להעלאת תמונה או צילום ארוחה במצלמה</p>
                <p className="text-xs text-slate-400 mt-1">תומך ב-JPG, PNG, WEBP</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            )}

            {imagePreview && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden max-h-56 bg-black border border-slate-800">
                  <img src={imagePreview} alt="ארוחה מצולמת" className="w-full h-full object-cover" />
                  <button
                    onClick={handleReset}
                    className="absolute top-3 left-3 p-1.5 rounded-full bg-black/60 backdrop-blur-md text-white hover:bg-black"
                    title="החלף תמונה"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {isAnalyzing && (
                  <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-3">
                    <div className="w-10 h-10 mx-auto rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                    <p className="text-sm font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                      <Sparkles className="w-4 h-4 animate-bounce" /> Gemini Vision AI מנתח את התמונה והערכים...
                    </p>
                    <p className="text-xs text-slate-400">מעריך משקל בגרמים, קלוריות, חלבון, פחמימות ושומנים</p>
                  </div>
                )}

                {errorMsg && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {analysisResult && !isAnalyzing && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/90 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5">
                          מאומת Gemini Vision
                        </span>
                        <span className="text-xs text-slate-400 font-semibold">מנה של {analysisResult.weight_grams} גרם</span>
                      </div>
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="text-xs text-emerald-400 flex items-center gap-1 hover:underline font-semibold"
                      >
                        <Edit3 className="w-3 h-3" /> {isEditing ? 'סיום' : 'ערוך ערכים'}
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
                        <p className="text-[10px] text-slate-400 font-medium">קלוריות</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={analysisResult.total_calories}
                            onChange={(e) =>
                              setAnalysisResult({ ...analysisResult, total_calories: Number(e.target.value) })
                            }
                            className="w-full text-center text-xs font-bold bg-transparent text-emerald-400"
                          />
                        ) : (
                          <p className="text-sm font-black text-emerald-400">{analysisResult.total_calories} <span className="text-[10px]">קל'</span></p>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">חלבון</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={analysisResult.protein_g}
                            onChange={(e) =>
                              setAnalysisResult({ ...analysisResult, protein_g: Number(e.target.value) })
                            }
                            className="w-full text-center text-xs font-bold bg-transparent text-indigo-400"
                          />
                        ) : (
                          <p className="text-sm font-black text-indigo-400">{analysisResult.protein_g}ג'</p>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">פחמימות</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={analysisResult.carbs_g}
                            onChange={(e) => setAnalysisResult({ ...analysisResult, carbs_g: Number(e.target.value) })}
                            className="w-full text-center text-xs font-bold bg-transparent text-amber-400"
                          />
                        ) : (
                          <p className="text-sm font-black text-amber-400">{analysisResult.carbs_g}ג'</p>
                        )}
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50">
                        <p className="text-[10px] text-slate-400 font-medium">שומנים</p>
                        {isEditing ? (
                          <input
                            type="number"
                            value={analysisResult.fats_g}
                            onChange={(e) => setAnalysisResult({ ...analysisResult, fats_g: Number(e.target.value) })}
                            className="w-full text-center text-xs font-bold bg-transparent text-rose-400"
                          />
                        ) : (
                          <p className="text-sm font-black text-rose-400">{analysisResult.fats_g}ג'</p>
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
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-sm shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> הוסף ארוחה לתפריט היומי
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'manual' && (
          <form onSubmit={handleSaveManualMeal} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">שם הארוחה / המאכל</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="למשל: 2 ביצים מקושקשות עם אבוקדו וטוסט"
                  value={manualForm.food_name}
                  onChange={(e) => setManualForm({ ...manualForm, food_name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl glass-input text-xs font-bold"
                  required
                />
                <button
                  type="button"
                  onClick={handleAiCalculateManual}
                  disabled={isAiCalculatingManual}
                  className="px-3.5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-1.5 shrink-0"
                  title="חשב ערכים אוטומטית לפי השם והגרמים בעזרת Gemini AI"
                >
                  {isAiCalculatingManual ? (
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 text-emerald-300 animate-pulse" /> חישוב AI
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Scale className="w-3.5 h-3.5 text-emerald-400" /> משקל המנה (גרם)
                </label>
                <input
                  type="number"
                  min="1"
                  max="5000"
                  value={manualForm.weight_grams}
                  onChange={(e) => setManualForm({ ...manualForm, weight_grams: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold text-emerald-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" /> סה"כ קלוריות (קל')
                </label>
                <input
                  type="number"
                  min="0"
                  max="10000"
                  value={manualForm.total_calories}
                  onChange={(e) => setManualForm({ ...manualForm, total_calories: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 rounded-xl glass-input text-xs font-bold text-emerald-300"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80">
              <label className="block text-xs font-semibold text-slate-400 mb-2">פירוט אבות המזון (גרמים)</label>
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <label className="block text-[10px] font-bold text-indigo-400 mb-1 flex items-center gap-1">
                    <Dumbbell className="w-3 h-3" /> חלבון (ג')
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={manualForm.protein_g}
                    onChange={(e) => setManualForm({ ...manualForm, protein_g: Number(e.target.value) })}
                    className="w-full text-center py-1.5 rounded-lg bg-slate-800/80 text-xs font-black text-indigo-300 border border-indigo-500/20"
                  />
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                  <label className="block text-[10px] font-bold text-amber-400 mb-1 flex items-center gap-1">
                    <Wheat className="w-3 h-3" /> פחמימות (ג')
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
                  <label className="block text-[10px] font-bold text-rose-400 mb-1 flex items-center gap-1">
                    <PieChart className="w-3 h-3" /> שומנים (ג')
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="500"
                    value={manualForm.fats_g}
                    onChange={(e) => setManualForm({ ...manualForm, fats_g: Number(e.target.value) })}
                    className="w-full text-center py-1.5 rounded-lg bg-slate-800/80 text-xs font-black text-rose-300 border border-rose-500/20"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-md hover:opacity-95 transition-all flex items-center justify-center gap-2 mt-4"
            >
              <PlusCircle className="w-4 h-4" /> הוסף ארוחה לתפריט
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
