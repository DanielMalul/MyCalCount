import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Key, ExternalLink, X, Check, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';

export default function ApiKeyModal({ isOpen, onClose }) {
  const geminiApiKey = useFitnessStore((state) => state.geminiApiKey);
  const setGeminiApiKey = useFitnessStore((state) => state.setGeminiApiKey);

  const [inputKey, setInputKey] = useState(geminiApiKey || import.meta.env.VITE_GEMINI_API_KEY || '');
  const [showKey, setShowKey] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    setGeminiApiKey(inputKey.trim());
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-md glass-panel rounded-3xl p-6 text-white shadow-2xl border border-slate-700/60"
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-cyan-400 to-purple-600 shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Gemini Vision API Key</h2>
              <p className="text-xs text-slate-400">AI Meal Analysis Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Active Key Status Card */}
        {inputKey ? (
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 mb-4 flex items-center space-x-2.5 text-xs text-emerald-300">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="font-bold">Gemini AI Active & Configured</p>
              <p className="text-[11px] text-emerald-400/80">Your API key is active. Food scanning works automatically!</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-300 leading-relaxed mb-4">
            Enter your Google Gemini API key to enable instant meal vision analysis.
          </p>
        )}

        <div className="space-y-4">
          <div className="relative">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
              <Key className="w-3.5 h-3.5 text-cyan-400" /> API Key
            </label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder="AIzaSy..."
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-xl glass-input text-xs font-mono tracking-wider"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-semibold"
          >
            Get a free Gemini API Key from Google AI Studio <ExternalLink className="w-3 h-3" />
          </a>

          <div className="pt-3 border-t border-slate-800/80 flex items-center justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-600 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 hover:scale-105 transition-transform flex items-center gap-1.5"
            >
              {savedSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : 'Save Key'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
