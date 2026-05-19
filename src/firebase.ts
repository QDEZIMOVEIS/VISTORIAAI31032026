import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// Using initializeFirestore instead of getFirestore to enable long polling
// This helps resolving [code=unavailable] errors in environments with restricted socket connections
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
}, firebaseConfig.firestoreDatabaseId);

export const auth = getAuth(app);
export const storage = getStorage(app);

// Connection test as per critical requirements
async function testConnection() {
  try {
    // Try to get a non-existent doc from server to verify connectivity
    await getDocFromServer(doc(db, 'system_test', 'connectivity'));
    console.log("[Firebase] Connection test successful.");
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration. The client is reporting as offline.");
    } else {
      console.warn("[Firebase] Connection test result (likely expected for non-existent doc):", error);
    }
  }
}

testConnection();
