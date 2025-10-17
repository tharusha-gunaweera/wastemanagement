import { User, AuthCredentials, SignUpData } from '../../models/User';

export interface IAuthService {
  signUp(userData: SignUpData): Promise<User>;
  signIn(credentials: AuthCredentials): Promise<User>;
  signOut(): Promise<void>;
  getCurrentUser(): User | null;
  getCurrentUserWithLocalStorage(): Promise<User | null>;
  resetPassword(email: string): Promise<void>;
  updateUserAccessLevel(uid: string, accessLevel: number): Promise<void>;
}