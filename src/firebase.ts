import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, signInAnonymously, Auth } from 'firebase/auth';
import {
  child,
  get,
  getDatabase,
  Database,
  onValue,
  ref as databaseRef,
} from 'firebase/database';
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
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  firebaseApp = initializeApp(firebaseConfig);
  database = getDatabase(firebaseApp);
  auth = getAuth(firebaseApp);
}

export type ConnectionState =
  | 'not-configured'
  | 'connecting'
  | 'connected'
  | 'disconnected'
  | 'blocked';

export const connectionState = vueRef<ConnectionState>(
  isFirebaseConfigured ? 'connecting' : 'not-configured'
);

export const connectionError = vueRef('');

let socketConnected = false;

if (isFirebaseConfigured && database) {
  onValue(databaseRef(database, '.info/connected'), (snapshot) => {
    const connected = snapshot.val() === true;
    socketConnected = connected;
    if (!connected) {
      if (connectionState.value !== 'blocked') {
        connectionState.value = 'disconnected';
        connectionError.value = 'No connection to the Firebase servers. Reconnecting automatically...';
      }
      return;
    }
    // Socket is back up: probe the database so the badge reflects
    // real reads/writes without the user having to tap anything.
    if (
      connectionState.value === 'disconnected' ||
      connectionState.value === 'connecting'
    ) {
      connectionState.value = 'connecting';
      connectionError.value = '';
      void refreshConnection();
    }
  });
}

async function ensureSignedIn(): Promise<void> {
  if (!auth || auth.currentUser) return;
  try {
    await signInAnonymously(auth);
  } catch {
    // Sign-in may be unavailable (e.g. console provider disabled);
    // the probe below will surface the real database error.
  }
}

export async function refreshConnection(): Promise<void> {
  if (!isFirebaseConfigured || !database) {
    connectionState.value = 'not-configured';
    connectionError.value = '';
    return;
  }
  if (!socketConnected) {
    connectionState.value = 'disconnected';
    connectionError.value = 'No connection to the Firebase servers.';
    return;
  }
  connectionState.value = 'connecting';
  try {
    await ensureSignedIn();
    await get(child(databaseRef(database), 'events'));
    connectionState.value = 'connected';
    connectionError.value = '';
  } catch (err) {
    connectionState.value = 'blocked';
    connectionError.value = err instanceof Error ? err.message : String(err);
  }
}

if (isFirebaseConfigured) {
  void refreshConnection();
}

export { firebaseApp, database, auth };