import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import 'react-native-gesture-handler';

// Import BottomTabNavigator instead of Home
import LoginScreen from './screens/auth/SignIn/SignIn';
import SignUpScreen from './screens/auth/Signup/SignUp';
import CommunityListScreen from './screens/Community/CommunityListScreen';
import BottomTabNavigator from './screens/navigation/BottomTabNavigator';
import OnboardingScreen from './screens/OnboardingScreen';
import SplashScreen from './screens/SplashScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  // 🔹 Check AsyncStorage for existing user
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const user = await AsyncStorage.getItem('user');
        console.log("User is", user);
        setIsLoggedIn(!!user);
      } catch (error) {
        console.log('Error reading user data:', error);
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  if (isLoading) {
    return <SplashScreen onAnimationComplete={() => setIsLoading(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isLoggedIn ? (
          // 🔹 Show BottomTabNavigator if logged in
          <Stack.Screen name="MainApp" component={BottomTabNavigator} />
        ) : (
          // Otherwise show onboarding + auth flow
          <>
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}

        {/* 🔹 Community screens - can be accessed from anywhere */}
        <Stack.Screen
          name="CommunityList"
          component={CommunityListScreen}
          options={{
            title: 'Communities',
            headerStyle: { backgroundColor: '#EC4899' },
            headerTintColor: '#FFFFFF',
            headerShown: true,
          }}
        />
       
      </Stack.Navigator>
    </NavigationContainer>
  );
}