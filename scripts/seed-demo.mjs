import { initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

if (process.env.FIREBASE_AUTH_EMULATOR_HOST !== '127.0.0.1:9799') {
  throw new Error(
    'Demo accounts may only be created in the local AuraFlow Auth emulator on port 9799.',
  )
}
const app = initializeApp({ projectId: 'demo-auraflow' })
const auth = getAuth(app)
// These credentials are exclusively for the loopback-only emulator, not Firebase production.
const password = 'AuraFlow-local-2026!'
for (const account of [
  {
    email: 'owner@auraflow.test',
    displayName: 'AuraFlow Demo Admin',
    admin: true,
  },
  {
    email: 'client@auraflow.test',
    displayName: 'AuraFlow Demo Client',
    admin: false,
  },
]) {
  let user
  try {
    user = await auth.getUserByEmail(account.email)
  } catch (error) {
    if (error.code !== 'auth/user-not-found') throw error
  }
  user = user
    ? await auth.updateUser(user.uid, {
        password,
        displayName: account.displayName,
        emailVerified: true,
      })
    : await auth.createUser({
        email: account.email,
        password,
        displayName: account.displayName,
        emailVerified: true,
      })
  await auth.setCustomUserClaims(user.uid, { admin: account.admin })
  console.log(
    `Local demo ${account.admin ? 'admin' : 'client'}: ${account.email}`,
  )
}
console.log(`Local-only password: ${password}`)
