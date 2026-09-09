import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'

const required = [
  'API_KEY',
  'AUTH_DOMAIN',
  'PROJECT_ID',
  'STORAGE_BUCKET',
  'MESSAGING_SENDER_ID',
  'APP_ID',
]
test('a production build refuses missing Firebase configuration without printing values', () => {
  const result = spawnSync(process.execPath, ['scripts/check-config.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ...Object.fromEntries(
        required.map((key) => [`VITE_FIREBASE_${key}`, '']),
      ),
    },
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /Missing production configuration/)
})
test('emulator settings cannot be shipped in a production build', () => {
  const result = spawnSync(process.execPath, ['scripts/check-config.mjs'], {
    encoding: 'utf8',
    env: {
      ...process.env,
      ...Object.fromEntries(
        required.map((key) => [`VITE_FIREBASE_${key}`, 'demo-value']),
      ),
      VITE_USE_EMULATORS: 'true',
    },
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /must not use Firebase emulators/)
})
