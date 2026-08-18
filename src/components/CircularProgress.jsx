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
    <div className="relative flex flex-col items-center justify-center p-6 glass-panel rounded-3xl border border-slate-800/80 shadow-2xl">
      {/* Glow Backdrop */}
      <div className="absolute w-44 h-44 rounded-full bg-cyan-500/10 blur-3xl -z-10 pointer-events-none" />

      {/* Circular SVG Ring */}
      <div className="relative w-52 h-52 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <defs>
            <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F5D4" />
              <stop offset="50%" stopColor="#7000FF" />
              <stop offset="100%" stopColor="#FF007A" />
            </linearGradient>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#00F5D4" floodOpacity="0.5" />
            </filter>
          </defs>

          {/* Background Track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            stroke="rgba(30, 41, 59, 0.6)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          {/* Animated Glowing Ring */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            stroke="url(#cyanGradient)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            fill="transparent"
            filter="url(#glow)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </svg>

        {/* Center Calorie Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="flex items-center space-x-1 space-x-reverse text-cyan-400 mb-0.5">
            <Flame className="w-4 h-4 animate-bounce" />
            <span className="text-[11px] font-bold tracking-wider">קלוריות שנצרכו</span>
          </div>

          <motion.span
            key={consumed}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white"
          >
            {consumed.toLocaleString()}
          </motion.span>

          <div className="text-xs text-slate-400 font-medium mt-0.5">
            מתוך <span className="text-slate-200 font-bold">{target.toLocaleString()}</span> קלוריות
          </div>
        </div>
      </div>

      {/* Target Status Banner */}
      <div className="mt-4 w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-xs text-slate-400 font-medium">יעד יומי:</span>
        </div>
        <span
          className={`text-xs font-bold ${
            isOverTarget ? 'text-pink-400 neon-text-pink' : 'text-cyan-400 neon-text-cyan'
          }`}
        >
          {isOverTarget ? `חריגה של ${Math.abs(remaining)} קלוריות` : `נשארו עוד ${remaining} קלוריות`}
        </span>
      </div>
    </div>
  );
}
