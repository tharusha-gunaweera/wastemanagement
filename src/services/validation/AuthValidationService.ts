export class AuthValidationService {
  static validateEmail(email: string): string | null {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return 'Email is required';
    if (!emailRegex.test(email)) return 'Please enter a valid email address';
    return null;
  }

  static validatePassword(password: string): string | null {
    if (!password) return 'Password is required';
    if (password.length < 6) return 'Password must be at least 6 characters';
    return null;
  }

  static validateDisplayName(displayName: string): string | null {
    if (!displayName) return 'Display name is required';
    if (displayName.length < 2) return 'Display name must be at least 2 characters';
    return null;
  }

  static validatePhoneNumber(phoneNumber: string): string | null {
    const phoneRegex = /^\+?[\d\s-()]{10,}$/;
    if (phoneNumber && !phoneRegex.test(phoneNumber)) {
      return 'Please enter a valid phone number';
    }
    return null;
  }
}