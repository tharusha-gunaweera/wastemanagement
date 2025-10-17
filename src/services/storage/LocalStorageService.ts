import AsyncStorage from '@react-native-async-storage/async-storage';
import { StoredUser } from '../../models/User';

export class LocalStorageService {
  private static readonly USER_KEY = 'current_user';
  private static readonly ACCESS_LEVEL_KEY = 'user_access_level';

  // Save user data to local storage
  static async saveUser(user: StoredUser): Promise<void> {
    try {
      const userData = JSON.stringify(user);
      await AsyncStorage.setItem(this.USER_KEY, userData);
      console.log('User saved to local storage:', user.email);
    } catch (error) {
      console.error('Error saving user to local storage:', error);
      throw new Error('Failed to save user data');
    }
  }

  // Get user data from local storage
  static async getUser(): Promise<StoredUser | null> {
    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      if (userData) {
        const user = JSON.parse(userData);
        console.log('User retrieved from local storage:', user.email);
        return user;
      }
      return null;
    } catch (error) {
      console.error('Error getting user from local storage:', error);
      return null;
    }
  }

  // Save access level separately for quick access
  static async saveAccessLevel(accessLevel: number): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ACCESS_LEVEL_KEY, accessLevel.toString());
      console.log('Access level saved to local storage:', accessLevel);
    } catch (error) {
      console.error('Error saving access level:', error);
      throw new Error('Failed to save access level');
    }
  }

  // Get access level from local storage
  static async getAccessLevel(): Promise<number | null> {
    try {
      const accessLevel = await AsyncStorage.getItem(this.ACCESS_LEVEL_KEY);
      const level = accessLevel ? parseInt(accessLevel, 10) : null;
      console.log('Access level retrieved from local storage:', level);
      return level;
    } catch (error) {
      console.error('Error getting access level:', error);
      return null;
    }
  }

  // Remove user data from local storage (logout)
  static async removeUser(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.USER_KEY, this.ACCESS_LEVEL_KEY]);
      console.log('User removed from local storage');
    } catch (error) {
      console.error('Error removing user from local storage:', error);
      throw new Error('Failed to remove user data');
    }
  }

  // Check if user is logged in
  static async isUserLoggedIn(): Promise<boolean> {
    const user = await this.getUser();
    const isLoggedIn = user !== null;
    console.log('User logged in check:', isLoggedIn);
    return isLoggedIn;
  }
}