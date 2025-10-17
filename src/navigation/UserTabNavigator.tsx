import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors } from '../constants/Colors';
import BucketReportScreen from '../screens/buckets/BucketReportScreen';
import DashboardScreen from '../screens/main/DashboardScreen';
import CategorizeScreen from '../../src/screens/trash/CategorizeScreen';
import ProfileScreen from '../screens/main/ProfileScreen';

export type UserTabParamList = {
  Home: undefined;
  MyBuckets: undefined;
  Categorize: undefined;
  Map: undefined; 
  BucketReport: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<UserTabParamList>();

export const UserTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: Colors.primary,
        },
        headerTintColor: Colors.text.inverse,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
          title: 'Home',
        }}
      />
      <Tab.Screen
        name="Categorize"
        component={CategorizeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle" size={size} color={color} />
          ),
          title: 'Categorize',
        }}
      />
      <Tab.Screen
        name="BucketReport"
        component={BucketReportScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="analytics" size={size} color={color} />
          ),
          title: 'Bucket Report',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person" size={size} color={color} />
          ),
          title: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
};