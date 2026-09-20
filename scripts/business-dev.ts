import { createServer } from 'node:http'
import handler from '../api/business.js'
import webhook from '../api/whatsapp.js'
import type { ApiResponse } from '../server/http.js'

if (process.env.NODE_ENV === 'production')
  throw new Error('Local adapter must not run in production')
process.env.FIREBASE_PROJECT_ID = 'demo-auraflow'
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9799'
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8780'
createServer(async (req, res) => {
  const adapter: ApiResponse = {
    setHeader: (key, value) => {
      res.setHeader(key, value)
    },
    status: (code) => {
      res.statusCode = code
      return adapter
    },
    json: (body) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    },
    end: (body?: string) => {
      res.end(body)
    },
  }
  if (req.url?.startsWith('/api/whatsapp')) {
    await webhook(req, adapter)
    return
  }
  if (req.url !== '/api/business') {
    res.writeHead(404).end()
    return
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 128_000) {
      res.writeHead(413).end()
      return
    }
    chunks.push(chunk)
  }
  await handler(
    {
      method: req.method,
      headers: req.headers,
      body: Buffer.concat(chunks).toString(),
    },
    adapter,
  )
}).listen(5192, '127.0.0.1', () =>
  console.log('Local business API on http://127.0.0.1:5192 (emulators only)'),
)
