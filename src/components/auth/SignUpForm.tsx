import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { Input } from '../common/Input';
import { Button } from '../common/Button';
import { AuthService } from '../../services/auth/AuthService';
import { AuthValidationService } from '../../services/validation/AuthValidationService';
import { Colors } from '../../constants/Colors';
import { SignUpData } from '../../models/User';

interface SignUpFormProps {
  onSuccess: (accessLevel: number) => void;
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSuccess, onSwitchToSignIn }) => {
  const [formData, setFormData] = useState<SignUpData>({
    email: '',
    password: '',
    displayName: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const authService = new AuthService();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    const emailError = AuthValidationService.validateEmail(formData.email);
    if (emailError) newErrors.email = emailError;

    const passwordError = AuthValidationService.validatePassword(formData.password);
    if (passwordError) newErrors.password = passwordError;

    const displayNameError = AuthValidationService.validateDisplayName(formData.displayName || '');
    if (displayNameError) newErrors.displayName = displayNameError;

    const phoneError = AuthValidationService.validatePhoneNumber(formData.phoneNumber || '');
    if (phoneError) newErrors.phoneNumber = phoneError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const user = await authService.signUp(formData);
      onSuccess(user.accessLevel); // Pass access level to parent
      Alert.alert('Success', 'Account created successfully!');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof SignUpData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Join SmartWasteManagement today</Text>

      <Input
        label="Full Name"
        value={formData.displayName || ''}
        onChangeText={(text) => updateField('displayName', text)}
        placeholder="Enter your full name"
        error={errors.displayName}
        autoCapitalize="words"
      />

      <Input
        label="Email"
        value={formData.email}
        onChangeText={(text) => updateField('email', text)}
        placeholder="Enter your email"
        error={errors.email}
        keyboardType="email-address"
      />

      <Input
        label="Phone Number (Optional)"
        value={formData.phoneNumber || ''}
        onChangeText={(text) => updateField('phoneNumber', text)}
        placeholder="Enter your phone number"
        error={errors.phoneNumber}
        keyboardType="phone-pad"
      />

      <Input
        label="Password"
        value={formData.password}
        onChangeText={(text) => updateField('password', text)}
        placeholder="Enter your password"
        secureTextEntry
        error={errors.password}
      />

      <Button
        title="Create Account"
        onPress={handleSubmit}
        loading={loading}
        disabled={loading}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.switchText}>Already have an account? </Text>
        <Text style={styles.switchLink} onPress={onSwitchToSignIn}>
          Sign In
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
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
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
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