import { initializeApp, FirebaseApp } from 'firebase/app';
import { getDatabase, Database, onValue, ref as databaseRef } from 'firebase/database';
import { ref as vueRef } from 'vue';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL
);

let firebaseApp: FirebaseApp | null = null;
let database: Database | null = null;

if (isFirebaseConfigured) {
  firebaseApp = initializeApp(firebaseConfig);
  database = getDatabase(firebaseApp);
}

export type ConnectionState = 'not-configured' | 'connecting' | 'connected' | 'disconnected';

export const connectionState = vueRef<ConnectionState>(
  isFirebaseConfigured ? 'connecting' : 'not-configured'
);

if (isFirebaseConfigured && database) {
  onValue(databaseRef(database, '.info/connected'), (snapshot) => {
    connectionState.value = snapshot.val() === true ? 'connected' : 'disconnected';
  });
}

export { firebaseApp, database };