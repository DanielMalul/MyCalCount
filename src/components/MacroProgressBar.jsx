import React from 'react';
import { motion } from 'framer-motion';

export default function MacroProgressBar({ label, consumed = 0, target = 100, color = 'purple', icon: Icon }) {
  const percent = Math.min(100, Math.max(0, (consumed / (target || 1)) * 100));

  const colorStyles = {
    purple: {
      bar: 'from-indigo-500 to-blue-400',
      text: 'text-indigo-400'
    },
    amber: {
      bar: 'from-amber-500 to-yellow-400',
      text: 'text-amber-400'
    },
    pink: {
      bar: 'from-rose-500 to-pink-400',
      text: 'text-rose-400'
    }
  };

  const style = colorStyles[color] || colorStyles.purple;

  return (
    <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 shadow-md">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`w-4 h-4 ${style.text}`} />}
          <span className="text-xs font-bold text-slate-200">{label}</span>
        </div>
        <div className="flex items-center space-x-1 space-x-reverse">
          <span className="text-sm font-extrabold text-white">{consumed}ג'</span>
          <span className="text-xs text-slate-400 font-medium">/ {target}ג'</span>
        </div>
      </div>

      <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${style.bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400 font-medium">
        <span>{Math.round(percent)}% מהיעד</span>
        <span>נשארו עוד {Math.max(0, target - consumed)}ג'</span>
      </div>
    </div>
  );
}
