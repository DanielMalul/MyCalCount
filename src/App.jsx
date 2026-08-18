import React, { useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import { useFitnessStore } from './store/useFitnessStore';

export default function App() {
  const initAuthListener = useFitnessStore((state) => state.initAuthListener);

  useEffect(() => {
    initAuthListener();
  }, [initAuthListener]);

  return (
    <div className="min-h-screen bg-[#0b0f19]">
      <Dashboard />
    </div>
  );
}
