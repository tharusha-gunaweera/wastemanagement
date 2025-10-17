import { StackNavigationProp } from '@react-navigation/stack';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../../app';
import { SignInForm } from '../../components/auth/SignInForm';
import { Colors } from '../../constants/Colors';
import { AuthService } from '../../services/auth/AuthService';

type SignInScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SignIn'
>;

interface Props {
  navigation: SignInScreenNavigationProp;
}

export const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const authService = new AuthService();

  const handleSuccess = (accessLevel: number) => {
    if (accessLevel === 2) {
      navigation.replace('DriverDashboard2');
    } else {
      navigation.replace('Dashboard2');
    }
  };

  const handleSwitchToSignUp = () => {
    navigation.navigate('SignUp');
  };

  const handleForgotPassword = () => {
    Alert.prompt(
      'Reset Password',
      'Enter your email address to reset your password',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async (email: string | undefined) => {
            if (email) {
              try {
                await authService.resetPassword(email);
                Alert.alert('Success', 'Password reset email sent!');
              } catch (error) {
                Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send reset email');
              }
            }
          },
        },
      ],
      'plain-text'
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.content}>
        <SignInForm 
          onSuccess={handleSuccess}
          onSwitchToSignUp={handleSwitchToSignUp}
          onForgotPassword={handleForgotPassword}
        />
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
    justifyContent: 'center',
    padding: 20,
  },
});