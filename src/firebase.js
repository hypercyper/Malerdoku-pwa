import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDK-K1Qx9ZxBIA5lkztjilPWPWCkMZvgSg",
  authDomain: "malerdoku.firebaseapp.com",
  projectId: "malerdoku",
  storageBucket: "malerdoku.firebasestorage.app",
  messagingSenderId: "890530555857",
  appId: "1:890530555857:web:cab35255c72edbfdec22f0",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Offline-Unterstützung (Daten werden lokal gecacht)
enableIndexedDbPersistence(db).catch(() => {});
