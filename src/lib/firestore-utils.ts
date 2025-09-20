import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from 'firebase/auth';

export interface UserProfile {
  uid: string;
  fullName: string | null;
  email: string | null;
  createdAt?: Date;
  lastLogin?: Date;
  inferredSkills?: string[];
  quizResults?: QuizResult[];
  // New two-tier quiz system fields
  general_quiz_inferences?: any;
  personalized_quiz_inferences?: any;
  career_suggestions?: any;
}

export interface QuizResult {
  completedAt: Date;
  answers: QuizAnswer[];
  topSkills: string[];
}

export interface QuizAnswer {
  questionIndex: number;
  selectedOption: 'a' | 'b' | 'c' | 'd';
  inference: string[];
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

/**
 * Tests if user has write permissions to their profile
 * @param uid - User ID
 * @returns Promise<boolean> - Whether user can write to their profile
 */
export async function testUserWritePermissions(uid: string): Promise<boolean> {
  try {
    console.log('Testing write permissions for user:', uid);
    const testDoc = doc(db, "users", uid);
    await setDoc(testDoc, { 
      lastPermissionTest: new Date(),
      testField: "permission-test" 
    }, { merge: true });
    console.log('Write permission test successful');
    return true;
  } catch (error: any) {
    console.error('Write permission test failed:', error);
    return false;
  }
}

/**
 * Saves quiz results and updates inferred skills for a user
 * @param uid - User ID
 * @param quizAnswers - Array of quiz answers
 * @returns Promise<boolean> - Success status
 */
export async function saveQuizResultsAndUpdateSkills(
  uid: string,
  quizAnswers: QuizAnswer[]
): Promise<boolean> {
  try {
    console.log('saveQuizResultsAndUpdateSkills called with:', { uid, answersCount: quizAnswers.length });
    
    // Calculate skill frequencies
    const skillCount: { [key: string]: number } = {};
    quizAnswers.forEach(answer => {
      answer.inference.forEach(skill => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    console.log('Skill count calculated:', skillCount);

    // Get top skills (most frequent ones)
    const topSkills = Object.entries(skillCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10) // Keep top 10 skills
      .map(([skill]) => skill);

    console.log('Top skills identified:', topSkills);

    const quizResult: QuizResult = {
      completedAt: new Date(),
      answers: quizAnswers,
      topSkills
    };

    console.log('Getting current profile for user:', uid);
    // Get current profile
    const userDoc = await getDoc(doc(db, "users", uid));
    const currentProfile = userDoc.exists() ? userDoc.data() as UserProfile : null;
    
    console.log('Current profile exists:', userDoc.exists());
    console.log('Current profile data:', currentProfile);

    // Merge skills with existing inferred skills
    const existingSkills = currentProfile?.inferredSkills || [];
    const allSkills = [...new Set([...existingSkills, ...topSkills])]; // Remove duplicates

    console.log('Existing skills:', existingSkills);
    console.log('All skills (merged):', allSkills);

    // Update profile with new quiz results and skills
    const updatedProfile = {
      uid: uid,
      fullName: currentProfile?.fullName || '',
      email: currentProfile?.email || '',
      createdAt: currentProfile?.createdAt || new Date(),
      lastLogin: new Date(),
      inferredSkills: allSkills,
      quizResults: [
        ...(currentProfile?.quizResults || []),
        quizResult
      ].slice(-5), // Keep only last 5 quiz results
      // Preserve any other existing fields (sanitized)
      ...Object.fromEntries(
        Object.entries(currentProfile || {}).map(([key, value]) => [
          key, 
          value === null ? '' : value
        ])
      )
    };

    console.log('About to save updated profile:', updatedProfile);

    await setDoc(doc(db, "users", uid), updatedProfile, { merge: true });
    
    console.log(`Quiz results saved and skills updated for user: ${uid}`);
    console.log(`New inferred skills:`, topSkills);
    console.log(`All skills in profile:`, allSkills);
    return true;
  } catch (error: any) {
    console.error('Failed to save quiz results and update skills:', error);
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
}

/**
 * Gets inferred skills for a user
 * @param uid - User ID
 * @returns Promise<string[]>
 */
export async function getUserInferredSkills(uid: string): Promise<string[]> {
  try {
    console.log('getUserInferredSkills called for user:', uid);
    const profile = await getUserProfile(uid);
    console.log('Profile loaded in getUserInferredSkills:', profile);
    const skills = profile?.inferredSkills || [];
    console.log('Returning inferred skills:', skills);
    return skills;
  } catch (error: any) {
    console.error('Failed to get user inferred skills:', error);
    return [];
  }
}

/**
 * Adds manual skills to a user's profile (from profile form)
 * @param uid - User ID
 * @param manualSkills - Skills entered manually by user
 * @returns Promise<boolean>
 */
export async function updateManualSkills(
  uid: string,
  manualSkills: string
): Promise<boolean> {
  try {
    const profile = await getUserProfile(uid);
    if (!profile) return false;

    // Parse manual skills (comma-separated)
    const skillsList = manualSkills
      .split(',')
      .map(skill => skill.trim().toLowerCase())
      .filter(skill => skill.length > 0);

    await setDoc(doc(db, "users", uid), {
      manualSkills: skillsList,
      lastLogin: new Date()
    }, { merge: true });

    return true;
  } catch (error: any) {
    console.error('Failed to update manual skills:', error);
    return false;
  }
}
