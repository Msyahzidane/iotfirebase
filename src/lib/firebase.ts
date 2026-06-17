import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBj6bhAq584TStUQDuP-Ee0rBuxnbjgyoA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dane-27e94.firebaseapp.com",
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://dane-27e94-default-rtdb.firebaseio.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dane-27e94",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dane-27e94.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "642895634314",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:642895634314:web:7c0cb669158acf38d5f273",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-JG52NNVGL4"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getDatabase(app);
