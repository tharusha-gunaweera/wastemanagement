import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Colors } from './src/constants/Colors';
import { UserTabNavigator } from './src/navigation/UserTabNavigator';
import WelcomeScreen from './src/screens/WelcomeScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboard';
import WasteManagementAuthorityScreen from './src/screens/admin/WasteManagementAuthorityScreen';
import { SignInScreen } from './src/screens/auth/SignInScreen';
import { SignUpScreen } from './src/screens/auth/SignUpScreen';
import MyBucketsScreen from './src/screens/buckets/MyBucketsScreen';
import { DriverDashboardScreen } from './src/screens/main/DriverDashboardScreen';
import ProfileScreen from './src/screens/main/ProfileScreen';
import Map from './src/screens/map/MapScreen';
import { AuthService } from './src/services/auth/AuthService';
import { LocalStorageService } from './src/services/storage/LocalStorageService';

export type RootStackParamList = {
  Welcome: undefined;
  SignIn: undefined;
  SignUp: undefined;
  Map: undefined;
  Welcome2: undefined;
  Dashboard: undefined;
  Dashboard2: undefined;
  DriverDashboard: undefined;
  DriverDashboard2: undefined;
  AdminDashboard: undefined;
  WasteManagementAuthority: undefined;
  WasteManagementAuthority2:undefined;
  MyBuckets: undefined;
  Profile: undefined;
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
      const isLoggedIn = await LocalStorageService.isUserLoggedIn();
      const accessLevel = await LocalStorageService.getAccessLevel();
      
      if (isLoggedIn && accessLevel) {
        setIsAuthenticated(true);
        setUserAccessLevel(accessLevel);
      } else {
        const user = authService.getCurrentUser();
        if (user) {
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
          userAccessLevel === 3 ? (
            // Waste Management Authority (Access Level 3)
            <Stack.Screen
              name="WasteManagementAuthority"
              component={WasteManagementAuthorityScreen}
              options={{
                title: 'Waste Management Authority',
                headerShown: true,
              }}
            />
          ) : userAccessLevel === 2 ? (
            // Driver (Access Level 2)
            <Stack.Screen
              name="DriverDashboard"
              component={DriverDashboardScreen}
              options={{
                title: 'Driver Dashboard',
                headerShown: true,
              }}
            />
          ) : (
            // Regular User (Access Level 1)
            <Stack.Screen
              name="Dashboard"
              component={UserTabNavigator}
              options={{
                headerShown: false,
              }}
            />
          )
        ) : (
          // Unauthenticated users
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
        
        {/* Additional screens for navigation from within the app */}
        <Stack.Screen name="MyBuckets" component={MyBucketsScreen} options={{ title: 'My Buckets' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen name="Map" component={Map} options={{ title: 'Bin Map' }} />
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
        
        <Stack.Screen
              name="WasteManagementAuthority2"
              component={WasteManagementAuthorityScreen}
              options={{
                title: 'Waste Management Authority',
                headerShown: true,
              }}
            />
        
        {/* Backup/alternative screens */}
        <Stack.Screen name="DriverDashboard2" component={DriverDashboardScreen} options={{ title: 'Driver Dashboard' }} />
        <Stack.Screen name="SignIn" component={SignInScreen} options={{ title: 'Sign In' }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} options={{ title: 'Create Account' }} />
        <Stack.Screen name="Dashboard2" component={UserTabNavigator} options={{ title: 'Dashboard 2', headerShown: false }} />
        <Stack.Screen name="Welcome2" component={WelcomeScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}