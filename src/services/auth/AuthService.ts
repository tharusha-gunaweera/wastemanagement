import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../config/FirebaseConfig';
import { AuthCredentials, SignUpData, StoredUser, User } from '../../models/User';
import { LocalStorageService } from '../storage/LocalStorageService';
import { IAuthService } from './IAuthService';

export class AuthService implements IAuthService {
  async signUp(userData: SignUpData): Promise<User> {
    try {
      console.log('Starting sign up process for:', userData.email);
      
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      console.log('User created in auth:', userCredential.user.uid);

      // Default access level for new users
      const accessLevel = 1;

      // Update profile with display name if provided
      if (userData.displayName) {
        await updateProfile(userCredential.user, {
          displayName: userData.displayName
        });
        console.log('Profile updated with display name');
      }

      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        accessLevel: accessLevel,
        createdAt: new Date(),
      };

      // Try to save to Firestore, but don't fail the signup if it doesn't work
      try {
        console.log('Attempting to save user to Firestore...');
        // Create user document in Firestore
        const userDoc = {
          uid: userCredential.user.uid,
          email: userCredential.user.email!,
          displayName: userData.displayName || '',
          phoneNumber: userData.phoneNumber || '',
          accessLevel: accessLevel,
          createdAt: new Date().toISOString(),
        };

        await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);
        console.log('User saved to Firestore successfully');
      } catch (firestoreError) {
        console.warn('Firestore save failed, but continuing. User can still sign in:', firestoreError);
        // Continue even if Firestore fails - we have the user in auth
      }

      // Save to local storage
      console.log('Saving user to local storage...');
      const storedUser: StoredUser = {
        ...user,
        createdAt: user.createdAt.toISOString(),
      };
      await LocalStorageService.saveUser(storedUser);
      await LocalStorageService.saveAccessLevel(accessLevel);
      console.log('User saved to local storage successfully');

      return user;
    } catch (error: any) {
      console.error('Sign up error:', error);
      throw new Error(this.getAuthErrorMessage(error));
    }
  }

  async signIn(credentials: AuthCredentials): Promise<User> {
    try {
      console.log('Starting sign in process for:', credentials.email);
      
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      console.log('User signed in to auth:', userCredential.user.uid);

      let accessLevel = 1; // Default access level

      // Try to get user data from Firestore, but fallback to default if it fails
      try {
        console.log('Attempting to get user data from Firestore...');
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          accessLevel = userData.accessLevel || 1;
          console.log('User data retrieved from Firestore, access level:', accessLevel);
        } else {
          console.log('No user document found in Firestore, using default access level');
        }
      } catch (firestoreError) {
        console.warn('Firestore read failed, using default access level:', firestoreError);
        // Use default access level if Firestore fails
      }

      const user: User = {
        uid: userCredential.user.uid,
        email: userCredential.user.email!,
        displayName: userCredential.user.displayName || undefined,
        phoneNumber: userCredential.user.phoneNumber || undefined,
        accessLevel: accessLevel,
        createdAt: new Date(userCredential.user.metadata.creationTime!),
      };

      // Save to local storage
      console.log('Saving user to local storage...');
      const storedUser: StoredUser = {
        ...user,
        createdAt: user.createdAt.toISOString(),
      };
      await LocalStorageService.saveUser(storedUser);
      await LocalStorageService.saveAccessLevel(accessLevel);
      console.log('User saved to local storage successfully');

      return user;
    } catch (error: any) {
      console.error('Sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error));
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
      await LocalStorageService.removeUser();
      console.log('User signed out successfully');
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  getCurrentUser(): User | null {
    const currentUser = auth.currentUser;
    if (!currentUser) return null;

    return {
      uid: currentUser.uid,
      email: currentUser.email!,
      displayName: currentUser.displayName || undefined,
      phoneNumber: currentUser.phoneNumber || undefined,
      accessLevel: 1, // Default, will be updated from local storage
      createdAt: new Date(currentUser.metadata.creationTime!),
    };
  }

  async getCurrentUserWithLocalStorage(): Promise<User | null> {
    try {
      const storedUser = await LocalStorageService.getUser();
      if (!storedUser) {
        console.log('No user found in local storage');
        return null;
      }

      const user: User = {
        ...storedUser,
        createdAt: new Date(storedUser.createdAt),
      };

      console.log('User retrieved from local storage:', user.email);
      return user;
    } catch (error) {
      console.error('Error getting user from local storage:', error);
      return null;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log('Password reset email sent to:', email);
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(this.getAuthErrorMessage(error));
    }
  }

  // Method to update user access level (for admin purposes)
  async updateUserAccessLevel(uid: string, accessLevel: number): Promise<void> {
    try {
      await setDoc(doc(db, 'users', uid), { accessLevel }, { merge: true });
      
      // Update local storage if it's the current user
      const currentUser = await LocalStorageService.getUser();
      if (currentUser && currentUser.uid === uid) {
        currentUser.accessLevel = accessLevel;
        await LocalStorageService.saveUser(currentUser);
        await LocalStorageService.saveAccessLevel(accessLevel);
      }
      console.log('User access level updated to:', accessLevel);
    } catch (error) {
      console.error('Failed to update user access level:', error);
      throw new Error('Failed to update user access level');
    }
  }

  private getAuthErrorMessage(error: any): string {
    console.log('Auth error code:', error.code);
    
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/operation-not-allowed':
        return 'Email/password accounts are not enabled.';
      case 'auth/weak-password':
        return 'Password is too weak.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your internet connection.';
      case 'auth/internal-error':
        return 'Internal error. Please try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}