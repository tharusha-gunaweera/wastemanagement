import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../../../app';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { AuthService } from '../../services/auth/AuthService';

type ProfileScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Dashboard'
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const authService = new AuthService();
  const currentUser = authService.getCurrentUser();

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          onPress: async () => {
            try {
              await authService.signOut();
              navigation.replace('Welcome2');
            } catch (error) {
              console.error('Sign out error:', error);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color={Colors.text.inverse} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {currentUser?.displayName || 'No Name'}
            </Text>
            <Text style={styles.userEmail}>{currentUser?.email}</Text>
            <Text style={styles.userRole}>
              {currentUser?.accessLevel === 2 ? 'Driver' : 'User'}
            </Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>Account Information</Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Member Since:</Text>
            <Text style={styles.statsValue}>
              {currentUser?.createdAt ? new Date(currentUser.createdAt).toLocaleDateString() : 'N/A'}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>User ID:</Text>
            <Text style={styles.statsValue} numberOfLines={1} ellipsizeMode="middle">
              {currentUser?.uid || 'N/A'}
            </Text>
          </View>
          <View style={styles.statsRow}>
            <Text style={styles.statsLabel}>Phone:</Text>
            <Text style={styles.statsValue}>
              {currentUser?.phoneNumber || 'Not provided'}
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <Text style={styles.actionsTitle}>Actions</Text>
          
          <Button
            title="Edit Profile"
            onPress={() => Alert.alert('Info', 'Edit profile feature coming soon!')}
            variant="outline"
          />
          
          <Button
            title="Change Password"
            onPress={() => Alert.alert('Info', 'Change password feature coming soon!')}
            variant="outline"
          />
          
          <Button
            title="Contact Support"
            onPress={() => Alert.alert('Info', 'Contact support feature coming soon!')}
            variant="outline"
          />
        </View>

        {/* Sign Out */}
        <View style={styles.signOutContainer}>
          <Button
            title="Sign Out"
            onPress={handleSignOut}
            variant="outline"
          />
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  userCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  userRole: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 15,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statsLabel: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  statsValue: {
    fontSize: 14,
    color: Colors.text.primary,
    fontWeight: '500',
  },
  actionsCard: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 15,
  },
  actionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  signOutContainer: {
    marginBottom: 30,
  },
});

export default ProfileScreen;