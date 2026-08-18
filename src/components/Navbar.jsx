import React from 'react';
import { Flame, Calendar, Settings, User, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function Navbar({ onOpenApiKeyModal, onOpenProfileModal }) {
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const setSelectedDate = useFitnessStore((state) => state.setSelectedDate);
  const geminiApiKey = useFitnessStore((state) => state.geminiApiKey);
  const userProfile = useFitnessStore((state) => state.userProfile);

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
    if (isToday) return 'Today';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-lg shadow-cyan-500/25">
            <Flame className="w-5 h-5 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-slate-300">
                MyCalCount
              </h1>
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
                VISION AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Smart Macro & Fitness Tracker</p>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center bg-slate-900/80 p-1 rounded-2xl border border-slate-800 shadow-inner">
          <button
            onClick={handlePrevDay}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center px-3 gap-1.5 min-w-[90px] justify-center">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-xs font-bold text-slate-200">{formatDateLabel(selectedDate)}</span>
          </div>
          <button
            onClick={handleNextDay}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-2">
          {/* Gemini API Key Status */}
          <button
            onClick={onOpenApiKeyModal}
            className={`p-2 sm:px-3 sm:py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-1.5 ${
              geminiApiKey
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
            }`}
            title="Gemini API Key Settings"
          >
            <Sparkles className="w-4 h-4" />
            <span className="hidden sm:inline">
              {geminiApiKey ? 'Gemini AI Active' : 'API Key Setup'}
            </span>
          </button>

          {/* User Profile Button */}
          <button
            onClick={onOpenProfileModal}
            className="p-2.5 rounded-xl glass-input hover:border-cyan-400 text-slate-300 transition-all"
            title="User Profile Settings"
          >
            <User className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
