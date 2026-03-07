import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCVe9yRWAZEO_wjLNya1l_PeB-gJW3uWkk",
  authDomain: "csuf-users-cd8ec.firebaseapp.com",
  projectId: "csuf-users-cd8ec",
  storageBucket: "csuf-users-cd8ec.firebasestorage.app",
  messagingSenderId: "631450114131",
  appId: "1:631450114131:web:2734b487bda05dcc0c0ea6",
  measurementId: "G-KFMWWTGWF9"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
export const db = getFirestore(app);
export default app;