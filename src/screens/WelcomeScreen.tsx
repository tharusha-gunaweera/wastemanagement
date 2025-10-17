import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../app';
import { Button } from '../components/common/Button';
import { Colors } from '../constants/Colors';

type WelcomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Welcome'
>;

interface Props {
  navigation: WelcomeScreenNavigationProp;
}

const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>♻️</Text>
          <Text style={styles.title}>Smart Waste Management</Text>
          <Text style={styles.subtitle}>
            Efficient waste management for a cleaner environment
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            title="Sign In"
            onPress={() => navigation.navigate('SignIn')}
            variant="primary"
          />
          <Button
            title="Create Account"
            onPress={() => navigation.navigate('SignUp')}
            variant="outline"
          />
        </View>

        <View style={styles.featuresContainer}>
          <Text style={styles.featuresTitle}>Features:</Text>
          <Text style={styles.feature}>• Smart waste monitoring</Text>
          <Text style={styles.feature}>• Collection scheduling</Text>
          <Text style={styles.feature}>• Recycling guidance</Text>
          <Text style={styles.feature}>• Environmental impact tracking</Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  logo: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  featuresContainer: {
    backgroundColor: Colors.surface,
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
  },
  feature: {
    fontSize: 14,
    color: Colors.text.secondary,
    marginBottom: 8,
  },
});

export default WelcomeScreen;