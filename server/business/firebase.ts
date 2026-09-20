import { cert, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getFirestore } from 'firebase-admin/firestore'

export function businessServices() {
  const existing = getApps().find((app) => app.name === 'auraflow-business')
  const projectId = process.env.FIREBASE_PROJECT_ID
  if (!projectId) throw new Error('BUSINESS_BACKEND_UNCONFIGURED')
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
        ...(process.env.FIREBASE_SERVICE_ACCOUNT_JSON
          ? {
              credential: cert(
                JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
              ),
            }
          : {}),
      },
      'auraflow-business',
    )
  return { db: getFirestore(app), auth: getAuth(app) }
}
export class BusinessError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}
export type Actor = { uid: string; admin: boolean }
