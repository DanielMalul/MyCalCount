import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';

export default function CircularProgress({ consumed = 0, target = 2000, bmr = 1700, tdee = 2200 }) {
  const radius = 75;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;

  const actualPercentage = Math.round((consumed / (target || 1)) * 100);
  const percentageForRing = Math.min(100, Math.max(0, actualPercentage));
  const strokeDashoffset = circumference - (percentageForRing / 100) * circumference;

  const remaining = target - consumed;
  const isOverTarget = remaining < 0;

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 sm:p-6 glass-panel rounded-2xl sm:rounded-3xl border transition-colors shadow-xl overflow-hidden ${
      isOverTarget ? 'border-rose-500/30 bg-slate-900/90' : 'border-slate-800/60'
    }`}>
      {/* Background Soft Glow */}
      <div className={`absolute w-36 h-36 rounded-full blur-3xl -z-10 pointer-events-none transition-colors ${
        isOverTarget ? 'bg-rose-500/15' : 'bg-emerald-500/5'
      }`} />

      {/* Responsive Circular Progress Ring */}
      <div className="relative w-44 sm:w-52 h-44 sm:h-52 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 180 180">
          <defs>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
            <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F43F5E" />
              <stop offset="100%" stopColor="#FB923C" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx="90"
            cy="90"
            r={radius}
            stroke="rgba(30, 41, 59, 0.5)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Smooth Filled Ring */}
          <motion.circle
            cx="90"
            cy="90"
            r={radius}
            stroke={isOverTarget ? 'url(#warningGradient)' : 'url(#emeraldGradient)'}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            fill="transparent"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: 'easeInOut' }}
          />
        </svg>

        {/* Center Calorie Counter */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-2">
          <div className={`flex items-center space-x-1 space-x-reverse mb-0.5 font-medium ${
            isOverTarget ? 'text-rose-400' : 'text-emerald-400'
          }`}>
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="text-[10px] sm:text-xs font-semibold">קלוריות שנצרכו</span>
          </div>

          <motion.span
            key={consumed}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-2xl sm:text-4xl font-black tracking-tight ${
              isOverTarget ? 'text-rose-200' : 'text-white'
            }`}
          >
            {consumed.toLocaleString()}
          </motion.span>

          <div className="text-[10px] sm:text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-1">
            <span>מתוך <strong className="text-slate-200">{target.toLocaleString()}</strong> קל'</span>
            {actualPercentage > 0 && (
              <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                isOverTarget ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400'
              }`}>
                {actualPercentage}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Target Status Bar */}
      <div className={`mt-3 sm:mt-4 w-full flex items-center justify-between px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl sm:rounded-2xl border transition-colors ${
        isOverTarget ? 'bg-rose-950/40 border-rose-500/30' : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex items-center gap-1.5">
          <Zap className={`w-3.5 h-3.5 shrink-0 ${isOverTarget ? 'text-rose-400' : 'text-emerald-400'}`} />
          <span className="text-[11px] sm:text-xs text-slate-400 font-medium">סטטוס יעד:</span>
        </div>
        <span
          className={`text-[11px] sm:text-xs font-bold truncate max-w-[190px] ${
            isOverTarget ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {isOverTarget ? `חריגה של ${Math.abs(remaining).toLocaleString()} קל'` : `נשארו עוד ${remaining.toLocaleString()} קל'`}
        </span>
      </div>
    </div>
  );
}
