import AsyncStorage from '@react-native-async-storage/async-storage';
import { createUserWithEmailAndPassword } from "firebase/auth";
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { auth } from '../../../../FirebaseConfig';

const SignUpScreen = ({ navigation }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    birthDate: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (key, value) => {
    setFormData({ ...formData, [key]: value });
  };

  const handleSignUp = async () => {
    const { email, password, confirmPassword } = formData;
    if (!email || !password) return Alert.alert('Error', 'Please fill all required fields.');
    if (password !== confirmPassword) return Alert.alert('Error', 'Passwords do not match.');

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await AsyncStorage.setItem('user', JSON.stringify(userCredential.user)); // store user
      Alert.alert('Success', 'Account created successfully!');
      navigation.replace('MainApp');
    } catch (error) {
      Alert.alert('Sign Up Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>PP</Text>
            </View>
            <Text style={styles.appName}>Period Pal</Text>
            <Text style={styles.subtitle}>Create your account</Text>
          </View>

          {/* Form */}
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>Get Started</Text>

            {/* First + Last Name */}
            <View style={styles.nameRow}>
              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>First Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="First name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.firstName}
                  onChangeText={(v) => handleInputChange('firstName', v)}
                />
              </View>

              <View style={[styles.inputContainer, styles.halfInput]}>
                <Text style={styles.label}>Last Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Last name"
                  placeholderTextColor="#9CA3AF"
                  value={formData.lastName}
                  onChangeText={(v) => handleInputChange('lastName', v)}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor="#9CA3AF"
                value={formData.email}
                onChangeText={(v) => handleInputChange('email', v)}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            {/* Birth Date */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Birth Date</Text>
              <TextInput
                style={styles.textInput}
                placeholder="YYYY-MM-DD (Optional)"
                placeholderTextColor="#9CA3AF"
                value={formData.birthDate}
                onChangeText={(v) => handleInputChange('birthDate', v)}
              />
            </View>

            {/* Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Create a password"
                placeholderTextColor="#9CA3AF"
                value={formData.password}
                onChangeText={(v) => handleInputChange('password', v)}
                secureTextEntry
                autoCapitalize="none"
              />
              <Text style={styles.passwordHint}>Must be at least 6 characters</Text>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Confirm password"
                placeholderTextColor="#9CA3AF"
                value={formData.confirmPassword}
                onChangeText={(v) => handleInputChange('confirmPassword', v)}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* Terms */}
            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </View>

            {/* Button */}
            <TouchableOpacity
              style={[styles.signUpButton, loading && styles.signUpButtonDisabled]}
              onPress={handleSignUp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.signUpButtonText}>Create Account</Text>
              )}
            </TouchableOpacity>

            {/* Login link */}
            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              Your data is encrypted and secure. We never share your personal information.
            </Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF2F8' },
  scrollContainer: { flexGrow: 1 },
  content: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 70,
    height: 70,
    backgroundColor: '#EC4899',
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  logoText: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  appName: { fontSize: 28, fontWeight: 'bold', color: '#EC4899', marginBottom: 4 },
  subtitle: { color: '#6B7280', fontSize: 16 },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formTitle: { fontSize: 22, fontWeight: 'bold', color: '#1F2937', marginBottom: 20, textAlign: 'center' },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  halfInput: { flex: 0.48 },
  inputContainer: { marginBottom: 16 },
  label: { color: '#1F2937', fontWeight: '500', marginBottom: 6, fontSize: 14 },
  textInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1F2937',
  },
  passwordHint: { color: '#6B7280', fontSize: 12, marginTop: 4, marginLeft: 4 },
  termsContainer: { marginBottom: 20, marginTop: 8 },
  termsText: { color: '#6B7280', fontSize: 12, textAlign: 'center', lineHeight: 16 },
  termsLink: { color: '#EC4899', fontWeight: '500' },
  signUpButton: {
    backgroundColor: '#EC4899',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  signUpButtonDisabled: { opacity: 0.7 },
  signUpButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
  loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  loginText: { color: '#6B7280', fontSize: 14 },
  loginLink: { color: '#EC4899', fontWeight: 'bold', fontSize: 14 },
  infoContainer: { marginTop: 20 },
  infoText: { textAlign: 'center', color: '#6B7280', fontSize: 12, lineHeight: 16 },
});

export default SignUpScreen;
