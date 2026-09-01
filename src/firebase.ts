import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import _firebaseConfig from '../firebase-applet-config.json';
const firebaseConfig = _firebaseConfig as any;

const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
}, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const storage = getStorage(app);
