import React from 'react';
import { motion } from 'framer-motion';
import { Droplet, Plus } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function WaterTrackerWidget() {
  const waterMl = useFitnessStore((state) => state.waterMl);
  const addWater = useFitnessStore((state) => state.addWater);
  const targetMl = 3000;

  const percentage = Math.min(100, Math.round((waterMl / targetMl) * 100));

  return (
    <div className="p-5 glass-panel rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
      <motion.div
        className="absolute bottom-0 left-0 right-0 bg-cyan-500/10 -z-10 transition-all duration-500"
        style={{ height: `${percentage}%` }}
      />

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Droplet className="w-5 h-5 animate-bounce" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">מעקב שתיית מים</h3>
            <p className="text-[11px] text-slate-400 font-medium">יעד הידרציה יומי</p>
          </div>
        </div>
        <span className="text-xs font-bold text-cyan-400 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          {percentage}%
        </span>
      </div>

      <div className="flex items-baseline space-x-1.5 space-x-reverse mb-3">
        <span className="text-2xl font-black text-white">{(waterMl / 1000).toFixed(2)}</span>
        <span className="text-xs text-slate-400 font-semibold">/ {(targetMl / 1000).toFixed(1)} ליטר ({waterMl} מ"ל)</span>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          onClick={() => addWater(250)}
          className="py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-cyan-400 text-xs font-bold text-slate-200 flex items-center justify-center gap-1 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" /> +250 מ"ל (כוס)
        </button>
        <button
          onClick={() => addWater(500)}
          className="py-2 px-3 rounded-xl bg-slate-900/60 border border-slate-700/80 hover:border-cyan-400 text-xs font-bold text-slate-200 flex items-center justify-center gap-1 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-3.5 h-3.5 text-cyan-400" /> +500 מ"ל (בקבוק)
        </button>
      </div>
    </div>
  );
}
