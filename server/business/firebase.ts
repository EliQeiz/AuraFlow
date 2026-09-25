import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'
export { BusinessError, type Actor } from '../errors.js'

export function businessServices() {
  const existing = getApps().find((app) => app.name === 'auraflow-business')
  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (!projectId || (process.env.NODE_ENV === 'production' && !serviceAccountJson))
    throw new Error('BUSINESS_BACKEND_UNCONFIGURED')
  if (
    process.env.NODE_ENV === 'production' &&
    (process.env.FIRESTORE_EMULATOR_HOST ||
      process.env.FIREBASE_AUTH_EMULATOR_HOST)
  )
    throw new Error('EMULATOR_IN_PRODUCTION')
  const app =
    existing ||
    initializeApp(
      {
        projectId,
        ...(serviceAccountJson
          ? {
              credential: cert(
                JSON.parse(serviceAccountJson),
              ),
            }
          : {}),
      },
      'auraflow-business',
    )
  return { db: getFirestore(app), auth: getAuth(app) }
}
