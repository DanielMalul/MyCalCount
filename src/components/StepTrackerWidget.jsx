import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Footprints, Flame, Navigation, Play, Pause, Plus } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export function useNativePedometer(onStepDetected) {
  const [isSensorActive, setIsSensorActive] = useState(false);
  const lastAccelRef = useRef(0);

  useEffect(() => {
    let handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity || {};
      if (!x || !y || !z) return;

      const accelerationMagnitude = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(accelerationMagnitude - lastAccelRef.current);
      lastAccelRef.current = accelerationMagnitude;

      if (delta > 12) {
        onStepDetected(1);
      }
    };

    if (window.DeviceMotionEvent) {
      window.addEventListener('devicemotion', handleMotion);
      setIsSensorActive(true);
    }

    return () => {
      if (window.DeviceMotionEvent) {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [onStepDetected]);

  return { isSensorActive };
}

export default function StepTrackerWidget() {
  const steps = useFitnessStore((state) => state.steps);
  const stepTarget = useFitnessStore((state) => state.stepTarget);
  const addSteps = useFitnessStore((state) => state.addSteps);

  const [isSimulating, setIsSimulating] = useState(false);

  const { isSensorActive } = useNativePedometer(() => {
    addSteps(1);
  });

  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        const added = Math.floor(Math.random() * 4) + 2;
        addSteps(added);
      }, 700);
    }
    return () => clearInterval(interval);
  }, [isSimulating, addSteps]);

  const percentage = Math.min(100, Math.round((steps / (stepTarget || 10000)) * 100));
  const distanceKm = ((steps * 0.75) / 1000).toFixed(2);
  const caloriesBurned = Math.round(steps * 0.04);

  return (
    <div className="p-5 glass-panel rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
      <Footprints className="absolute -left-4 -bottom-4 w-32 h-32 text-cyan-500/5 -rotate-12 pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Footprints className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">מד צעדים</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {isSensorActive ? 'חיישני תנועה פעילים' : 'מעקב הליכה יומי'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsSimulating(!isSimulating)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            isSimulating
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-500/20'
              : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
          }`}
        >
          {isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isSimulating ? 'הליכה בפועל...' : 'סימולציית הליכה'}
        </button>
      </div>

      <div className="flex items-baseline space-x-2 space-x-reverse mb-3">
        <motion.span
          key={steps}
          initial={{ opacity: 0.8, y: -2 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-black tracking-tight text-white"
        >
          {steps.toLocaleString()}
        </motion.span>
        <span className="text-xs text-slate-400 font-semibold">/ {stepTarget.toLocaleString()} צעדים</span>
      </div>

      <div className="w-full bg-slate-800/80 h-2.5 rounded-full overflow-hidden mb-4 p-0.5 border border-slate-700/50">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400 shadow-md shadow-cyan-500/30"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800">
          <p className="text-[10px] text-slate-400">אחוז מהיעד</p>
          <p className="text-xs font-bold text-cyan-400 mt-0.5">{percentage}%</p>
        </div>
        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Navigation className="w-3 h-3 text-purple-400" /> מרחק
          </p>
          <p className="text-xs font-bold text-purple-300 mt-0.5">{distanceKm} ק"מ</p>
        </div>
        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-pink-400" /> נשרפו
          </p>
          <p className="text-xs font-bold text-pink-300 mt-0.5">{caloriesBurned} קלוריות</p>
        </div>
      </div>

      <div className="mt-3 flex justify-start">
        <button
          onClick={() => addSteps(500)}
          className="text-[11px] font-semibold text-slate-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> הוסף +500 צעדים
        </button>
      </div>
    </div>
  );
}
