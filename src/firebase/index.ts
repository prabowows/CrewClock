import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { firebaseConfig } from './config';

export * from './provider';
export * from './client-provider';

export type FirebaseServices = {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
};

export function initializeFirebase(): FirebaseServices {
  const apps = getApps();
  const app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  // Note: Emulator connection is commented out for production.
  // if (process.env.NODE_ENV === 'development') {
  //   const { connectAuthEmulator } = require('firebase/auth');
  //   const { connectFirestoreEmulator } = require('firebase/firestore');
  //   connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  //   connectFirestoreEmulator(firestore, 'localhost', 8080);
  // }

  return { app, auth, firestore };
}
