// firebaseConfig.ts
// For Modular SDK (firebase/* packages)

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDf4JBbkx_8R7ASwY6QwiPMwSTDwEz23vk",
  authDomain: "periodpal-5438a.firebaseapp.com",
  projectId: "periodpal-5438a",
  storageBucket: "periodpal-5438a.firebasestorage.app",
  messagingSenderId: "751439780529",
  appId: "1:751439780529:web:543bebe207426b69caa090",
  measurementId: "G-DZHFYV4YFN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };