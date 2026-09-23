import { randomUUID } from 'node:crypto'
import type { Firestore } from 'firebase-admin/firestore'
import { z } from 'zod'
import { BusinessError, type Actor } from '../business/firebase.js'
import { foundationAssessments } from './foundation.js'

const idSchema = z.string().trim().regex(/^[a-z0-9][a-z0-9_-]{2,179}$/i)
const questionSchema = z.object({
  id: idSchema,
  prompt: z.string().trim().min(8).max(3000),
  choices: z.array(z.string().trim().min(1).max(500)).min(2).max(6),
  correctOption: z.number().int().min(0).max(5),
})
const createAssessmentSchema = z.object({
  action: z.literal('assessment-create'),
  courseId: idSchema,
  title: z.string().trim().min(4).max(180),
  durationMinutes: z.number().int().min(1).max(240),
  passMark: z.number().int().min(0).max(100),
  maxAttempts: z.number().int().min(1).max(5),
  questions: z.array(questionSchema).min(1).max(40),
}).superRefine((value, context) => {
  if (new Set(value.questions.map((question) => question.id)).size !== value.questions.length)
    context.addIssue({ code: 'custom', message: 'Question IDs must be unique.' })
  for (const question of value.questions) {
    if (question.correctOption >= question.choices.length)
      context.addIssue({ code: 'custom', message: 'A correct option must exist in each question.' })
  }
})
const startAssessmentSchema = z.object({ action: z.literal('assessment-start'), assessmentId: idSchema })
const submitAssessmentSchema = z.object({
  action: z.literal('assessment-submit'),
  attemptId: idSchema,
  answers: z.record(idSchema, z.number().int().min(0).max(5)).refine((answers) => Object.keys(answers).length <= 40),
})
const integrityEventSchema = z.object({
  action: z.literal('integrity-event'),
  attemptId: idSchema,
  type: z.enum(['visibility-hidden', 'window-blur', 'fullscreen-exit', 'copy', 'paste', 'network-reconnected']),
})
const foundationInstallSchema = z.object({ action: z.literal('foundation-install') })

const commandSchema = z.discriminatedUnion('action', [
  createAssessmentSchema,
  startAssessmentSchema,
  submitAssessmentSchema,
  integrityEventSchema,
  foundationInstallSchema,
])

type AssessmentKey = z.infer<typeof questionSchema>
type Assessment = {
  courseId: string
  title: string
  durationMinutes: number
  passMark: number
  maxAttempts: number
  questionCount: number
  published: boolean
}

function requireAdmin(actor: Actor) {
  if (!actor.admin) throw new BusinessError(403, 'Only AFC instructors can manage assessments.')
}

async function requireEnrollment(db: Firestore, actor: Actor, courseId: string) {
  const enrollment = await db.doc(`afcEnrollments/${actor.uid}_${courseId}`).get()
  const status = enrollment.data()?.status
  if (!enrollment.exists || !['active', 'completed'].includes(String(status)))
    throw new BusinessError(403, 'Enroll in this course before starting its assessment.')
}

function learnerQuestion(question: AssessmentKey) {
  return { id: question.id, prompt: question.prompt, choices: question.choices }
}

function attemptRef(db: Firestore, assessmentId: string, uid: string, number: number) {
  return db.doc(`afcAssessmentAttempts/${assessmentId}_${uid}_${number}`)
}

async function readAssessment(db: Firestore, assessmentId: string) {
  const snapshot = await db.doc(`afcAssessments/${assessmentId}`).get()
  const assessment = snapshot.data() as Assessment | undefined
  if (!assessment || !assessment.published)
    throw new BusinessError(404, 'This assessment is not available.')
  return assessment
}

export async function afcCommand(db: Firestore, actor: Actor, raw: unknown) {
  const command = commandSchema.parse(raw)
  if (command.action === 'foundation-install') {
    requireAdmin(actor)
    const now = new Date().toISOString()
    let installed = 0
    await db.runTransaction(async (transaction) => {
      for (const assessment of foundationAssessments) {
        const course = await transaction.get(db.doc(`afcCourses/${assessment.courseId}`))
        if (!course.exists)
          throw new BusinessError(409, 'Install the AFC courses before their assessments.')
        const reference = db.doc(`afcAssessments/${assessment.id}`)
        const existing = await transaction.get(reference)
        if (existing.exists) continue
        installed += 1
        transaction.create(reference, {
          courseId: assessment.courseId,
          title: assessment.title,
          durationMinutes: assessment.durationMinutes,
          passMark: assessment.passMark,
          maxAttempts: assessment.maxAttempts,
          questionCount: assessment.questions.length,
          published: true,
          createdBy: actor.uid,
          createdAt: now,
          updatedAt: now,
        })
        transaction.create(db.doc(`afcAssessmentKeys/${assessment.id}`), {
          assessmentId: assessment.id,
          questions: assessment.questions,
          createdAt: now,
        })
        transaction.create(db.doc(`afcAssessmentAudit/${randomUUID()}`), {
          action: 'foundation-assessment-installed', assessmentId: assessment.id, actorId: actor.uid, createdAt: now,
        })
      }
    })
    return { installed, total: foundationAssessments.length }
  }
  if (command.action === 'assessment-create') {
    requireAdmin(actor)
    const course = await db.doc(`afcCourses/${command.courseId}`).get()
    if (!course.exists) throw new BusinessError(404, 'Choose an existing AFC course.')
    const assessmentId = `asm_${randomUUID()}`
    const now = new Date().toISOString()
    await db.runTransaction(async (transaction) => {
      transaction.create(db.doc(`afcAssessments/${assessmentId}`), {
        courseId: command.courseId,
        title: command.title,
        durationMinutes: command.durationMinutes,
        passMark: command.passMark,
        maxAttempts: command.maxAttempts,
        questionCount: command.questions.length,
        published: true,
        createdBy: actor.uid,
        createdAt: now,
        updatedAt: now,
      })
      transaction.create(db.doc(`afcAssessmentKeys/${assessmentId}`), {
        assessmentId,
        questions: command.questions,
        createdAt: now,
      })
      transaction.create(db.doc(`afcAssessmentAudit/${randomUUID()}`), {
        action: 'assessment-created', assessmentId, actorId: actor.uid, createdAt: now,
      })
    })
    return { assessmentId }
  }

  if (command.action === 'assessment-start') {
    const assessment = await readAssessment(db, command.assessmentId)
    await requireEnrollment(db, actor, assessment.courseId)
    const keys = (await db.doc(`afcAssessmentKeys/${command.assessmentId}`).get()).data() as { questions?: AssessmentKey[] } | undefined
    if (!keys?.questions?.length)
      throw new BusinessError(503, 'Assessment content is temporarily unavailable.')
    for (let number = 1; number <= assessment.maxAttempts; number += 1) {
      const reference = attemptRef(db, command.assessmentId, actor.uid, number)
      const existing = await reference.get()
      const data = existing.data()
      if (data?.status === 'in-progress')
        return { attemptId: reference.id, deadlineAt: data.deadlineAt, questions: keys.questions.map(learnerQuestion) }
      if (!existing.exists) {
        const startedAt = Date.now()
        const deadlineAt = startedAt + assessment.durationMinutes * 60_000
        await reference.create({
          assessmentId: command.assessmentId,
          courseId: assessment.courseId,
          userId: actor.uid,
          number,
          status: 'in-progress',
          startedAt,
          deadlineAt,
          answers: {},
          createdAt: new Date(startedAt).toISOString(),
          updatedAt: new Date(startedAt).toISOString(),
        })
        return { attemptId: reference.id, deadlineAt, questions: keys.questions.map(learnerQuestion) }
      }
    }
    throw new BusinessError(409, 'You have used all attempts for this assessment.')
  }

  if (command.action === 'assessment-submit') {
    const reference = db.doc(`afcAssessmentAttempts/${command.attemptId}`)
    const snapshot = await reference.get()
    const attempt = snapshot.data()
    if (!attempt || attempt.userId !== actor.uid)
      throw new BusinessError(404, 'Assessment attempt not found.')
    if (attempt.status !== 'in-progress')
      throw new BusinessError(409, 'This assessment attempt is already closed.')
    const assessment = await readAssessment(db, String(attempt.assessmentId))
    const keys = (await db.doc(`afcAssessmentKeys/${attempt.assessmentId}`).get()).data() as { questions?: AssessmentKey[] } | undefined
    if (!keys?.questions?.length)
      throw new BusinessError(503, 'Assessment marking is temporarily unavailable.')
    const now = Date.now()
    const expired = now > Number(attempt.deadlineAt)
    const allowed = new Set(keys.questions.map((question) => question.id))
    if (Object.keys(command.answers).some((id) => !allowed.has(id)))
      throw new BusinessError(400, 'The submitted answer set is invalid.')
    const correct = expired ? 0 : keys.questions.filter((question) => command.answers[question.id] === question.correctOption).length
    const score = Math.round((correct / keys.questions.length) * 100)
    await reference.update({
      status: expired ? 'expired' : 'submitted', answers: command.answers, score,
      passed: !expired && score >= assessment.passMark, submittedAt: now,
      updatedAt: new Date(now).toISOString(),
    })
    await db.doc(`afcAssessmentAudit/${randomUUID()}`).create({
      action: expired ? 'assessment-expired' : 'assessment-submitted', attemptId: reference.id,
      actorId: actor.uid, createdAt: new Date(now).toISOString(),
    })
    return { score, passed: !expired && score >= assessment.passMark, expired }
  }

  const reference = db.doc(`afcAssessmentAttempts/${command.attemptId}`)
  const attempt = (await reference.get()).data()
  if (!attempt || attempt.userId !== actor.uid || attempt.status !== 'in-progress')
    throw new BusinessError(404, 'Active assessment attempt not found.')
  await db.doc(`afcAssessmentIntegrityEvents/${command.attemptId}_${Date.now()}_${randomUUID().slice(0, 8)}`).create({
    attemptId: command.attemptId, userId: actor.uid, type: command.type, createdAt: new Date().toISOString(),
  })
  return { recorded: true }
}
