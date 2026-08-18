import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTargets } from '../utils/fitnessMath';

const getTodayString = () => new Date().toISOString().split('T')[0];

const defaultProfile = {
  age: 26,
  gender: 'male',
  heightCm: 178,
  currentWeightKg: 78,
  targetWeightKg: 72,
  goal: 'cut',
  activityLevel: 'moderate'
};

export const useFitnessStore = create(
  persist(
    (set, get) => ({
      // User Profile & Onboarding State
      onboardingCompleted: false,
      userProfile: defaultProfile,
      dailyTargets: calculateTargets(defaultProfile),
      geminiApiKey: '',

      // Selected Date Filter
      selectedDate: getTodayString(),

      // Daily Logs
      loggedMeals: [],
      waterMl: 1250,
      steps: 4120,
      stepTarget: 10000,

      // Actions
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),

      updateProfile: (profileUpdates) => {
        const updatedProfile = { ...get().userProfile, ...profileUpdates };
        const newTargets = calculateTargets(updatedProfile);
        set({
          userProfile: updatedProfile,
          dailyTargets: newTargets
        });
      },

      completeOnboarding: (profileData) => {
        const newTargets = calculateTargets(profileData);
        set({
          userProfile: profileData,
          dailyTargets: newTargets,
          onboardingCompleted: true
        });
      },

      setSelectedDate: (dateStr) => set({ selectedDate: dateStr }),

      // Meal Management
      addMeal: (meal) => {
        const dateStr = get().selectedDate || getTodayString();
        const newMeal = {
          id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          date: dateStr,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          food_name: meal.food_name || 'Meal Entry',
          total_calories: Number(meal.total_calories) || 0,
          protein_g: Number(meal.protein_g) || 0,
          carbs_g: Number(meal.carbs_g) || 0,
          fats_g: Number(meal.fats_g) || 0,
          weight_grams: Number(meal.weight_grams) || 200,
          explanation: meal.explanation || 'Analyzed via Gemini Vision AI',
          image: meal.image || null
        };
        set({ loggedMeals: [newMeal, ...get().loggedMeals] });
      },

      deleteMeal: (id) => {
        set({ loggedMeals: get().loggedMeals.filter((m) => m.id !== id) });
      },

      // Water & Steps Tracking
      addWater: (amount = 250) => set({ waterMl: Math.max(0, get().waterMl + amount) }),
      setWater: (amount) => set({ waterMl: Math.max(0, amount) }),

      addSteps: (amount = 100) => set({ steps: get().steps + amount }),
      setSteps: (count) => set({ steps: Math.max(0, count) }),
      setStepTarget: (target) => set({ stepTarget: target }),

      // Metrics Calculators for Selected Date
      getDailyTotals: () => {
        const state = get();
        const targetDate = state.selectedDate;
        const daysMeals = state.loggedMeals.filter((m) => m.date === targetDate);

        return daysMeals.reduce(
          (acc, meal) => {
            acc.calories += meal.total_calories;
            acc.protein += meal.protein_g;
            acc.carbs += meal.carbs_g;
            acc.fats += meal.fats_g;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );
      }
    }),
    {
      name: 'mycalcount-fitness-storage'
    }
  )
);
