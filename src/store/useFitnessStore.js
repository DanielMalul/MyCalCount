import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { calculateTargets } from '../utils/fitnessMath';
import {
  auth,
  isFirebaseConfigured,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  googleProvider,
  db,
  doc,
  setDoc,
  getDoc,
  onSnapshot
} from '../config/firebase';

const getTodayString = () => new Date().toISOString().split('T')[0];

const defaultProfile = {
  age: 25,
  gender: 'male',
  heightCm: 175,
  currentWeightKg: 70,
  targetWeightKg: 65,
  goal: 'cut',
  activityLevel: 'moderate'
};

// Module-level real-time Firestore snapshot listener handles
let unbindMealsSnapshot = null;
let unbindProfileSnapshot = null;

const setupRealtimeListeners = (uid, dateStr, set) => {
  if (!isFirebaseConfigured || !db || !uid) return;

  // 1. Unbind old meal snapshot listener if date or user changed
  if (unbindMealsSnapshot) {
    unbindMealsSnapshot();
    unbindMealsSnapshot = null;
  }

  // 2. Setup real-time Profile listener (runs once per login)
  if (!unbindProfileSnapshot) {
    try {
      const userDocRef = doc(db, 'users', uid);
      unbindProfileSnapshot = onSnapshot(userDocRef, (userSnap) => {
        if (userSnap.exists()) {
          const cloudData = userSnap.data();
          if (cloudData.profile) {
            const newTargets = calculateTargets(cloudData.profile);
            set({
              userProfile: cloudData.profile,
              dailyTargets: newTargets,
              onboardingCompleted: true
            });
          }
        }
      });
    } catch (err) {
      console.error('Firestore real-time profile listener error:', err);
    }
  }

  // 3. Setup real-time Meals listener for the selected date
  try {
    const logDocRef = doc(db, 'users', uid, 'dailyLogs', dateStr);
    unbindMealsSnapshot = onSnapshot(logDocRef, (logSnap) => {
      if (logSnap.exists()) {
        const logData = logSnap.data();
        if (logData.meals && Array.isArray(logData.meals)) {
          set({ loggedMeals: logData.meals });
        } else {
          set({ loggedMeals: [] });
        }
      } else {
        set({ loggedMeals: [] });
      }
    });
  } catch (err) {
    console.error('Firestore real-time meals listener error:', err);
  }
};

export const useFitnessStore = create(
  persist(
    (set, get) => ({
      // User Auth State
      user: null,
      isAuthLoading: false,

      // User Profile & Onboarding State
      onboardingCompleted: false,
      userProfile: defaultProfile,
      dailyTargets: calculateTargets(defaultProfile),
      geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || '',

      // Selected Date Filter & Auto Day Sync
      selectedDate: getTodayString(),
      lastSystemDate: getTodayString(),

      syncTodayDate: () => {
        const today = getTodayString();
        const state = get();
        if (state.lastSystemDate !== today) {
          set({
            selectedDate: today,
            lastSystemDate: today
          });
          const user = state.user;
          if (user?.uid) {
            setupRealtimeListeners(user.uid, today, set);
          }
        }
      },

      // Daily Logs
      loggedMeals: [],
      waterMl: 0,
      steps: 0,
      stepTarget: 10000,

      // Initialize Firebase Auth Listener & Fetch User Cloud Data in Real-Time
      initAuthListener: () => {
        if (!isFirebaseConfigured || !auth) return;

        onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            const userData = {
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
              photoURL: firebaseUser.photoURL
            };
            set({ user: userData });

            // Setup real-time listeners for profile and meals
            const targetDate = get().selectedDate || getTodayString();
            setupRealtimeListeners(firebaseUser.uid, targetDate, set);
          } else {
            if (unbindMealsSnapshot) { unbindMealsSnapshot(); unbindMealsSnapshot = null; }
            if (unbindProfileSnapshot) { unbindProfileSnapshot(); unbindProfileSnapshot = null; }
            set({ user: null });
          }
        });
      },

      setUser: (user) => set({ user }),

      registerWithEmail: async (name, email, password) => {
        set({ isAuthLoading: true });
        if (!isFirebaseConfigured || !auth) {
          const mockUser = { uid: 'user_' + Date.now(), email, displayName: name };
          set({ user: mockUser, isAuthLoading: false });
          return mockUser;
        }

        try {
          const res = await createUserWithEmailAndPassword(auth, email, password);
          if (name && res.user) {
            await updateProfile(res.user, { displayName: name });
          }
          const userData = {
            uid: res.user.uid,
            email: res.user.email,
            displayName: name || res.user.email.split('@')[0]
          };
          set({ user: userData, isAuthLoading: false });

          // Save initial profile to Firestore
          const currentProfile = get().userProfile;
          if (db) {
            await setDoc(doc(db, 'users', res.user.uid), { profile: currentProfile }, { merge: true });
          }

          setupRealtimeListeners(res.user.uid, get().selectedDate || getTodayString(), set);
          return userData;
        } catch (err) {
          set({ isAuthLoading: false });
          throw err;
        }
      },

      loginWithEmail: async (email, password) => {
        set({ isAuthLoading: true });
        if (!isFirebaseConfigured || !auth) {
          const mockUser = { uid: 'user_local', email, displayName: email.split('@')[0] };
          set({ user: mockUser, isAuthLoading: false });
          return mockUser;
        }

        try {
          const res = await signInWithEmailAndPassword(auth, email, password);
          const userData = {
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName || res.user.email.split('@')[0]
          };
          set({ user: userData, isAuthLoading: false });

          setupRealtimeListeners(res.user.uid, get().selectedDate || getTodayString(), set);
          return userData;
        } catch (err) {
          set({ isAuthLoading: false });
          throw err;
        }
      },

      loginWithGoogle: async () => {
        set({ isAuthLoading: true });
        if (!isFirebaseConfigured || !auth || !googleProvider) {
          const mockUser = { uid: 'user_google', email: 'user@gmail.com', displayName: 'משתמש גוגל' };
          set({ user: mockUser, isAuthLoading: false });
          return mockUser;
        }

        try {
          const res = await signInWithPopup(auth, googleProvider);
          const userData = {
            uid: res.user.uid,
            email: res.user.email,
            displayName: res.user.displayName,
            photoURL: res.user.photoURL
          };
          set({ user: userData, isAuthLoading: false });

          setupRealtimeListeners(res.user.uid, get().selectedDate || getTodayString(), set);
          return userData;
        } catch (err) {
          set({ isAuthLoading: false });
          throw err;
        }
      },

      logout: async () => {
        if (unbindMealsSnapshot) { unbindMealsSnapshot(); unbindMealsSnapshot = null; }
        if (unbindProfileSnapshot) { unbindProfileSnapshot(); unbindProfileSnapshot = null; }
        if (isFirebaseConfigured && auth) {
          await signOut(auth);
        }
        set({ user: null, loggedMeals: [], waterMl: 0, steps: 0, onboardingCompleted: false });
      },

      // Profile Actions
      setGeminiApiKey: (key) => set({ geminiApiKey: key }),

      updateProfile: (profileUpdates) => {
        const updatedProfile = { ...get().userProfile, ...profileUpdates };
        const newTargets = calculateTargets(updatedProfile);
        set({
          userProfile: updatedProfile,
          dailyTargets: newTargets
        });

        const user = get().user;
        if (isFirebaseConfigured && db && user?.uid) {
          try {
            setDoc(doc(db, 'users', user.uid), { profile: updatedProfile }, { merge: true });
          } catch (e) {
            console.error('Firestore sync error:', e);
          }
        }
      },

      completeOnboarding: (profileData) => {
        const newTargets = calculateTargets(profileData);
        set({
          userProfile: profileData,
          dailyTargets: newTargets,
          onboardingCompleted: true
        });

        const user = get().user;
        if (isFirebaseConfigured && db && user?.uid) {
          try {
            setDoc(doc(db, 'users', user.uid), { profile: profileData }, { merge: true });
          } catch (e) {
            console.error('Firestore onboarding sync error:', e);
          }
        }
      },

      setSelectedDate: (dateStr) => {
        set({ selectedDate: dateStr });
        const user = get().user;
        if (user?.uid) {
          setupRealtimeListeners(user.uid, dateStr, set);
        }
      },

      // Meal Management
      addMeal: (meal) => {
        const dateStr = get().selectedDate || getTodayString();
        const newMeal = {
          id: 'meal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          date: dateStr,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          food_name: meal.food_name || 'ארוחה',
          total_calories: Number(meal.total_calories) || 0,
          protein_g: Number(meal.protein_g) || 0,
          carbs_g: Number(meal.carbs_g) || 0,
          fats_g: Number(meal.fats_g) || 0,
          weight_grams: Number(meal.weight_grams) || 200,
          explanation: meal.explanation || 'נותח באמצעות Gemini AI',
          image: meal.image || null
        };
        const updatedMeals = [newMeal, ...get().loggedMeals];
        set({ loggedMeals: updatedMeals });

        const user = get().user;
        if (isFirebaseConfigured && db && user?.uid) {
          try {
            setDoc(doc(db, 'users', user.uid, 'dailyLogs', dateStr), { meals: updatedMeals }, { merge: true });
          } catch (e) {
            console.error('Firestore meal sync error:', e);
          }
        }
      },

      updateMeal: (id, updatedFields) => {
        const updatedMeals = get().loggedMeals.map((m) => (m.id === id ? { ...m, ...updatedFields } : m));
        set({ loggedMeals: updatedMeals });

        const user = get().user;
        const dateStr = get().selectedDate;
        if (isFirebaseConfigured && db && user?.uid) {
          try {
            setDoc(doc(db, 'users', user.uid, 'dailyLogs', dateStr), { meals: updatedMeals }, { merge: true });
          } catch (e) {
            console.error('Firestore update sync error:', e);
          }
        }
      },

      deleteMeal: (id) => {
        const updatedMeals = get().loggedMeals.filter((m) => m.id !== id);
        set({ loggedMeals: updatedMeals });

        const user = get().user;
        const dateStr = get().selectedDate;
        if (isFirebaseConfigured && db && user?.uid) {
          try {
            setDoc(doc(db, 'users', user.uid, 'dailyLogs', dateStr), { meals: updatedMeals }, { merge: true });
          } catch (e) {
            console.error('Firestore delete sync error:', e);
          }
        }
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
      name: 'mycalcount-fitness-storage-v2'
    }
  )
);
