import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { config } from 'dotenv'

config({ path: '.env.local' })

const identifier = process.argv[2]
const projectId = process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT || process.env.VITE_FIREBASE_PROJECT_ID

if (!identifier) {
  console.error('Usage: npm run grant-admin -- <firebase-auth-uid-or-email>')
  process.exit(1)
}

if (!projectId) {
  console.error('Missing Firebase project id. Set FIREBASE_PROJECT_ID or VITE_FIREBASE_PROJECT_ID in .env.local.')
  process.exit(1)
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId,
})
const auth = getAuth(app)
const account = identifier.includes('@') ? await auth.getUserByEmail(identifier) : await auth.getUser(identifier)

await auth.setCustomUserClaims(account.uid, {
  ...account.customClaims,
  admin: true,
})

console.log(`Granted AuraFlow admin access to ${account.email ?? account.uid}. Sign out and back in to refresh the claim.`)
