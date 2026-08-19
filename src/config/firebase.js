import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCqFwU77GwLktAudCPWtZebSz6zsDxTmzM',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'mycalcalc-42d7d.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'mycalcalc-42d7d',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'mycalcalc-42d7d.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '57059935923',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:57059935923:web:8f1249fd6848a5b1d752c6'
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.apiKey !== '' && firebaseConfig.projectId
);

let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    googleProvider = new GoogleAuthProvider();
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

export {
  app,
  auth,
  db,
  googleProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  signInWithPopup,
  doc,
  setDoc,
  getDoc,
  onSnapshot
};

