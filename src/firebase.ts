import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Initialize Firestore with standard settings and fallback to long-polling if needed
let firestoreDb: any;
try {
  firestoreDb = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  }, firebaseConfig.firestoreDatabaseId);
} catch (e) {
  // If already initialized or fails, fallback to getFirestore
  firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreDb;
export const auth = getAuth(app);
export const storage = getStorage(app);

// Connectivity check compliant with Firebase Skill guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'system_test', 'connectivity'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("[Firebase] Client is offline or Firestore backend is temporarily unreachable.");
    }
  }
}

testConnection();
