// Import the functions you need from the SDKs you need
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import { getReactNativePersistence, initializeAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
export const app = initializeApp(firebaseConfig);
export const auth = initializeAuth(app,{
    persistence : getReactNativePersistence(ReactNativeAsyncStorage)
})
const analytics = getAnalytics(app);