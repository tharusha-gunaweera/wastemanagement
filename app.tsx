import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Colors } from './src/constants/Colors';
import { UserTabNavigator } from './src/navigation/UserTabNavigator';
import WelcomeScreen from './src/screens/WelcomeScreen';
import { SignInScreen } from './src/screens/auth/SignInScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import { DriverDashboardScreen } from './src/screens/main/DriverDashboardScreen';
import { AuthService } from './src/services/auth/AuthService';
import { LocalStorageService } from './src/services/storage/LocalStorageService';
import AdminDashboardScreen from './src/screens/admin/AdminDashboard';

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Welcome2: undefined;
  Dashboard: undefined;
  Dashboard2: undefined;
  DriverDashboard: undefined;
  DriverDashboard2: undefined;
  AdminDashboard: undefined; // Add AdminDashboard here
};

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userAccessLevel, setUserAccessLevel] = useState<number | null>(null);

  const authService = new AuthService();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check local storage first for faster loading
      const isLoggedIn = await LocalStorageService.isUserLoggedIn();
      const accessLevel = await LocalStorageService.getAccessLevel();
      
      if (isLoggedIn && accessLevel) {
        setIsAuthenticated(true);
        setUserAccessLevel(accessLevel);
      } else {
        // Fallback to Firebase auth
        const user = authService.getCurrentUser();
        if (user) {
          // If user exists in Firebase but not in local storage, refresh the data
          const fullUser = await authService.getCurrentUserWithLocalStorage();
          if (fullUser) {
            setIsAuthenticated(true);
            setUserAccessLevel(fullUser.accessLevel);
          } else {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: Colors.text.primary }}>
          Loading Smart Waste Management...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: Colors.primary,
          },
          headerTintColor: Colors.text.inverse,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
          cardStyle: {
            backgroundColor: Colors.background,
          },
        }}
      >
        {isAuthenticated ? (
          // Authenticated screens - redirect based on access level
          userAccessLevel === 3 ? ( // Add Admin condition first
            <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
              options={{
                title: 'Admin Dashboard',
                headerShown: true,
              }}
            />
          ) : userAccessLevel === 2 ? (
            <Stack.Screen
              name="DriverDashboard"
              component={DriverDashboardScreen}
              options={{
                title: 'Driver Dashboard',
                headerShown: true,
              }}
            />
          ) : (
            // Regular user authenticated screens
            <>
              <Stack.Screen
                name="Dashboard"
                component={UserTabNavigator}
                options={{
                  title: 'Dashboard',
                  headerShown: false,
                }}
              />
              
            </>
          )
        ) : (
          // Unauthenticated screens
          <>
            <Stack.Screen
              name="Welcome"
              component={WelcomeScreen}
              options={{
                headerShown: false,
              }}
            />
            
            
          </>
        )}
        <Stack.Screen
              name="DriverDashboard2"
              component={DriverDashboardScreen}
              options={{
                title: 'Driver Dashboard',
                headerShown: true,
              }}
            />
        <Stack.Screen
              name="SignIn"
              component={SignInScreen}
              options={{
                title: 'Sign In',
                headerShown: true,
              }}
            />
        <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{
                title: 'Create Account',
                headerShown: true,
              }}
            />
        <Stack.Screen
                name="Dashboard2"
                component={UserTabNavigator}
                options={{
                  title: 'Dashboard 2',
                  headerShown: false,
                }}
        />
        <Stack.Screen
              name="Welcome2"
              component={WelcomeScreen}
              options={{
                headerShown: false,
              }}
        />
        {/* Add AdminDashboard screen for direct navigation */}
        <Stack.Screen
              name="AdminDashboard"
              component={AdminDashboardScreen}
              options={{
                title: 'Admin Dashboard',
                headerShown: true,
              }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}