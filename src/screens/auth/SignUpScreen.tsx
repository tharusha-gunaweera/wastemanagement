import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { SignUpForm } from '../../components/auth/SignUpForm';
import { Colors } from '../../constants/Colors';
import { RootStackParamList } from '../../../app';

type SignUpScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'SignUp'
>;

interface Props {
  navigation: SignUpScreenNavigationProp;
}

export const SignUpScreen: React.FC<Props> = ({ navigation }) => {
  const handleSuccess = (accessLevel: number) => {
    if (accessLevel === 2) {
      navigation.replace('DriverDashboard2');
    } else {
      navigation.replace('Dashboard2');
    }
  };

  const handleSwitchToSignIn = () => {
    navigation.replace('SignIn');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <SignUpForm 
          onSuccess={handleSuccess}
          onSwitchToSignIn={handleSwitchToSignIn}
        />
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
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});