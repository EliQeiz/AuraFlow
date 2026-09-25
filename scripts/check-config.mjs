import { loadEnv } from 'vite'

const env = { ...loadEnv('production', process.cwd(), 'VITE_'), ...process.env }
const firebaseRequired = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
]
const provider = env.VITE_BACKEND_PROVIDER || 'firebase'
if (!['firebase', 'supabase'].includes(provider)) {
  console.error('VITE_BACKEND_PROVIDER must be either firebase or supabase.')
  process.exitCode = 1
} else if (provider === 'supabase') {
  const supabaseRequired = ['VITE_SUPABASE_URL']
  const missing = supabaseRequired.filter((key) => !env[key]?.trim())
  const publishable = env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_ANON_KEY
  const serverMissing = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'].filter((key) => !env[key]?.trim())
  if (missing.length || !publishable?.trim() || serverMissing.length) {
    console.error('Missing Supabase production configuration. Configure the Supabase URL, browser publishable key, server URL, and server service-role key.')
    process.exitCode = 1
  } else if (env.AURAFLOW_BACKEND_PROVIDER !== 'supabase') {
    console.error('AURAFLOW_BACKEND_PROVIDER must be supabase when VITE_BACKEND_PROVIDER is supabase.')
    process.exitCode = 1
  } else {
    console.log('Required Supabase configuration is present. RLS, Auth redirect URLs, and production workflows must still be verified.')
  }
} else {
  const missing = firebaseRequired.filter((key) => !env[key]?.trim())
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
}
