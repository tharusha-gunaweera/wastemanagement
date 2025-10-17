import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { AuthService } from '../../services/auth/AuthService';
import { AuthValidationService } from '../../services/validation/AuthValidationService';
import { Colors } from '../../constants/Colors';
import { AuthCredentials } from '../../models/User';

interface SignInFormProps {
  onSuccess: (accessLevel: number) => void;
  onSwitchToSignUp: () => void;
  onForgotPassword: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ 
  onSuccess, 
  onSwitchToSignUp, 
  onForgotPassword 
}) => {
  const [credentials, setCredentials] = useState<AuthCredentials>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const authService = new AuthService();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailError = AuthValidationService.validateEmail(credentials.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = AuthValidationService.validatePassword(credentials.password);
    if (passwordError) newErrors.password = passwordError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await authService.signIn(credentials);
      onSuccess(user.accessLevel); // Pass access level to parent
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof AuthCredentials, value: string) => {
    setCredentials(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Sign in to your account</Text>

      <Input
        label="Email"
        value={credentials.email}
        onChangeText={(text) => updateField('email', text)}
        placeholder="Enter your email"
        error={errors.email}
        keyboardType="email-address"
      />

      <Input
        label="Password"
        value={credentials.password}
        onChangeText={(text) => updateField('password', text)}
        placeholder="Enter your password"
        secureTextEntry
        error={errors.password}
      />

      <Text style={styles.forgotPassword} onPress={onForgotPassword}>
        Forgot Password?
      </Text>

      <Button
        title="Sign In"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Don't have an account? </Text>
        <Text style={styles.switchLink} onPress={onSwitchToSignUp}>
          Sign Up
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.text.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  forgotPassword: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  switchText: {
    color: Colors.text.primary,
    fontSize: 14,
  },
  switchLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});