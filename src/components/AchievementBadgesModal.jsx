import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, Award, Flame, Dumbbell, Droplet, Footprints, Target, Sparkles, X, Check, Lock } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { getRankTier } from './FitnessAvatarWidget';

export default function AchievementBadgesModal({ isOpen, onClose }) {
  const userXp = useFitnessStore((state) => state.userXp || 180);
  const streakDays = useFitnessStore((state) => state.streakDays || 3);
  const getDailyTotals = useFitnessStore((state) => state.getDailyTotals);
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const waterMl = useFitnessStore((state) => state.waterMl || 0);
  const steps = useFitnessStore((state) => state.steps || 0);
  const loggedMeals = useFitnessStore((state) => state.loggedMeals || []);

  if (!isOpen) return null;

  const dailyTotals = getDailyTotals();
  const rank = getRankTier(userXp);

  const badges = [
    {
      id: 'b_protein',
      title: 'מלך החלבון',
      icon: '🥇',
      desc: 'הגעת ל-100ג\' חלבון ומעלה ביום אחד',
      unlocked: dailyTotals.protein >= 100,
      xpBonus: '+150 XP'
    },
    {
      id: 'b_streak',
      title: 'רצף אש',
      icon: '🔥',
      desc: 'שמרת על רצף של 3 ימים ומעלה באפליקציה',
      unlocked: streakDays >= 3,
      xpBonus: '+200 XP'
    },
    {
      id: 'b_water',
      title: 'מדרט מצטיין',
      icon: '💧',
      desc: 'שתית 2,000 מ"ל מים ומעלה ביום',
      unlocked: waterMl >= 2000,
      xpBonus: '+100 XP'
    },
    {
      id: 'b_steps',
      title: 'צייד הצעדים',
      icon: '🏃‍♂️',
      desc: 'הגעת ל-8,000 צעדים ומעלה ביום אחד',
      unlocked: steps >= 8000,
      xpBonus: '+150 XP'
    },
    {
      id: 'b_meals',
      title: 'מתעד מתמיד',
      icon: '📸',
      desc: 'תיעדת 3 ארוחות ומעלה ביומן היומי',
      unlocked: loggedMeals.length >= 3,
      xpBonus: '+100 XP'
    },
    {
      id: 'b_bullseye',
      title: 'דיוק מוחלט',
      icon: '🎯',
      desc: 'הגעת למרחק של עד 100 קלוריות מהיעד היומי',
      unlocked: dailyTotals.calories > 0 && Math.abs(dailyTargets.targetCalories - dailyTotals.calories) <= 100,
      xpBonus: '+250 XP'
    }
  ];

  const unlockedCount = badges.filter((b) => b.unlocked).length;

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
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 shadow-lg shadow-amber-500/20 shrink-0 text-slate-950 font-black">
              <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold text-white truncate">
                הישגים ותגים קהילתיים
              </h2>
              <p className="text-xs text-slate-400 truncate">
                פתוחים: <span className="text-amber-400 font-bold">{unlockedCount} מתוך {badges.length} תגים</span> | רמה: <span className="text-purple-400 font-bold">{rank.level}</span>
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

        {/* Badges Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {badges.map((b) => (
            <motion.div
              key={b.id}
              whileHover={{ scale: 1.02 }}
              className={`p-4 rounded-2xl border transition-all flex items-start gap-3 relative overflow-hidden ${
                b.unlocked
                  ? 'bg-gradient-to-r from-slate-900 to-amber-950/30 border-amber-500/50 shadow-lg shadow-amber-500/10'
                  : 'bg-slate-900/40 border-slate-800/80 opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-md ${
                b.unlocked ? 'bg-amber-500/20 border border-amber-400/40' : 'bg-slate-800/60 border border-slate-700/60'
              }`}>
                {b.icon}
              </div>

              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="text-xs sm:text-sm font-extrabold text-white truncate">{b.title}</h3>
                  <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    {b.xpBonus}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">{b.desc}</p>
                <div className="pt-1">
                  {b.unlocked ? (
                    <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" /> תג הושג בהצלחה!
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> נעול - המשך לעמוד ביעדים
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
