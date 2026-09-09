import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const required = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]
const missing = required.filter((key) => !env[key]?.trim())
if (missing.length) {
  console.error(
    `Missing production configuration: ${missing.join(', ')}. Set these in .env.local or the deployment environment.`,
  )
  process.exitCode = 1
} else if (
  env.VITE_USE_EMULATORS === 'true' ||
  env.VITE_FIREBASE_PROJECT_ID.startsWith('demo-')
) {
  console.error(
    'Production builds must not use Firebase emulators or a demo project.',
  )
  process.exitCode = 1
} else {
  console.log(
    'Required Firebase web configuration is present. Live provider and domain settings must be verified separately.',
  )
}
