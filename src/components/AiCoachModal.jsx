import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Send, Bot, User, X, Dumbbell, Flame, Plus, Check, RefreshCw, MessageSquare } from 'lucide-react';
import { useFitnessStore } from '../store/useFitnessStore';
import { askAiNutritionCoach } from '../services/aiCoachService';

export default function AiCoachModal({ isOpen, onClose }) {
  const userProfile = useFitnessStore((state) => state.userProfile);
  const dailyTargets = useFitnessStore((state) => state.dailyTargets);
  const getDailyTotals = useFitnessStore((state) => state.getDailyTotals);
  const loggedMeals = useFitnessStore((state) => state.loggedMeals);
  const selectedDate = useFitnessStore((state) => state.selectedDate);
  const addMeal = useFitnessStore((state) => state.addMeal);

  const [messages, setMessages] = useState([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `היי ${userProfile.name || ''}! 👋 אני מנטור התזונה האישי שלך.\nאני רואה שנותרו לך להיום **${Math.max(0, dailyTargets.targetCalories - getDailyTotals().calories)} קלוריות** ו-**${Math.max(0, dailyTargets.proteinGrams - getDailyTotals().protein)}ג' חלבון**.\n\nמה תרצה לדעת? תוכל לשאול אותי מה לאכול בערב, איך לאזן ארוחה שאכלת בחוץ, או לקבל מתכונים וטיפים להשגת היעד!`
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [importedMealIds, setImportedMealIds] = useState({});
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const dailyTotals = getDailyTotals();
  const todayMeals = loggedMeals.filter((m) => m.date === selectedDate);

  const quickPrompts = [
    'אכלתי בחוץ, מה לאכול בערב כדי לא לחרוג?',
    'איזה נשנוש בריא מומלץ ל-200 קלוריות?',
    'מה לאכול אחרי אימון כוח להתאוששות ושריר?',
    'איך להחליף חזה עוף בארוחת צהריים?'
  ];

  const handleSendMessage = async (textToSend = input) => {
    const query = textToSend.trim();
    if (!query || isLoading) return;

    const userMsg = {
      id: 'user_' + Date.now(),
      role: 'user',
      content: query
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const responseText = await askAiNutritionCoach({
        userMessage: query,
        chatHistory: messages,
        userProfile,
        dailyTargets,
        dailyTotals,
        loggedMeals: todayMeals
      });

      const assistantMsg = {
        id: 'ai_' + Date.now(),
        role: 'assistant',
        content: responseText
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'error_' + Date.now(),
          role: 'assistant',
          content: 'מצטער, הייתה תקלה קטנה בתקשורת. אנא נסה לשאול שוב.'
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl h-[90vh] glass-panel rounded-3xl p-4 sm:p-6 text-white shadow-2xl border border-slate-700/60 flex flex-col justify-between overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-800 shrink-0">
          <div className="flex items-center space-x-3 space-x-reverse min-w-0">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 text-white shadow-lg shadow-purple-500/20 shrink-0">
              <Bot className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                  מנטור התזונה שלי AI
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  זמין 24/7
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                נותרו להיום: <span className="text-emerald-400 font-bold">{Math.max(0, dailyTargets.targetCalories - dailyTotals.calories)} קל'</span> | <span className="text-indigo-400 font-bold">{Math.max(0, dailyTargets.proteinGrams - dailyTotals.protein)}ג' חלבון</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages Stream Container */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4 px-1">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white shadow-md ${
                    isUser ? 'bg-emerald-500' : 'bg-gradient-to-tr from-purple-600 to-indigo-500'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-[85%] p-3.5 rounded-2xl text-xs sm:text-sm font-semibold leading-relaxed space-y-2 ${
                    isUser
                      ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-tl-none'
                      : 'bg-slate-900/90 text-slate-100 border border-slate-800 rounded-tr-none shadow-md'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-purple-300 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 max-w-[70%]">
              <div className="w-4 h-4 rounded-full border-2 border-purple-400 border-t-transparent animate-spin" />
              <span>המנטור כותב לך מענה מותאם אישית...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="pt-2 pb-1 overflow-x-auto flex gap-1.5 shrink-0 no-scrollbar">
          {quickPrompts.map((promptText, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(promptText)}
              className="py-1.5 px-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-bold whitespace-nowrap transition-colors shrink-0 flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3 text-purple-400" />
              <span>{promptText}</span>
            </button>
          ))}
        </div>

        {/* Send Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-2 border-t border-slate-800 shrink-0"
        >
          <input
            type="text"
            placeholder="שאל את מנטור התזונה AI בכל נושא..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 px-4 py-3 rounded-2xl glass-input text-xs sm:text-sm font-bold focus:border-purple-400"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white shadow-md disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </motion.div>
    </div>
  );
}
