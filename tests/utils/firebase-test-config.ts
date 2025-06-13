import { initializeApp, FirebaseOptions, getApps, deleteApp } from 'firebase/app';
import { getAuth, setPersistence, inMemoryPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const testConfig: FirebaseOptions = {
    apiKey: process.env.REACT_APP_FIREBASE_API_KEY || "AIzaSyDfrn5kZ7-cTxf1X1zDDvtyK2K6TcMOyqU",
    authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || "fly-task-organizer.firebaseapp.com",
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || "fly-task-organizer",
    storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || "fly-task-organizer.firebasestorage.app",
    messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || "1001627075921",
    appId: process.env.REACT_APP_FIREBASE_APP_ID || "1:1001627075921:web:b3a458ced6ec0cba5e7f70"
};

console.log('Firebase Test Config:', testConfig);

if (!testConfig.apiKey || !testConfig.authDomain || !testConfig.projectId) {
    console.error('Missing Firebase configuration. Please check environment variables.');
    throw new Error('Firebase configuration is incomplete.');
}

export const initializeTestFirebase = async () => {
    try {
        // Clean up any existing Firebase apps
        const apps = getApps();
        console.log('Existing Firebase apps:', apps.map(app => app.name));
        await Promise.all(apps.map(app => deleteApp(app)));

        // Initialize Firebase with test config
        const app = initializeApp(testConfig);
        console.log('Firebase app initialized:', app.name);

        // Get auth instance
        const auth = getAuth(app);
        console.log('Firebase Auth instance created.');

        // Set up auth persistence for testing
        await setPersistence(auth, inMemoryPersistence);
        console.log('Auth persistence set to in-memory.');

        // Get Firestore instance
        const db = getFirestore(app);
        console.log('Firestore instance created.');

        return { app, auth, db };
    } catch (error) {
        console.error('Error initializing test Firebase:', error);
        throw error;
    }
};
