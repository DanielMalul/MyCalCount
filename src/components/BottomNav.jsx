import React from 'react';
import { Home, ChefHat, Camera, Calendar, User } from 'lucide-react';

export default function BottomNav({ activeTab = 'dashboard', setActiveTab, onOpenScanner, onOpenProfile }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800/80 px-2 py-1.5 flex items-center justify-around shadow-2xl pb-[env(safe-area-inset-bottom,0.75rem)]">
      {/* Home / Dashboard */}
      <button
        onClick={() => {
          if (setActiveTab) setActiveTab('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${
          activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">בית</span>
      </button>

      {/* My Meal Plan Presets */}
      <button
        onClick={() => {
          if (setActiveTab) setActiveTab('menu');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${
          activeTab === 'menu' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ChefHat className="w-5 h-5" />
        <span className="text-[10px]">התפריט שלי</span>
      </button>

      {/* Main Center Camera Scanner Trigger */}
      <button
        onClick={onOpenScanner}
        className="flex flex-col items-center justify-center p-3 -mt-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30 border-2 border-[#0b0f19] active:scale-95 transition-transform"
        title="צלם ארוחה ב-AI"
      >
        <Camera className="w-5 h-5" />
      </button>

      {/* Meal History Log */}
      <button
        onClick={() => {
          if (setActiveTab) setActiveTab('history');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        className={`flex flex-col items-center gap-0.5 p-1.5 transition-colors ${
          activeTab === 'history' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Calendar className="w-5 h-5" />
        <span className="text-[10px]">יומן ארוחות</span>
      </button>

      {/* Profile */}
      <button
        onClick={onOpenProfile}
        className="flex flex-col items-center gap-0.5 p-1.5 text-slate-400 hover:text-slate-200"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px]">פרופיל</span>
      </button>
    </nav>
  );
}
