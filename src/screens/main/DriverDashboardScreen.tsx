import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../app';
import { Button } from '../../components/common/Button';
import { Colors } from '../../constants/Colors';
import { AuthService } from '../../services/auth/AuthService';

type DriverDashboardScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'DriverDashboard'
>;

interface Props {
  navigation: DriverDashboardScreenNavigationProp;
}

export const DriverDashboardScreen: React.FC<Props> = ({ navigation }) => {
  const authService = new AuthService();
  const currentUser = authService.getCurrentUser();

  const handleSignOut = async () => {
    try {
      await authService.signOut();
      navigation.replace('Welcome2');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const navigateToMap = () => {
    // Navigate directly to the Map screen
    navigation.navigate('Map');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.welcome}>
          Welcome, Driver {currentUser?.displayName || currentUser?.email}!
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Assigned Routes</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Completed Today</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0%</Text>
            <Text style={styles.statLabel}>Efficiency</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Driver Actions</Text>
          
          <Button
            title="View Assigned Bins Map"
            onPress={navigateToMap}
            variant="primary"
          />
          
          <Button
            title="Start Collection"
            onPress={() => console.log('Start collection')}
            variant="secondary"
          />
          
          <Button
            title="Report Issue"
            onPress={() => console.log('Report issue')}
            variant="outline"
          />
          
          <Button
            title="Today's Routes"
            onPress={() => console.log('View routes')}
            variant="outline"
          />
        </View>

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
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
  },
  welcome: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
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
  },
  statLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: 5,
  },
  actionsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 15,
  },
  signOutContainer: {
    marginTop: 'auto',
    marginBottom: 20,
  },
});