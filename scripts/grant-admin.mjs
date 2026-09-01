import { applicationDefault, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const uid = process.argv[2]

if (!uid) {
  console.error('Usage: npm run grant-admin -- <firebase-auth-uid>')
  process.exit(1)
}

const app = initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
})
const auth = getAuth(app)
const account = await auth.getUser(uid)

await auth.setCustomUserClaims(uid, {
  ...account.customClaims,
  admin: true,
})

console.log(`Granted AuraFlow admin access to ${account.email ?? uid}. Sign out and back in to refresh the claim.`)
