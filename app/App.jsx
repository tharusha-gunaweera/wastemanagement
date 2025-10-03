import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import 'react-native-gesture-handler';
import Home from './screens/Home'; // Make sure this path is correct
import CommunityListScreen from './screens/Community/CommunityListScreen';
//import CommunityChatScreen from './screens/Community/CommunityChatScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/SignIn/SignIn';
import SignUpScreen from './screens/Signup/SignUp';
import SplashScreen from './screens/SplashScreen';

const Stack = createNativeStackNavigator(); 

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <SplashScreen onAnimationComplete={() => setIsLoading(false)} />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{ headerShown: false }}
        />
         <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Home" 
          component={Home}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="CommunityList" 
          component={CommunityListScreen}
          options={{ 
            title: 'Communities',
            headerStyle: { backgroundColor: '#EC4899' },
            headerTintColor: '#FFFFFF',
          }}
        />
        
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}