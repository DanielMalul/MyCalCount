import React from 'react';
import { motion } from 'framer-motion';
import { Flame, ShieldCheck, Zap, Award, Sparkles, Dumbbell, Crown } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export function getRankTier(xp = 0) {
  if (xp < 200) return { level: 1, title: 'מתחיל נחוש', icon: '🌱', nextXp: 200, prevXp: 0, color: 'from-emerald-500 to-teal-400', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' };
  if (xp < 500) return { level: 2, title: 'שורף קלוריות', icon: '⚡', nextXp: 500, prevXp: 200, color: 'from-amber-500 to-yellow-400', badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30' };
  if (xp < 900) return { level: 3, title: 'מתאמן רציני', icon: '🏋️‍♂️', nextXp: 900, prevXp: 500, color: 'from-indigo-500 to-cyan-400', badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30' };
  if (xp < 1400) return { level: 4, title: 'מכונת חלבון', icon: '💪', nextXp: 1400, prevXp: 900, color: 'from-purple-500 to-pink-500', badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30' };
  if (xp < 2000) return { level: 5, title: 'מאסטר חיטוב', icon: '🔥', nextXp: 2000, prevXp: 1400, color: 'from-rose-500 to-orange-500', badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30' };
  return { level: 6, title: 'אגדת כושר', icon: '👑', nextXp: 3000, prevXp: 2000, color: 'from-amber-400 via-purple-500 to-cyan-400', badgeColor: 'bg-amber-500/30 text-amber-200 border-amber-400/50' };
}

export default function FitnessAvatarWidget({ onOpenCoach }) {
  const userXp = useFitnessStore((state) => state.userXp || 180);
  const streakDays = useFitnessStore((state) => state.streakDays || 3);
  const userProfile = useFitnessStore((state) => state.userProfile);

  const rank = getRankTier(userXp);
  const xpCurrentTier = userXp - rank.prevXp;
  const xpSpanTier = rank.nextXp - rank.prevXp;
  const progressPercent = Math.min(100, Math.round((xpCurrentTier / xpSpanTier) * 100));

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-panel p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl space-y-3 relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-900/95 to-purple-950/20"
    >
      {/* Background Subtle Glow */}
      <div className="absolute top-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex items-center justify-between gap-3 relative z-10">
        
        {/* Avatar Badge & Rank */}
        <div className="flex items-center space-x-3 space-x-reverse min-w-0">
          <div className={`w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-gradient-to-tr ${rank.color} flex items-center justify-center text-xl sm:text-2xl shadow-lg shadow-purple-500/20 shrink-0 border border-white/20`}>
            {rank.icon}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs sm:text-sm font-extrabold text-white truncate">
                {userProfile.name || 'דרגת כושר'}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border ${rank.badgeColor}`}>
                Level {rank.level} • {rank.title}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <Flame className="w-3.5 h-3.5 fill-current animate-pulse text-orange-500" />
                <span>{streakDays} ימי רצף</span>
              </span>
              <span className="text-purple-300 font-bold">{userXp} XP</span>
            </div>
          </div>
        </div>

        {/* AI Coach Trigger Button */}
        {onOpenCoach && (
          <button
            onClick={onOpenCoach}
            className="px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 flex items-center gap-1.5 shrink-0 transition-all border border-purple-400/30 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-purple-200 animate-spin-slow" />
            <span className="hidden sm:inline">מאמן AI</span>
            <span className="sm:hidden">מנטור</span>
          </button>
        )}
      </div>

      {/* Level Progress Bar */}
      <div className="space-y-1 relative z-10 pt-1">
        <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
          <span>התקדמות לרמה {rank.level + 1}</span>
          <span className="text-purple-300">{xpCurrentTier} / {xpSpanTier} XP ({progressPercent}%)</span>
        </div>

        <div className="w-full h-2.5 bg-slate-950/80 rounded-full p-0.5 border border-slate-800/80 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${rank.color} shadow-sm`}
          />
        </div>
      </div>
    </motion.div>
  );
}
