import { z, ZodError } from 'zod'
import type { ApiRequest, ApiResponse } from '../server/http.js'
import { businessServices } from '../server/business/firebase.js'

const codeSchema = z.string().trim().toUpperCase().regex(/^AFC-\d{4}-[A-Z0-9]{8}$/)

export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    res.status(405).json({ message: 'Method not allowed.' })
    return
  }
  try {
    const rawCode = Array.isArray(req.query?.code) ? req.query?.code[0] : req.query?.code
    const code = codeSchema.parse(rawCode)
    const { db } = businessServices()
    const certificates = await db
      .collection('afcCertificates')
      .where('certificateCode', '==', code)
      .limit(1)
      .get()
    if (certificates.empty) {
      res.status(200).json({ valid: false })
      return
    }
    const certificate = certificates.docs[0].data()
    const course = await db.doc(`afcCourses/${certificate.courseId}`).get()
    const issuedAt = certificate.issuedAt as { toDate?: () => Date } | string | undefined
    res.status(200).json({
      valid: true,
      courseTitle: String(course.data()?.title || 'AuraFlow Class program'),
      issuedAt: typeof issuedAt === 'string' ? issuedAt : issuedAt?.toDate?.().toISOString() || null,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ message: 'Enter a valid AFC certificate code.' })
      return
    }
    console.error('afc_certificate_verify_failure', error instanceof Error ? error.message : 'unknown')
    res.status(503).json({ message: 'Certificate verification is temporarily unavailable.' })
  }
}
