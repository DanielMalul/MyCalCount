import React from 'react';
import { Home, Camera, Droplet, User } from 'lucide-react';

export default function BottomNav({ onOpenScanner, onOpenProfile, onOpenAuth }) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-panel border-t border-slate-800/80 px-4 py-2 flex items-center justify-around shadow-2xl pb-[env(safe-area-inset-bottom,0.75rem)]">
      {/* Home / Dashboard */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        className="flex flex-col items-center gap-1 text-emerald-400 p-1.5"
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-bold">בית</span>
      </button>

      {/* Main Center Camera Scanner Trigger */}
      <button
        onClick={onOpenScanner}
        className="flex flex-col items-center justify-center p-3 -mt-6 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-xl shadow-emerald-500/30 border-2 border-[#0b0f19] active:scale-95 transition-transform"
        title="צלם ארוחה ב-AI"
      >
        <Camera className="w-6 h-6" />
      </button>

      {/* Profile / Auth */}
      <button
        onClick={onOpenProfile}
        className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-200 p-1.5"
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-bold">פרופיל</span>
      </button>
    </nav>
  );
}
