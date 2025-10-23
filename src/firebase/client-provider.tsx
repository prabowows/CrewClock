'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { initializeFirebase, type FirebaseServices } from './';
import { FirebaseProvider } from './provider';

const FirebaseClientContext = createContext<FirebaseServices | null>(null);

export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  const [services, setServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // Initialize Firebase on the client
    const firebaseServices = initializeFirebase();
    setServices(firebaseServices);
  }, []);

  if (!services) {
    // You can return a loader here if needed
    return null; 
  }

  return (
    <FirebaseClientContext.Provider value={services}>
      <FirebaseProvider {...services}>{children}</FirebaseProvider>
    </FirebaseClientContext.Provider>
  );
}

export function useFirebaseClient() {
  const context = useContext(FirebaseClientContext);
  if (context === undefined) {
    throw new Error(
      'useFirebaseClient must be used within a FirebaseClientProvider'
    );
  }
  return context;
}
