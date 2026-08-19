import React, { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { useFitnessStore } from './store/useFitnessStore';

export default function App() {
  const initAuthListener = useFitnessStore((state) => state.initAuthListener);
  const syncTodayDate = useFitnessStore((state) => state.syncTodayDate);

  useEffect(() => {
    initAuthListener();
    if (syncTodayDate) syncTodayDate();

    // Auto-sync today's date when app gains focus or tab becomes visible
    const handleFocusOrVisibility = () => {
      if (syncTodayDate) syncTodayDate();
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    // Periodic check every 60 seconds to detect midnight rollover automatically
    const interval = setInterval(() => {
      if (syncTodayDate) syncTodayDate();
    }, 60000);

    return () => {
      window.removeEventListener('focus', handleFocusOrVisibility);
      document.removeEventListener('visibilitychange', handleFocusOrVisibility);
      clearInterval(interval);
    };
  }, [initAuthListener, syncTodayDate]);

  return (
    <div className="min-h-screen bg-[#0b0f19]">
      <Dashboard />
    </div>
  );
}

