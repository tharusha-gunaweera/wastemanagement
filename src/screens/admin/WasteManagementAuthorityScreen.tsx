import { Ionicons } from '@expo/vector-icons';
import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../app';
import { Colors } from '../../constants/Colors';
import { AuthService } from '../../services/auth/AuthService';

type WasteManagementAuthorityScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'WasteManagementAuthority'
>;

interface Props {
  navigation: WasteManagementAuthorityScreenNavigationProp;
}

const WasteManagementAuthorityScreen: React.FC<Props> = ({ navigation }) => {
  const authService = new AuthService();
  const currentUser = authService.getCurrentUser();

  const handleNavigateToProfile = () => {
    navigation.navigate('Profile');
  };

  const handleNavigateToMyBuckets = () => {
    navigation.navigate('MyBuckets');
  };

  const handleNavigateToMap = () => {
    navigation.navigate('Map');
  };

  const handleNavigateToAdminDashboard = () => {
    navigation.navigate('AdminDashboard');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await authService.signOut();
              // Navigate to login screen after successful logout
              navigation.replace('SignIn');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Waste Management Authority</Text>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={24} color={Colors.error} />
          </TouchableOpacity>
        </View>
        <Text style={styles.subtitle}>
          Welcome, {currentUser?.displayName || currentUser?.email}
        </Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Ionicons name="trash-outline" size={32} color={Colors.primary} />
            <Text style={styles.statNumber}>156</Text>
            <Text style={styles.statLabel}>Total Bins</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="warning" size={32} color={Colors.error} />
            <Text style={styles.statNumber}>23</Text>
            <Text style={styles.statLabel}>Need Attention</Text>
          </View>
          
          <View style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={32} color={Colors.primary} />
            <Text style={styles.statNumber}>89%</Text>
            <Text style={styles.statLabel}>System Health</Text>
          </View>
        </View>

        {/* Navigation Cards */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation</Text>
          
          <TouchableOpacity 
            style={styles.navCard} 
            onPress={handleNavigateToMyBuckets}
          >
            <View style={styles.navIcon}>
              <Ionicons name="trash" size={28} color={Colors.primary} />
            </View>
            <View style={styles.navInfo}>
              <Text style={styles.navTitle}>My Buckets</Text>
              <Text style={styles.navDescription}>
                Manage your waste bins and view their status
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navCard} 
            onPress={handleNavigateToProfile}
          >
            <View style={styles.navIcon}>
              <Ionicons name="person" size={28} color={Colors.primary} />
            </View>
            <View style={styles.navInfo}>
              <Text style={styles.navTitle}>My Profile</Text>
              <Text style={styles.navDescription}>
                View and update your account information
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navCard} 
            onPress={handleNavigateToMap}
          >
            <View style={styles.navIcon}>
              <Ionicons name="map" size={28} color={Colors.primary} />
            </View>
            <View style={styles.navInfo}>
              <Text style={styles.navTitle}>System Map</Text>
              <Text style={styles.navDescription}>
                View all bins on the interactive map
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navCard} 
            onPress={handleNavigateToAdminDashboard}
          >
            <View style={styles.navIcon}>
              <Ionicons name="analytics" size={28} color={Colors.primary} />
            </View>
            <View style={styles.navInfo}>
              <Text style={styles.navTitle}>Admin Dashboard</Text>
              <Text style={styles.navDescription}>
                Manage technician requests and system reports
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />
          </TouchableOpacity>
        </View>

        {/* Authority Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Authority Features</Text>
          
          <View style={styles.featureCard}>
            <Ionicons name="shield-checkmark" size={24} color={Colors.primary} />
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>System Monitoring</Text>
              <Text style={styles.featureDescription}>
                Monitor all waste bins in the system and their health status
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="people" size={24} color={Colors.primary} />
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>User Management</Text>
              <Text style={styles.featureDescription}>
                Manage users, drivers, and system permissions
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <Ionicons name="trending-up" size={24} color={Colors.primary} />
            <View style={styles.featureInfo}>
              <Text style={styles.featureTitle}>Analytics & Reports</Text>
              <Text style={styles.featureDescription}>
                View system performance analytics and generate reports
              </Text>
            </View>
          </View>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.logoutCard}
            onPress={handleLogout}
          >
            <View style={styles.logoutIcon}>
              <Ionicons name="log-out-outline" size={24} color={Colors.error} />
            </View>
            <View style={styles.logoutInfo}>
              <Text style={styles.logoutTitle}>Logout</Text>
              <Text style={styles.logoutDescription}>
                Sign out of your account
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    flex: 1,
  },
  logoutButton: {
    padding: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
  },
  content: {
    flex: 1,
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 4,
  },
  section: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  navIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  navInfo: {
    flex: 1,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  navDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureInfo: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.error + '20', // Semi-transparent error color
  },
  logoutIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.error + '10', // Very light error color
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  logoutInfo: {
    flex: 1,
  },
  logoutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 4,
  },
  logoutDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
  },
});

export default WasteManagementAuthorityScreen;