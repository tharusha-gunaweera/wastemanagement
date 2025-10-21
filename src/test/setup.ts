// Simple setup that avoids console issues
import 'react-native-gesture-handler/jestSetup';

// Mock Firebase
jest.mock('@react-native-firebase/app', () => ({
  app: jest.fn(),
}));

jest.mock('@react-native-firebase/auth', () => ({
  auth: jest.fn(() => ({
    createUserWithEmailAndPassword: jest.fn(),
    signInWithEmailAndPassword: jest.fn(),
    signOut: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    updateProfile: jest.fn(),
    currentUser: null,
  })),
}));

jest.mock('@react-native-firebase/firestore', () => ({
  firestore: jest.fn(() => ({
    collection: jest.fn(),
    doc: jest.fn(),
    setDoc: jest.fn(),
    getDocs: jest.fn(),
    updateDoc: jest.fn(),
    deleteDoc: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    serverTimestamp: jest.fn(),
    Timestamp: {
      fromDate: jest.fn(),
    },
  })),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-location', () => ({}));
jest.mock('expo-font', () => ({}));
jest.mock('expo-constants', () => ({}));

// Mock React Navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Completely silence console during tests - SIMPLE VERSION
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});