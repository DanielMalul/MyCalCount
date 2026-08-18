import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Lock, X, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { isFirebaseConfigured } from '../config/firebase';

export default function AuthModal({ isOpen, onClose }) {
  const loginWithEmail = useFitnessStore((state) => state.loginWithEmail);
  const registerWithEmail = useFitnessStore((state) => state.registerWithEmail);
  const loginWithGoogle = useFitnessStore((state) => state.loginWithGoogle);
  const isAuthLoading = useFitnessStore((state) => state.isAuthLoading);

  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!email || !password) {
      setErrorMsg('אנא הכנס דוא"ל וסיסמה.');
      return;
    }

    try {
      if (mode === 'signup') {
        if (!name) {
          setErrorMsg('אנא הכנס שם מלא.');
          return;
        }
        await registerWithEmail(name, email, password);
      } else {
        await loginWithEmail(email, password);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'התחברות נכשלה.');
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg('');
    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'התחברות עם גוגל נכשלה.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md glass-panel rounded-3xl p-6 sm:p-8 text-white shadow-2xl border border-slate-700/60"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2.5 space-x-reverse">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-cyan-400 via-purple-500 to-pink-500 shadow-lg shadow-cyan-500/20">
              <User className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100">
                {mode === 'login' ? 'ברוך הבא למערכת' : 'הרשמה לחשבון חדש'}
              </h2>
              <p className="text-xs text-slate-400">
                {isFirebaseConfigured ? 'אבטחת Firebase וסנכרון ענן' : 'פרופיל תזונה וכושר'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex bg-slate-900/80 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" /> התחברות
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'signup'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" /> הרשמה
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-pink-500/10 border border-pink-500/30 text-pink-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">שם מלא</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="דניאל מלול"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pr-10 pl-4 py-3 rounded-xl glass-input text-xs font-bold"
                />
                <User className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">כתובת דוא"ל</label>
            <div className="relative">
              <input
                type="email"
                placeholder="user@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl glass-input text-xs font-bold"
              />
              <Mail className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">סיסמה</label>
            <div className="relative">
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pr-10 pl-4 py-3 rounded-xl glass-input text-xs font-bold"
              />
              <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isAuthLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2 mt-2"
          >
            {isAuthLoading ? (
              <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" /> התחבר למערכת
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" /> צור חשבון חדש
              </>
            )}
          </button>
        </form>

        <div className="my-5 flex items-center text-slate-600">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="px-3 text-[11px] font-semibold text-slate-500">או התחבר באמצעות</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="w-full py-3 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-cyan-400/50 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.2 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3s.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.2-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
          חשבון Google
        </button>
      </motion.div>
    </div>
  );
}
