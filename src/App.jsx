import React, { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { useFitnessStore } from './store/useFitnessStore';
import { checkAndSendReminders } from './services/notificationService';

export default function App() {
  const initAuthListener = useFitnessStore((state) => state.initAuthListener);
  const syncTodayDate = useFitnessStore((state) => state.syncTodayDate);

  useEffect(() => {
    initAuthListener();
    if (syncTodayDate) syncTodayDate();

    // Check reminders on launch
    checkAndSendReminders(useFitnessStore.getState());

    // Auto-sync today's date & check notifications when app gains focus or tab becomes visible
    const handleFocusOrVisibility = () => {
      if (syncTodayDate) syncTodayDate();
      checkAndSendReminders(useFitnessStore.getState());
    };

    window.addEventListener('focus', handleFocusOrVisibility);
    document.addEventListener('visibilitychange', handleFocusOrVisibility);

    // Periodic check every 60 seconds to detect midnight rollover & send scheduled reminders
    const interval = setInterval(() => {
      if (syncTodayDate) syncTodayDate();
      checkAndSendReminders(useFitnessStore.getState());
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

