import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  fullName: string | null;
  email: string | null;
  createdAt?: Date;
  lastLogin?: Date;
}

/**
 * Creates or updates a user profile in Firestore with retry logic
 * @param user - Firebase Auth user object
 * @param isNewUser - Whether this is a new user signup
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise<boolean> - Success status
 */
export async function createOrUpdateUserProfile(
  user: User, 
  isNewUser: boolean = false, 
  maxRetries: number = 3
): Promise<boolean> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      const userProfile: UserProfile = {
        uid: user.uid,
        fullName: user.displayName,
        email: user.email,
        lastLogin: new Date(),
      };

      if (isNewUser) {
        userProfile.createdAt = new Date();
      }

      await setDoc(doc(db, "users", user.uid), userProfile, { merge: true });
      
      console.log(`User profile ${isNewUser ? 'created' : 'updated'} successfully for user: ${user.uid}`);
      return true;
    } catch (error: any) {
      attempts++;
      console.warn(`Attempt ${attempts} failed to ${isNewUser ? 'create' : 'update'} user profile:`, error);
      
      if (attempts >= maxRetries) {
        console.error(`Failed to ${isNewUser ? 'create' : 'update'} user profile after ${maxRetries} attempts:`, error);
        return false;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  
  return false;
}

/**
 * Gets a user profile from Firestore
 * @param uid - User ID
 * @returns Promise<UserProfile | null>
 */
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data() as UserProfile;
    }
    return null;
  } catch (error: any) {
    console.error('Failed to get user profile:', error);
    return null;
  }
}

/**
 * Retry a Firestore operation with exponential backoff
 * @param operation - The async operation to retry
 * @param maxRetries - Maximum number of retry attempts
 * @returns Promise<T | null>
 */
export async function retryFirestoreOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3
): Promise<T | null> {
  let attempts = 0;
  
  while (attempts < maxRetries) {
    try {
      return await operation();
    } catch (error: any) {
      attempts++;
      console.warn(`Firestore operation attempt ${attempts} failed:`, error);
      
      if (attempts >= maxRetries) {
        console.error(`Firestore operation failed after ${maxRetries} attempts:`, error);
        return null;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
    }
  }
  
  return null;
}
