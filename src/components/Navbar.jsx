import React from 'react';
import { Flame, Calendar, ChevronLeft, ChevronRight, LogOut, LogIn, Home, ChefHat, BookOpen, Bell, Dumbbell } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function Navbar({ activeTab = 'dashboard', setActiveTab, onOpenProfileModal, onOpenAuthModal, onOpenNotifications, onOpenWorkouts }) {
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const setSelectedDate = useFitnessStore((state) => state.setSelectedDate);
  const user = useFitnessStore((state) => state.user);
  const logout = useFitnessStore((state) => state.logout);

  const getTodayStr = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d - 1);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d + 1);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
  };

  const isToday = selectedDate === getTodayStr();

  const formatDateLabel = (dateStr) => {
    if (isToday) return 'היום';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('he-IL', { month: 'short', day: 'numeric' });
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/60 px-2.5 py-2.5 sm:px-6">
      <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5">
        
        {/* Brand Logo & Desktop Navigation Links */}
        <div className="flex items-center space-x-3 space-x-reverse min-w-0 shrink">
          <div
            onClick={() => setActiveTab && setActiveTab('dashboard')}
            className="flex items-center space-x-2 space-x-reverse cursor-pointer"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/20 text-white shrink-0">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 fill-current" />
            </div>
            <div className="min-w-0">
              <h1 className="font-extrabold text-sm sm:text-lg tracking-tight text-slate-100 truncate">
                MyCalCount
              </h1>
              <p className="text-[10px] text-slate-400 truncate hidden xs:block">
                {user?.displayName ? `שלום, ${user.displayName}` : 'מעקב תזונה'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-1 space-x-reverse mr-4">
            <button
              onClick={() => setActiveTab && setActiveTab('dashboard')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'dashboard'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" /> בית
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'menu'
                  ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ChefHat className="w-4 h-4" /> התפריט שלי
            </button>
            <button
              onClick={() => setActiveTab && setActiveTab('history')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-4 h-4" /> יומן ארוחות
            </button>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center space-x-1.5 space-x-reverse shrink-0">
          <div className="flex items-center bg-slate-900/90 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={handlePrevDay}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-slate-800 text-slate-400"
              title="יום קודם"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <div className="flex items-center px-1.5 sm:px-3 gap-1 min-w-[65px] sm:min-w-[90px] justify-center">
              <Calendar className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 shrink-0" />
              <span className="text-[11px] sm:text-xs font-bold text-slate-200">{formatDateLabel(selectedDate)}</span>
            </div>
            <button
              onClick={handleNextDay}
              className="p-1 sm:p-1.5 rounded-lg sm:rounded-xl hover:bg-slate-800 text-slate-400"
              title="יום הבא"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {!isToday && (
            <button
              onClick={() => setSelectedDate(getTodayStr())}
              className="px-2 py-1.5 sm:px-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-bold border border-emerald-500/20 transition-all shrink-0"
              title="חזור לתאריך של היום"
            >
              היום
            </button>
          )}
        </div>

        {/* User Actions & Quick Modals */}
        <div className="flex items-center space-x-1 sm:space-x-2 space-x-reverse shrink-0">
          {onOpenWorkouts && (
            <button
              onClick={onOpenWorkouts}
              className="p-1.5 sm:p-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 transition-colors"
              title="מחשבון אימונים"
            >
              <Dumbbell className="w-4 h-4" />
            </button>
          )}

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="p-1.5 sm:p-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 transition-colors relative"
              title="מרכז התראות AI"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </button>
          )}

          {user ? (
            <div className="flex items-center space-x-1 space-x-reverse">
              <button
                onClick={onOpenProfileModal}
                className="flex items-center space-x-1.5 space-x-reverse px-2.5 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-xs font-bold text-slate-200 transition-all"
              >
                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-gradient-to-tr from-emerald-500 to-indigo-500 flex items-center justify-center text-[10px] font-black text-white shrink-0">
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                </div>
                <span className="hidden sm:inline max-w-[80px] truncate">{user.displayName || user.email}</span>
              </button>

              <button
                onClick={logout}
                className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                title="התנתקות"
              >
                <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuthModal}
              className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold text-xs shadow-sm hover:opacity-90 transition-opacity flex items-center gap-1"
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

