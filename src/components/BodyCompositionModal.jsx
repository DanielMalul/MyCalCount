import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  Upload,
  Sparkles,
  Calculator,
  History,
  Activity,
  Flame,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Zap,
  TrendingDown,
  Scale,
  Award,
  ChevronLeft
} from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { calculateNavyBodyFat } from '../utils/fitnessMath';
import { analyzeBodyCompositionImage } from '../services/geminiService';

export default function BodyCompositionModal({ isOpen, onClose }) {
  const userProfile = useFitnessStore((state) => state.userProfile || {});
  const bodyCompositionLogs = useFitnessStore((state) => state.bodyCompositionLogs || []);
  const addBodyCompositionLog = useFitnessStore((state) => state.addBodyCompositionLog);
  const deleteBodyCompositionLog = useFitnessStore((state) => state.deleteBodyCompositionLog);

  const [activeTab, setActiveTab] = useState('scan'); // 'scan' | 'calc' | 'history'

  // Photo Scan State
  const [selectedImage, setSelectedImage] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [aiResult, setAiResult] = useState(null);
  const [scanError, setScanError] = useState('');

  // Navy Calculator Inputs
  const [gender, setGender] = useState(userProfile.gender || 'male');
  const [heightCm, setHeightCm] = useState(userProfile.heightCm || 175);
  const [weightKg, setWeightKg] = useState(userProfile.currentWeightKg || 70);
  const [waistCm, setWaistCm] = useState(85);
  const [neckCm, setNeckCm] = useState(38);
  const [hipCm, setHipCm] = useState(95);
  const [savedSuccessMsg, setSavedSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Calculate live Navy formula values
  const navyResults = calculateNavyBodyFat({
    gender,
    heightCm,
    weightKg,
    waistCm,
    neckCm,
    hipCm
  });

  const handleImageUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setScanError('גודל הקובץ עולה על 10MB. נא לבחור תמונה קטנה יותר.');
      return;
    }
    setScanError('');
    setAiResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRunAiScan = async () => {
    if (!selectedImage) {
      setScanError('נא להעלות תמונה לפני ביצוע הניתוח.');
      return;
    }
    setIsScanning(true);
    setScanError('');
    setAiResult(null);

    try {
      const res = await analyzeBodyCompositionImage(selectedImage, userProfile);
      setAiResult(res);
    } catch (err) {
      console.error('AI Body Scan error:', err);
      setScanError(err.message || 'שגיאה בניתוח התמונה ב-AI. וודא שמפתח Gemini תקין.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleSaveAiResult = () => {
    if (!aiResult) return;
    addBodyCompositionLog({
      bodyFatPct: aiResult.estimated_body_fat_pct,
      leanMassKg: aiResult.estimated_lean_mass_kg,
      fatMassKg: aiResult.estimated_fat_mass_kg,
      category: aiResult.body_fat_category,
      method: 'AI Vision DEXA',
      visualAssessment: aiResult.visual_assessment,
      targetProjection: aiResult.target_physique_projection,
      recommendations: aiResult.recommendations
    });
    setSavedSuccessMsg('הנתונים שנחשפו ב-AI נשמרו בהצלחה בהיסטוריה!');
    setTimeout(() => setSavedSuccessMsg(''), 4000);
  };

  const handleSaveNavyResult = () => {
    addBodyCompositionLog({
      bodyFatPct: navyResults.bodyFatPct,
      leanMassKg: navyResults.leanMassKg,
      fatMassKg: navyResults.fatMassKg,
      category: navyResults.category,
      method: 'מחשבון היקפים צי (Navy)',
      visualAssessment: `היקף מותניים: ${waistCm} ס"מ | צוואר: ${neckCm} ס"מ`,
      targetProjection: `מסת שריר רזה: ${navyResults.leanMassKg} ק"ג | מסת שומן: ${navyResults.fatMassKg} ק"ג`,
      recommendations: ['המשך מעקב יומי של תזונה ואימונים', 'הקפד על מאזן חלבון יומי מומלץ']
    });
    setSavedSuccessMsg('תוצאת מחשבון ההיקפים נשמרה בהצלחה!');
    setTimeout(() => setSavedSuccessMsg(''), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl glass-panel rounded-3xl p-4 sm:p-7 text-white shadow-2xl border border-slate-700/60 max-h-[92vh] overflow-y-auto space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-400 shadow-lg shadow-teal-500/20 text-white shrink-0">
              <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold text-white truncate flex items-center gap-2">
                <span>מחשבון אחוז שומן & AI Visualizer</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                  DEXA 3.6
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate">
                ניתוח הרכב גוף, אחוז שומן והדמיית יעד ויזואלית ב-AI
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

        {/* Navigation Tabs */}
        <div className="flex items-center p-1 bg-slate-900/90 rounded-2xl border border-slate-800 gap-1">
          <button
            onClick={() => setActiveTab('scan')}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'scan'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>סורק תמונה AI</span>
          </button>

          <button
            onClick={() => setActiveTab('calc')}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'calc'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator className="w-4 h-4" />
            <span>מחשבון היקפים</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-4 h-4" />
            <span>היסטוריה ({bodyCompositionLogs.length})</span>
          </button>
        </div>

        {savedSuccessMsg && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{savedSuccessMsg}</span>
          </div>
        )}

        {/* TAB 1: AI PHOTO SCANNER */}
        {activeTab === 'scan' && (
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="relative border-2 border-dashed border-slate-700/80 hover:border-teal-500/50 rounded-2xl p-4 sm:p-6 text-center bg-slate-900/50 transition-all">
              {selectedImage ? (
                <div className="space-y-3">
                  <div className="relative max-w-xs mx-auto rounded-2xl overflow-hidden border border-slate-700 shadow-xl max-h-56">
                    <img src={selectedImage} alt="תמונת גוף" className="w-full h-full object-cover" />
                    {isScanning && (
                      <div className="absolute inset-0 bg-teal-950/60 backdrop-blur-xs flex items-center justify-center">
                        <div className="text-center space-y-2">
                          <div className="w-10 h-10 border-4 border-teal-400 border-t-transparent rounded-full animate-spin mx-auto" />
                          <span className="text-xs font-bold text-teal-200 block animate-pulse">
                            מנתח מבנה גוף ואחוז שומן ב-AI...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center gap-2">
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 transition-colors">
                      החלף תמונה
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                    </label>
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer space-y-2 block">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto shadow-md">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-sm font-bold text-slate-200 block">צלם או העלה תמונת גוף (פרונט / צד)</span>
                    <p className="text-[11px] text-slate-400">ה-AI מפענח את חיטוב הבטן, מסת השריר ואחוז השומן</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>

            {scanError && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{scanError}</span>
              </div>
            )}

            {/* Action Button */}
            {selectedImage && !aiResult && (
              <button
                onClick={handleRunAiScan}
                disabled={isScanning}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-teal-500/20 hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>{isScanning ? 'מבצע ניתוח DEXA ב-AI...' : 'הפעל ניתוח AI & הדמיית יעד ויזואלית'}</span>
              </button>
            )}

            {/* AI Result Presentation Card */}
            {aiResult && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Main Metrics Card */}
                <div className="p-5 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-900 to-teal-950/40 border border-teal-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-400 block font-bold">אחוז שומן משוער ב-AI</span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-300">
                          {aiResult.estimated_body_fat_pct}%
                        </span>
                        <span className="text-xs px-2.5 py-1 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                          {aiResult.body_fat_category}
                        </span>
                      </div>
                    </div>

                    <div className="text-left space-y-1">
                      <div className="text-[11px] text-slate-400">
                        מסת שריר רזה: <span className="text-emerald-400 font-bold">{aiResult.estimated_lean_mass_kg || Math.round(weightKg * 0.82)} ק"ג</span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        מסת שומן: <span className="text-rose-400 font-bold">{aiResult.estimated_fat_mass_kg || Math.round(weightKg * 0.18)} ק"ג</span>
                      </div>
                    </div>
                  </div>

                  {/* AI Visual Critique */}
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                    <span className="text-[11px] font-bold text-teal-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> ניתוח ויזואלי של המבנה והחיטוב:
                    </span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {aiResult.visual_assessment}
                    </p>
                  </div>

                  {/* Projected Transformation Card */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-teal-950/40 to-slate-900 border border-emerald-500/40 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1.5">
                        <Flame className="w-4 h-4 fill-emerald-400 text-emerald-400" />
                        <span>הדמיה ויזואלית ביעד ({userProfile.targetWeightKg || 65} ק"ג):</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {aiResult.target_physique_projection}
                    </p>
                  </div>

                  {/* Actionable Tips */}
                  {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-xs font-bold text-slate-300">המלצות AI להשגת היעד:</span>
                      <ul className="space-y-1">
                        {aiResult.recommendations.map((tip, idx) => (
                          <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Save Button */}
                  <button
                    onClick={handleSaveAiResult}
                    className="w-full py-2.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/40 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5"
                  >
                    <Award className="w-4 h-4" />
                    <span>שמור נתונים אלו למעקב בהיסטוריה</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* TAB 2: NAVY CIRCUMFERENCE CALCULATOR */}
        {activeTab === 'calc' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
              <span className="text-xs font-bold text-slate-300 block">
                הזן את המדדים בסנטימטרים (לפי נוסחת צי ארה"ב):
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Gender */}
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">מין</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="male">גבר 👨</option>
                    <option value="female">אישה 👩</option>
                  </select>
                </div>

                {/* Height */}
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">גובה (ס"מ)</label>
                  <input
                    type="number"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Weight */}
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">משקל (ק"ג)</label>
                  <input
                    type="number"
                    value={weightKg}
                    onChange={(e) => setWeightKg(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Waist */}
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">היקף מותניים (ס"מ)</label>
                  <input
                    type="number"
                    value={waistCm}
                    onChange={(e) => setWaistCm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Neck */}
                <div>
                  <label className="text-[11px] text-slate-400 font-bold block mb-1">היקף צוואר (ס"מ)</label>
                  <input
                    type="number"
                    value={neckCm}
                    onChange={(e) => setNeckCm(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Hips (Only for female) */}
                {gender === 'female' && (
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">היקף ירכיים (ס"מ)</label>
                    <input
                      type="number"
                      value={hipCm}
                      onChange={(e) => setHipCm(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Live Formula Calculations Display */}
            <div className="p-5 rounded-2xl bg-gradient-to-tr from-slate-900 to-teal-950/30 border border-teal-500/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 block font-bold">תוצאת אחוז שומן (Navy)</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-teal-400">{navyResults.bodyFatPct}%</span>
                    <span className={`text-xs font-bold ${navyResults.categoryColor}`}>
                      ({navyResults.category})
                    </span>
                  </div>
                </div>

                <div className="text-left space-y-1">
                  <div className="text-xs text-slate-300">
                    שריר רזה: <span className="font-bold text-emerald-400">{navyResults.leanMassKg} ק"ג</span>
                  </div>
                  <div className="text-xs text-slate-300">
                    מסת שומן: <span className="font-bold text-rose-400">{navyResults.fatMassKg} ק"ג</span>
                  </div>
                </div>
              </div>

              {/* Progress Spectrum Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                  <span>אתלטי (8%)</span>
                  <span>חטוב (14%)</span>
                  <span>ממוצע (20%)</span>
                  <span>גבוה (25%+)</span>
                </div>
                <div className="h-3 w-full rounded-full bg-slate-800 overflow-hidden relative p-0.5 border border-slate-700">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-teal-400 via-amber-400 to-rose-500 transition-all"
                    style={{ width: `${Math.min(100, Math.max(10, navyResults.bodyFatPct * 2.8))}%` }}
                  />
                </div>
              </div>

              <button
                onClick={handleSaveNavyResult}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-extrabold text-xs shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-1.5"
              >
                <Award className="w-4 h-4" />
                <span>שמור חישוב זה בהיסטוריה</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: PROGRESS HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-3">
            {bodyCompositionLogs.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <Scale className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-bold">עדיין לא נרשמו מדידות אחוז שומן.</p>
                <p className="text-[11px] text-slate-500">השתמש בסורק התמונה ב-AI או במחשבון ההיקפים כדי לשמור מדידה ראשונה!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400 px-1">
                  <span>מדידות שנשמרו:</span>
                  <span>סך הכל: {bodyCompositionLogs.length}</span>
                </div>

                {bodyCompositionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-teal-500/30 transition-all"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-teal-400">{log.bodyFatPct}% שומן</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-bold border border-slate-700">
                          {log.category}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400 truncate">
                        {log.timestamp} • שיטה: {log.method}
                      </p>

                      {log.targetProjection && (
                        <p className="text-[10px] text-slate-300 line-clamp-1 italic">
                          "{log.targetProjection}"
                        </p>
                      )}
                    </div>

                    <button
                      onClick={() => deleteBodyCompositionLog(log.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors shrink-0"
                      title="מחק מדידה"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
