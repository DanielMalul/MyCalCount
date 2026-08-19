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

const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

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

// Helper to compress heavy camera base64 photos to tiny JPEG thumbnails (< 10KB) to satisfy Firestore 1MB quota
const createLightweightThumbnail = (dataUrl) => {
  return new Promise((resolve) => {
    if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
      resolve(null);
      return;
    }
    if (dataUrl.length < 25000) {
      resolve(dataUrl);
      return;
    }
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const maxDim = 120;
        let w = img.width;
        let h = img.height;
        if (w > h) {
          if (w > maxDim) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          }
        } else {
          if (h > maxDim) {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      } catch (err) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = dataUrl;
  });
};

const sanitizeMealsForCloud = async (meals) => {
  return Promise.all(
    meals.map(async (m) => {
      let img = m.image;
      if (img && typeof img === 'string' && img.length > 25000) {
        img = await createLightweightThumbnail(img);
      }
      return {
        ...m,
        image: img
      };
    })
  );
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

      // Persisted AI Meal Plan Options & Custom Staples
      savedMealOptions: null,
      setSavedMealOptions: (options) => set({ savedMealOptions: options }),
      savedCustomMeals: [],
      setSavedCustomMeals: (meals) => set({ savedCustomMeals: meals }),

      // Gamified XP, Level & Streak Engine
      userXp: 180,
      streakDays: 3,
      addXp: (amount) => set((state) => ({ userXp: (state.userXp || 0) + amount })),
      incrementStreak: () => set((state) => ({ streakDays: (state.streakDays || 0) + 1 })),

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
      addMeal: async (meal) => {
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
            const cloudMeals = await sanitizeMealsForCloud(updatedMeals);
            await setDoc(doc(db, 'users', user.uid, 'dailyLogs', dateStr), { meals: cloudMeals }, { merge: true });
          } catch (e) {
            console.error('Firestore meal sync error:', e);
          }
        }
      },

      addMealsBatch: async (mealsArray) => {
        if (!Array.isArray(mealsArray) || mealsArray.length === 0) return;
        const dateStr = get().selectedDate || getTodayString();
        const timestamp = new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

        const newMeals = mealsArray.map((m, idx) => ({
          id: 'meal_' + (Date.now() + idx) + '_' + Math.random().toString(36).substring(2, 6),
          date: dateStr,
          timestamp: timestamp,
          food_name: m.food_name || 'ארוחה',
          total_calories: Math.max(0, Math.round(Number(m.total_calories) || 0)),
          protein_g: Math.max(0, Math.round(Number(m.protein_g) || 0)),
          carbs_g: Math.max(0, Math.round(Number(m.carbs_g) || 0)),
          fats_g: Math.max(0, Math.round(Number(m.fats_g) || 0)),
          weight_grams: Math.max(10, Math.round(Number(m.weight_grams) || 200)),
          explanation: m.explanation || 'תפריט מותאם מ-Gemini AI',
          image: m.image || null
        }));

        const updatedMeals = [...newMeals, ...get().loggedMeals];
        set({ loggedMeals: updatedMeals });

        const user = get().user;
        if (isFirebaseConfigured && db && user?.uid) {
          try {
            const cloudMeals = await sanitizeMealsForCloud(updatedMeals);
            await setDoc(doc(db, 'users', user.uid, 'dailyLogs', dateStr), { meals: cloudMeals }, { merge: true });
          } catch (e) {
            console.error('Firestore batch meal sync error:', e);
          }
        }
      },

      updateMeal: async (id, updatedFields) => {
        const updatedMeals = get().loggedMeals.map((m) => (m.id === id ? { ...m, ...updatedFields } : m));
        set({ loggedMeals: updatedMeals });

        const user = get().user;
        const dateStr = get().selectedDate;
        if (isFirebaseConfigured && db && user?.uid) {
          try {
            const cloudMeals = await sanitizeMealsForCloud(updatedMeals);
            await setDoc(doc(db, 'users', user.uid, 'dailyLogs', dateStr), { meals: cloudMeals }, { merge: true });
          } catch (e) {
            console.error('Firestore update sync error:', e);
          }
        }
      },

      deleteMeal: async (id) => {
        const updatedMeals = get().loggedMeals.filter((m) => m.id !== id);
        set({ loggedMeals: updatedMeals });

        const user = get().user;
        const dateStr = get().selectedDate;
        if (isFirebaseConfigured && db && user?.uid) {
          try {
            const cloudMeals = await sanitizeMealsForCloud(updatedMeals);
            await setDoc(doc(db, 'users', user.uid, 'dailyLogs', dateStr), { meals: cloudMeals }, { merge: true });
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

      // Workouts & Exercise Tracking
      loggedWorkouts: [],
      addWorkout: (workout) => {
        const dateStr = get().selectedDate || getTodayString();
        const newWorkout = {
          id: 'workout_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          date: dateStr,
          timestamp: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
          name: workout.name || 'אימון',
          burned_calories: Math.max(0, Number(workout.burned_calories) || 0),
          duration_minutes: Math.max(5, Number(workout.duration_minutes) || 30),
          type: workout.type || 'fitness',
          explanation: workout.explanation || ''
        };

        set((state) => ({
          loggedWorkouts: [newWorkout, ...state.loggedWorkouts],
          userXp: (state.userXp || 0) + 100 // +100 XP Bonus for working out!
        }));
      },

      deleteWorkout: (id) => {
        set((state) => ({
          loggedWorkouts: state.loggedWorkouts.filter((w) => w.id !== id)
        }));
      },

      // Metrics Calculators for Selected Date
      getDailyTotals: () => {
        const state = get();
        const targetDate = state.selectedDate;
        const daysMeals = state.loggedMeals.filter((m) => m.date === targetDate);
        const daysWorkouts = (state.loggedWorkouts || []).filter((w) => w.date === targetDate);

        const totals = daysMeals.reduce(
          (acc, meal) => {
            acc.calories += meal.total_calories;
            acc.protein += meal.protein_g;
            acc.carbs += meal.carbs_g;
            acc.fats += meal.fats_g;
            return acc;
          },
          { calories: 0, protein: 0, carbs: 0, fats: 0 }
        );

        const burnedCalories = daysWorkouts.reduce((acc, w) => acc + (Number(w.burned_calories) || 0), 0);
        totals.burnedCalories = burnedCalories;
        totals.netCalories = Math.max(0, totals.calories - burnedCalories);

        return totals;
      }
    }),
    {
      name: 'mycalcount-fitness-storage-v2'
    }
  )
);
