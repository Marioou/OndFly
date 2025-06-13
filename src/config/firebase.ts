import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    browserLocalPersistence, 
    setPersistence,
    type Auth 
} from 'firebase/auth';
import { 
    getFirestore, 
    enableIndexedDbPersistence,
    collection,
    getDocs,
    query,
    limit,
    Timestamp,
    type Firestore 
} from 'firebase/firestore';
import { LoggingService } from '../services/LoggingService';

const firebaseConfig = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDfrn5kZ7-cTxf1X1zDDvtyK2K6TcMOyqU",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "fly-task-organizer.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "fly-task-organizer",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "fly-task-organizer.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1001627075921",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1001627075921:web:b3a458ced6ec0cba5e7f70"
};

let firebaseApp: any;
let firestore: Firestore;
let auth: Auth;

export async function initializeFirebase() {
  console.log('[Firebase] Initializing Firebase app');
  firebaseApp = initializeApp(firebaseConfig);
  auth = getAuth(firebaseApp);
  firestore = getFirestore(firebaseApp);
  // Set auth persistence
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.warn('Error setting auth persistence:', error);
  }
  // Enable Firestore offline persistence with retries
  const maxRetries = 3;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await enableIndexedDbPersistence(firestore);
      console.log('[Firebase] Offline persistence enabled');
      break;
    } catch (err: any) {
      // Fail silently for unsupported or multiple tabs
      if (err.code === 'failed-precondition' || err.code === 'unimplemented') {
        console.warn('Offline persistence unavailable:', err.code);
        break;
      }
      if (attempt === maxRetries) {
        console.error('[Firebase] Could not enable offline persistence:', err);
      } else {
        console.warn(`[Firebase] Retrying offline persistence (attempt ${attempt})...`);
        await new Promise(res => setTimeout(res, 1000 * attempt));
      }
    }
  }
  return { auth, firestore };
}

export function getFirebaseAuth() {
  return auth;
}

export function getFirestoreDb() {
  return firestore;
}

/**
 * Check basic connectivity to Firestore via a simple query.
 */
export const checkFirebaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
    try {
        const db = getFirestoreDb();
        const testQuery = query(collection(db, 'tasks'), limit(1));
        await getDocs(testQuery);
        return { success: true };
    } catch (error) {
        console.error('Error connecting to Firebase:', error);
        return { 
            success: false, 
            error: (error as Error).message
        };
    }
};
