import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA7PVmNQx8ToWQToH5T8rB5EsEQSQ_yfV8",
  authDomain: "smartwastemanagement-f4373.firebaseapp.com",
  projectId: "smartwastemanagement-f4373",
  storageBucket: "smartwastemanagement-f4373.firebasestorage.app",
  messagingSenderId: "165332620465",
  appId: "1:165332620465:web:d553d6be06194197bb7e90"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore with better error handling
const db = getFirestore(app);

// Enable offline persistence (optional)
enableIndexedDbPersistence(db).catch((err) => {
  console.warn('Firestore offline persistence error:', err.code);
});

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
