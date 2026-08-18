import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Footprints, Flame, Navigation, Smartphone, CheckCircle, Plus } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function StepTrackerWidget() {
  const steps = useFitnessStore((state) => state.steps);
  const stepTarget = useFitnessStore((state) => state.stepTarget);
  const addSteps = useFitnessStore((state) => state.addSteps);

  const [sensorStatus, setSensorStatus] = useState('idle'); // 'idle' | 'active' | 'denied' | 'unsupported'
  const lastAccelRef = useRef(0);
  const lastStepTimeRef = useRef(0);

  // Request & Connect to Phone Motion Sensors (iOS Safari & Android Chrome)
  const requestMotionSensorPermission = async () => {
    if (typeof window.DeviceMotionEvent === 'undefined') {
      setSensorStatus('unsupported');
      return;
    }

    try {
      // iOS 13+ requires explicit permission request via click event
      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const response = await DeviceMotionEvent.requestPermission();
        if (response === 'granted') {
          startMotionListener();
        } else {
          setSensorStatus('denied');
        }
      } else {
        // Android and standard browsers
        startMotionListener();
      }
    } catch (err) {
      console.error('Motion sensor request error:', err);
      // Try direct listener attachment for Android
      startMotionListener();
    }
  };

  const startMotionListener = () => {
    const handleMotion = (event) => {
      const { x, y, z } = event.accelerationIncludingGravity || event.acceleration || {};
      if (!x || !y || !z) return;

      const accel = Math.sqrt(x * x + y * y + z * z);
      const delta = Math.abs(accel - lastAccelRef.current);
      lastAccelRef.current = accel;

      const now = Date.now();
      // Detect step acceleration threshold (delta > 11) with debouncing (minimum 250ms per step)
      if (delta > 11 && now - lastStepTimeRef.current > 250) {
        lastStepTimeRef.current = now;
        addSteps(1);
        setSensorStatus('active');
      }
    };

    window.addEventListener('devicemotion', handleMotion, true);
    setSensorStatus('active');
  };

  // Auto-listen if permission was previously granted
  useEffect(() => {
    if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission !== 'function') {
      startMotionListener();
    }
  }, []);

  const percentage = Math.min(100, Math.round((steps / (stepTarget || 10000)) * 100));
  const distanceKm = ((steps * 0.75) / 1000).toFixed(2);
  const caloriesBurned = Math.round(steps * 0.04);

  return (
    <div className="p-4 sm:p-5 glass-panel rounded-2xl sm:rounded-3xl border border-slate-800/80 shadow-xl relative overflow-hidden">
      <Footprints className="absolute -left-4 -bottom-4 w-32 h-32 text-emerald-500/5 -rotate-12 pointer-events-none" />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5 space-x-reverse">
          <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Footprints className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">מד צעדים</h3>
            <p className="text-[11px] text-slate-400 font-medium">
              {sensorStatus === 'active' ? 'חיישני תנועה בטלפון מחוברים' : 'חיבור לחיישני הטלפון'}
            </p>
          </div>
        </div>

        {/* Connect Sensor Button */}
        {sensorStatus !== 'active' ? (
          <button
            onClick={requestMotionSensorPermission}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-md hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <Smartphone className="w-3.5 h-3.5" /> חבר חיישן בטלפון
          </button>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> חיישן פעיל
          </span>
        )}
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
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 shadow-md"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800/80 text-center">
        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800">
          <p className="text-[10px] text-slate-400">אחוז מהיעד</p>
          <p className="text-xs font-bold text-emerald-400 mt-0.5">{percentage}%</p>
        </div>
        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Navigation className="w-3 h-3 text-indigo-400" /> מרחק
          </p>
          <p className="text-xs font-bold text-indigo-300 mt-0.5">{distanceKm} ק"מ</p>
        </div>
        <div className="bg-slate-900/40 p-2 rounded-xl border border-slate-800">
          <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-rose-400" /> נשרפו
          </p>
          <p className="text-xs font-bold text-rose-300 mt-0.5">{caloriesBurned} קלוריות</p>
        </div>
      </div>

      <div className="mt-3 flex justify-start">
        <button
          onClick={() => addSteps(500)}
          className="text-[11px] font-semibold text-slate-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3 h-3" /> הוסף +500 צעדים ידנית
        </button>
      </div>
    </div>
  );
}
