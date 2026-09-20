import type { IncomingMessage } from 'node:http'
import { businessServices } from '../server/business/firebase.js'
import {
  receiveWhatsAppStatuses,
  validWebhookSignature,
} from '../server/business/whatsapp.js'
import type { ApiResponse } from '../server/http.js'

export const config = { api: { bodyParser: false } }
export default async function handler(req: IncomingMessage, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  const url = new URL(req.url || '/', 'https://auraflow.invalid')
  if (req.method === 'GET') {
    const token = process.env.WHATSAPP_VERIFY_TOKEN
    if (
      token &&
      url.searchParams.get('hub.mode') === 'subscribe' &&
      url.searchParams.get('hub.verify_token') === token
    ) {
      // ApiResponse intentionally shares the subset used by the existing API; Node supports end(body).
      res.status(200).setHeader('Content-Type', 'text/plain')
      ;(res as unknown as { end(body: string): void }).end(
        url.searchParams.get('hub.challenge') || '',
      )
    } else res.status(403).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).end()
    return
  }
  try {
    const chunks: Buffer[] = []
    let size = 0
    for await (const chunk of req) {
      const buffer = Buffer.from(chunk)
      size += buffer.length
      if (size > 256_000) {
        res.status(413).end()
        return
      }
      chunks.push(buffer)
    }
    const body = Buffer.concat(chunks)
    if (
      !validWebhookSignature(
        body,
        String(req.headers['x-hub-signature-256'] || ''),
        process.env.WHATSAPP_APP_SECRET || '',
      )
    ) {
      res.status(401).end()
      return
    }
    await receiveWhatsAppStatuses(
      businessServices().db,
      JSON.parse(body.toString('utf8')),
    )
    res.status(200).end()
  } catch {
    res.status(500).end()
  }
}
