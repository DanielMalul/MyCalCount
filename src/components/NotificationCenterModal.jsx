import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Check, X, Sparkles, Droplet, Dumbbell, Flame, Moon, ShieldCheck, AlertCircle } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function NotificationCenterModal({ isOpen, onClose }) {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const getDailyTotals = useFitnessStore((state) => state.getDailyTotals);
  const streakDays = useFitnessStore((state) => state.streakDays || 3);
  const waterMl = useFitnessStore((state) => state.waterMl || 0);

  const [pushEnabled, setPushEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );
  const [pushStatusMsg, setPushStatusMsg] = useState('');

  if (!isOpen) return null;

  const dailyTotals = getDailyTotals();
  const remCalories = Math.max(0, (dailyTargets.targetCalories || 2000) - dailyTotals.calories);
  const remProtein = Math.max(0, (dailyTargets.proteinGrams || 150) - dailyTotals.protein);

  const handleTogglePush = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPushStatusMsg('הדפדפן שלך אינו תומך בהתראות פוש.');
      return;
    }

    if (Notification.permission === 'granted') {
      setPushEnabled(true);
      setPushStatusMsg('התראות פוש בדפדפן פעילות כעת!');
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setPushEnabled(true);
      setPushStatusMsg('התראות פוש הופעלו בהצלחה! 🎉');
      new Notification('MyCalCount AI', {
        body: 'התראות פוש הופעלו! תקבל תזכורות חכמות למים, חלבון וקלוריות.',
        icon: '/favicon.ico'
      });
    } else {
      setPushEnabled(false);
      setPushStatusMsg('הרשאת התראות נדחתה בהגדרות הדפדפן.');
    }
  };

  const smartNotifications = [
    {
      id: 'notif_streak',
      title: `רצף אש 🔥 של ${streakDays} ימים!`,
      body: 'כל הכבוד! שמרת על התמדה. רשום את ארוחות היום כדי להמשיך את הרצף.',
      icon: '🔥',
      time: 'לפני שעה',
      color: 'border-orange-500/30 bg-orange-950/20'
    },
    {
      id: 'notif_protein',
      title: `יעד חלבון: נותרו ${remProtein}ג'`,
      body: `הגעת ל-${dailyTotals.protein}ג' חלבון להיום. הוסף ארוחת בוקר/צהריים עשירה בחלבון להשגת היעד.`,
      icon: '🥩',
      time: 'לפני 3 שעות',
      color: 'border-purple-500/30 bg-purple-950/20'
    },
    {
      id: 'notif_water',
      title: waterMl < 1500 ? 'תזכורת שתייה 💧' : 'הידרציה מושלמת! 💧',
      body: waterMl < 1500 ? `שתית ${waterMl} מ"ל מים היום. שתה עוד 2-3 כוסות מים!` : `הגעת ל-${waterMl} מ"ל מים! שמור על המאזן.`,
      icon: '💧',
      time: 'לפני 4 שעות',
      color: 'border-teal-500/30 bg-teal-950/20'
    },
    {
      id: 'notif_calories',
      title: `יתרת קלוריות לערב: ${remCalories} קל'`,
      body: `נותרו לך ${remCalories} קלוריות להיום. חולל 3 אופציות ב-AI לערב ב"התפריט שלי"!`,
      icon: '🌙',
      time: 'לפני 5 שעות',
      color: 'border-indigo-500/30 bg-indigo-950/20'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-lg glass-panel rounded-3xl p-5 sm:p-7 text-white shadow-2xl border border-slate-700/60 max-h-[90vh] overflow-y-auto space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/20 shrink-0 text-white">
              <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-extrabold text-white truncate">
                מרכז התראות פוש AI
              </h2>
              <p className="text-xs text-slate-400 truncate">
                תזכורות בזמן אמת למים, חלבון וקלוריות
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

        {/* Browser Push Permission Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-3">
          <div className="space-y-0.5 min-w-0">
            <span className="text-xs font-extrabold text-white block">התראות דפדפן (Web Push)</span>
            <p className="text-[11px] text-slate-400">קבל תזכורות מים וחלבון ישירות למחשב ולטלפון</p>
          </div>

          <button
            onClick={handleTogglePush}
            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs shadow-md shrink-0 transition-all ${
              pushEnabled ? 'bg-emerald-500 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {pushEnabled ? 'מופעל (✓)' : 'הפעל התראות'}
          </button>
        </div>

        {pushStatusMsg && (
          <p className="text-xs text-emerald-400 font-bold text-center">{pushStatusMsg}</p>
        )}

        {/* Notifications Stream */}
        <div className="space-y-3">
          <span className="text-xs font-bold text-slate-400">התראות חכמות אחרונות:</span>

          {smartNotifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-3.5 rounded-2xl border text-xs space-y-1 ${notif.color}`}
            >
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-white flex items-center gap-1.5">
                  <span>{notif.icon}</span>
                  <span>{notif.title}</span>
                </span>
                <span className="text-[10px] text-slate-400">{notif.time}</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-snug">{notif.body}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
