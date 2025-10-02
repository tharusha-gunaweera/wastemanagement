// App.jsx
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import SplashScreen from './screens/SplashScreen';
import LoginScreen from './screens/SignIn/SignIn';

const Stack = createNativeStackNavigator(); 

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading process (assets, data, etc.)
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds splash screen

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen onAnimationComplete={() => setIsLoading(false)} />;
  }

  return (
    
  
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        {/* Add other screens here */}
      </Stack.Navigator>
    
   
  );
}