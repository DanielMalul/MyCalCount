import React from 'react';
import { Flame, Calendar, User, ChevronLeft, ChevronRight, LogOut, LogIn, Sparkles } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function Navbar({ onOpenApiKeyModal, onOpenProfileModal, onOpenAuthModal }) {
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const setSelectedDate = useFitnessStore((state) => state.setSelectedDate);
  const geminiApiKey = useFitnessStore((state) => state.geminiApiKey);
  const user = useFitnessStore((state) => state.user);
  const logout = useFitnessStore((state) => state.logout);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const formatDateLabel = (dateStr) => {
    if (isToday) return 'היום';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/60 px-4 py-3 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo & Warm Welcome */}
        <div className="flex items-center space-x-3 space-x-reverse">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-slate-100">
                MyCalCount
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                תזונה וכושר
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {user?.displayName ? `שלום, ${user.displayName} 👋` : 'שלום! מעקב תזונה יומי'}
            </p>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center bg-slate-900/90 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="יום קודם"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="flex items-center px-3 gap-1.5 min-w-[90px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-slate-200">{formatDateLabel(selectedDate)}</span>
          </div>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="יום הבא"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>

        {/* Actions & User Profile */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={onOpenApiKeyModal}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
              geminiApiKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="הגדרות Gemini AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">
              {geminiApiKey ? 'ניתוח AI פעיל' : 'מפתח API'}
            </span>
          </button>

          {user ? (
            <div className="flex items-center space-x-1 space-x-reverse">
              <button
                onClick={onOpenProfileModal}
                className="flex items-center space-x-2 space-x-reverse px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-200 transition-all"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden md:inline max-w-[90px] truncate">{user.displayName || user.email}</span>
              </button>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="התנתקות"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>התחברות</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
