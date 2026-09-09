import { getApp, getApps, initializeApp } from 'firebase/app'
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics'
import { connectAuthEmulator, getAuth, type Auth } from 'firebase/auth'
import {
  connectFirestoreEmulator,
  getFirestore,
  type Firestore,
} from 'firebase/firestore'
import {
  connectStorageEmulator,
  getStorage,
  type FirebaseStorage,
} from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
}

const requiredFirebaseKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
] as const

export const firebaseConfigured = requiredFirebaseKeys.every((key) =>
  Boolean(firebaseConfig[key]?.trim()),
)
export const requireFirebase = () => {
  if (!firebaseConfigured) {
    throw new Error('Firebase environment variables are not configured yet.')
  }
}

const app = firebaseConfigured
  ? getApps().length
    ? getApp()
    : initializeApp(firebaseConfig)
  : null

export const auth = app ? getAuth(app) : null
export const db = app ? getFirestore(app) : null
export const storage = app ? getStorage(app) : null
if (
  import.meta.env.DEV &&
  import.meta.env.VITE_USE_EMULATORS === 'true' &&
  auth &&
  db &&
  storage
) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9799', { disableWarnings: true })
  connectFirestoreEmulator(db, '127.0.0.1', 8780)
  connectStorageEmulator(storage, '127.0.0.1', 9798)
}
export const analyticsReady: Promise<Analytics | null> =
  app && firebaseConfig.measurementId
    ? isSupported()
        .then((supported) => (supported ? getAnalytics(app) : null))
        .catch(() => null)
    : Promise.resolve(null)

export function getFirebaseAuth(): Auth {
  requireFirebase()
  if (!auth) throw new Error('Firebase Auth is unavailable.')
  return auth
}

export function getFirebaseDb(): Firestore {
  requireFirebase()
  if (!db) throw new Error('Firestore is unavailable.')
  return db
}

export function getFirebaseStorage(): FirebaseStorage {
  requireFirebase()
  if (!storage) throw new Error('Firebase Storage is unavailable.')
  return storage
}

export default app
