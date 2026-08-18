import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Zap } from 'lucide-react';

export default function CircularProgress({ consumed = 0, target = 2000, bmr = 1700, tdee = 2200 }) {
  const radius = 80;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;

  const percentage = Math.min(100, Math.max(0, (consumed / (target || 1)) * 100));
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const remaining = target - consumed;
  const isOverTarget = remaining < 0;

  return (
    <div className="relative flex flex-col items-center justify-center p-6 glass-panel rounded-3xl border border-slate-800/60 shadow-xl">
      {/* Background Soft Glow */}
      <div className="absolute w-40 h-40 rounded-full bg-emerald-500/5 blur-3xl -z-10 pointer-events-none" />

      {/* Circular Progress Ring */}
      <div className="relative w-52 h-52 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="emeraldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#14B8A6" />
            </linearGradient>
          </defs>

          {/* Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="rgba(30, 41, 59, 0.5)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Smooth Filled Ring */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#emeraldGradient)"
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
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="flex items-center space-x-1 space-x-reverse text-emerald-400 mb-0.5 font-medium">
            <Flame className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold">קלוריות שנצרכו</span>
          </div>

          <motion.span
            key={consumed}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl sm:text-4xl font-black tracking-tight text-white"
          >
            {consumed.toLocaleString()}
          </motion.span>

          <div className="text-xs text-slate-400 font-medium mt-0.5">
            מתוך <span className="text-slate-200 font-bold">{target.toLocaleString()}</span> קל'
          </div>
        </div>
      </div>

      {/* Target Status Bar */}
      <div className="mt-4 w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-emerald-400" />
          <span className="text-xs text-slate-400 font-medium">סטטוס יעד:</span>
        </div>
        <span
          className={`text-xs font-bold ${
            isOverTarget ? 'text-rose-400' : 'text-emerald-400'
          }`}
        >
          {isOverTarget ? `חריגה של ${Math.abs(remaining)} קלוריות` : `נשארו עוד ${remaining} קלוריות ליעד`}
        </span>
      </div>
    </div>
  );
}
