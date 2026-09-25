import { randomUUID } from 'node:crypto'
import type { SupabaseClient } from '@supabase/supabase-js'
import { z } from 'zod'
import { afcStarterCourses } from '../../src/data/afcCourses.js'
import { BusinessError, type Actor } from '../errors.js'
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
  attemptId: z.string().uuid(),
  answers: z.record(idSchema, z.number().int().min(0).max(5)).refine((answers) => Object.keys(answers).length <= 40),
})
const integrityEventSchema = z.object({
  action: z.literal('integrity-event'),
  attemptId: z.string().uuid(),
  type: z.enum(['visibility-hidden', 'window-blur', 'fullscreen-exit', 'copy', 'paste', 'network-reconnected']),
})
const foundationInstallSchema = z.object({ action: z.literal('foundation-install') })
const lessonProgressSchema = z.object({
  action: z.literal('lesson-progress'),
  courseId: idSchema,
  lessonId: idSchema,
  completed: z.boolean(),
})
const commandSchema = z.discriminatedUnion('action', [
  createAssessmentSchema,
  startAssessmentSchema,
  submitAssessmentSchema,
  integrityEventSchema,
  foundationInstallSchema,
  lessonProgressSchema,
])

type AssessmentKey = z.infer<typeof questionSchema>
type CourseLesson = { id?: unknown }
type DatabaseAssessment = {
  id: string
  course_id: string
  duration_minutes: number
  pass_mark: number
  max_attempts: number
  published: boolean
}
type DatabaseAttempt = {
  id: string
  assessment_id: string
  course_id: string
  user_id: string
  attempt_number: number
  status: 'in-progress' | 'submitted' | 'expired'
  deadline_at: string
}

function requireAdmin(actor: Actor) {
  if (!actor.admin) throw new BusinessError(403, 'Only AFC instructors can manage assessments.')
}

function learnerQuestion(question: AssessmentKey) {
  return { id: question.id, prompt: question.prompt, choices: question.choices }
}

async function requireEnrollment(db: SupabaseClient, actor: Actor, courseId: string) {
  const { data, error } = await db
    .from('afc_enrollments')
    .select('status')
    .eq('user_id', actor.uid)
    .eq('course_id', courseId)
    .maybeSingle()
  if (error) throw new BusinessError(503, 'AFC enrolment services are unavailable.')
  if (!data || !['active', 'completed'].includes(String(data.status)))
    throw new BusinessError(403, 'Enroll in this course before starting its assessment.')
}

async function readAssessment(db: SupabaseClient, assessmentId: string): Promise<DatabaseAssessment> {
  const { data, error } = await db
    .from('afc_assessments')
    .select('id, course_id, duration_minutes, pass_mark, max_attempts, published')
    .eq('id', assessmentId)
    .maybeSingle()
  if (error) throw new BusinessError(503, 'AFC assessment services are unavailable.')
  if (!data || !data.published) throw new BusinessError(404, 'This assessment is not available.')
  return data as DatabaseAssessment
}

async function readQuestions(db: SupabaseClient, assessmentId: string): Promise<AssessmentKey[]> {
  const { data, error } = await db
    .from('afc_assessment_keys')
    .select('questions')
    .eq('assessment_id', assessmentId)
    .maybeSingle()
  if (error || !data || !Array.isArray(data.questions) || data.questions.length === 0)
    throw new BusinessError(503, 'Assessment content is temporarily unavailable.')
  return z.array(questionSchema).parse(data.questions)
}

async function audit(db: SupabaseClient, actorId: string, action: string, payload: Record<string, unknown>) {
  const { error } = await db.from('afc_audit_log').insert({ actor_id: actorId, action, payload })
  if (error) throw new BusinessError(503, 'AFC audit services are unavailable.')
}

async function installFoundationCourses(db: SupabaseClient) {
  const records = afcStarterCourses.map((course) => ({
    id: course.slug,
    slug: course.slug,
    title: course.title,
    summary: course.summary,
    category: course.category,
    level: course.level,
    price_ghs: course.priceGhs,
    instructor_name: course.instructorName,
    cover_image: course.coverImage,
    published: course.published,
    estimated_hours: course.estimatedHours,
    outcomes: course.outcomes,
    lessons: course.lessons,
    assignments: course.assignments ?? [],
  }))
  const { error } = await db.from('afc_courses').upsert(records, { onConflict: 'id', ignoreDuplicates: true })
  if (error) throw new BusinessError(503, 'AFC course installation is unavailable.')
}

export async function supabaseAfcCommand(db: SupabaseClient, actor: Actor, raw: unknown) {
  const command = commandSchema.parse(raw)

  if (command.action === 'foundation-install') {
    requireAdmin(actor)
    await installFoundationCourses(db)
    let installed = 0
    for (const assessment of foundationAssessments) {
      const { data: course, error: courseError } = await db.from('afc_courses').select('id').eq('id', assessment.courseId).maybeSingle()
      if (courseError) throw new BusinessError(503, 'AFC course installation is unavailable.')
      if (!course) throw new BusinessError(409, 'Install the AFC courses before their assessments.')

      const { data: inserted, error } = await db.from('afc_assessments').upsert({
        id: assessment.id,
        course_id: assessment.courseId,
        title: assessment.title,
        duration_minutes: assessment.durationMinutes,
        pass_mark: assessment.passMark,
        max_attempts: assessment.maxAttempts,
        question_count: assessment.questions.length,
        published: true,
        created_by: actor.uid,
      }, { onConflict: 'id', ignoreDuplicates: true }).select('id')
      if (error) throw new BusinessError(503, 'AFC assessment installation is unavailable.')
      if (inserted?.length) {
        installed += 1
        const { error: keyError } = await db.from('afc_assessment_keys').insert({ assessment_id: assessment.id, questions: assessment.questions })
        if (keyError) throw new BusinessError(503, 'AFC assessment installation is unavailable.')
        await audit(db, actor.uid, 'foundation-assessment-installed', { assessmentId: assessment.id })
      }
    }
    return { installed, total: foundationAssessments.length }
  }

  if (command.action === 'assessment-create') {
    requireAdmin(actor)
    const { data: course, error: courseError } = await db.from('afc_courses').select('id').eq('id', command.courseId).maybeSingle()
    if (courseError) throw new BusinessError(503, 'AFC course services are unavailable.')
    if (!course) throw new BusinessError(404, 'Choose an existing AFC course.')
    const assessmentId = `asm_${randomUUID()}`
    const { error } = await db.from('afc_assessments').insert({
      id: assessmentId,
      course_id: command.courseId,
      title: command.title,
      duration_minutes: command.durationMinutes,
      pass_mark: command.passMark,
      max_attempts: command.maxAttempts,
      question_count: command.questions.length,
      published: true,
      created_by: actor.uid,
    })
    if (error) throw new BusinessError(503, 'AFC assessment creation is unavailable.')
    const { error: keyError } = await db.from('afc_assessment_keys').insert({ assessment_id: assessmentId, questions: command.questions })
    if (keyError) {
      await db.from('afc_assessments').delete().eq('id', assessmentId)
      throw new BusinessError(503, 'AFC assessment creation is unavailable.')
    }
    await audit(db, actor.uid, 'assessment-created', { assessmentId })
    return { assessmentId }
  }

  if (command.action === 'assessment-start') {
    const assessment = await readAssessment(db, command.assessmentId)
    await requireEnrollment(db, actor, assessment.course_id)
    const questions = await readQuestions(db, command.assessmentId)
    const { data: attempts, error } = await db.from('afc_assessment_attempts')
      .select('id, assessment_id, course_id, user_id, attempt_number, status, deadline_at')
      .eq('assessment_id', command.assessmentId).eq('user_id', actor.uid).order('attempt_number')
    if (error) throw new BusinessError(503, 'AFC assessment services are unavailable.')
    const current = (attempts as DatabaseAttempt[] | null)?.find((attempt) => attempt.status === 'in-progress')
    if (current) return { attemptId: current.id, deadlineAt: Date.parse(current.deadline_at), questions: questions.map(learnerQuestion) }
    const used = new Set((attempts ?? []).map((attempt) => Number(attempt.attempt_number)))
    const number = Array.from({ length: assessment.max_attempts }, (_, index) => index + 1).find((candidate) => !used.has(candidate))
    if (!number) throw new BusinessError(409, 'You have used all attempts for this assessment.')
    const deadlineAt = new Date(Date.now() + assessment.duration_minutes * 60_000).toISOString()
    const { data: created, error: createError } = await db.from('afc_assessment_attempts').insert({
      assessment_id: command.assessmentId,
      course_id: assessment.course_id,
      user_id: actor.uid,
      attempt_number: number,
      deadline_at: deadlineAt,
    }).select('id, deadline_at').single()
    if (createError || !created) {
      // A concurrent start consumes the same unique slot. Re-read once so the
      // learner receives that active attempt instead of a misleading failure.
      const { data: retried } = await db.from('afc_assessment_attempts').select('id, deadline_at, status')
        .eq('assessment_id', command.assessmentId).eq('user_id', actor.uid).eq('attempt_number', number).maybeSingle()
      if (retried?.status === 'in-progress') return { attemptId: retried.id, deadlineAt: Date.parse(retried.deadline_at), questions: questions.map(learnerQuestion) }
      throw new BusinessError(503, 'AFC assessment services are unavailable.')
    }
    return { attemptId: created.id, deadlineAt: Date.parse(created.deadline_at), questions: questions.map(learnerQuestion) }
  }

  if (command.action === 'lesson-progress') {
    const { data: course, error: courseError } = await db.from('afc_courses').select('published, lessons').eq('id', command.courseId).maybeSingle()
    if (courseError) throw new BusinessError(503, 'AFC learning services are unavailable.')
    if (!course || !course.published) throw new BusinessError(404, 'This course is not available.')
    const { data: enrollment, error: enrollmentError } = await db.from('afc_enrollments')
      .select('status, completed_lesson_ids').eq('user_id', actor.uid).eq('course_id', command.courseId).maybeSingle()
    if (enrollmentError) throw new BusinessError(503, 'AFC learning services are unavailable.')
    if (!enrollment || !['active', 'completed'].includes(String(enrollment.status)))
      throw new BusinessError(403, 'Enroll in this course before recording lesson progress.')
    const lessonIds = (Array.isArray(course.lessons) ? course.lessons : [])
      .map((lesson) => typeof (lesson as CourseLesson).id === 'string' ? (lesson as CourseLesson).id as string : '')
      .filter(Boolean)
    const lessonIndex = lessonIds.indexOf(command.lessonId)
    if (lessonIndex < 0) throw new BusinessError(400, 'That lesson does not belong to this course.')
    const prior = Array.isArray(enrollment.completed_lesson_ids) ? enrollment.completed_lesson_ids.filter((id): id is string => typeof id === 'string' && lessonIds.includes(id)) : []
    const completed = new Set(prior)
    if (command.completed) {
      if (lessonIds.slice(0, lessonIndex).some((id) => !completed.has(id)))
        throw new BusinessError(409, 'Complete the preceding lesson before continuing.')
      completed.add(command.lessonId)
    } else {
      if (lessonIds.slice(lessonIndex + 1).some((id) => completed.has(id)))
        throw new BusinessError(409, 'Reopen later lessons before reopening this lesson.')
      completed.delete(command.lessonId)
    }
    const completedLessonIds = lessonIds.filter((id) => completed.has(id))
    const progress = Math.round((completedLessonIds.length / lessonIds.length) * 100)
    const status = completedLessonIds.length === lessonIds.length ? 'completed' : 'active'
    const { error: updateError } = await db.from('afc_enrollments').update({ completed_lesson_ids: completedLessonIds, progress, status })
      .eq('user_id', actor.uid).eq('course_id', command.courseId)
    if (updateError) throw new BusinessError(503, 'AFC learning services are unavailable.')
    await audit(db, actor.uid, command.completed ? 'lesson-completed' : 'lesson-reopened', { courseId: command.courseId, lessonId: command.lessonId })
    return { completedLessonIds, progress, status }
  }

  if (command.action === 'assessment-submit') {
    const { data: attempt, error: attemptError } = await db.from('afc_assessment_attempts')
      .select('id, assessment_id, course_id, user_id, attempt_number, status, deadline_at')
      .eq('id', command.attemptId).eq('user_id', actor.uid).maybeSingle()
    if (attemptError) throw new BusinessError(503, 'AFC assessment services are unavailable.')
    if (!attempt) throw new BusinessError(404, 'Assessment attempt not found.')
    if (attempt.status !== 'in-progress') throw new BusinessError(409, 'This assessment attempt is already closed.')
    const assessment = await readAssessment(db, attempt.assessment_id)
    const questions = await readQuestions(db, attempt.assessment_id)
    const allowed = new Set(questions.map((question) => question.id))
    if (Object.keys(command.answers).some((id) => !allowed.has(id))) throw new BusinessError(400, 'The submitted answer set is invalid.')
    const expired = Date.now() > Date.parse(attempt.deadline_at)
    const correct = expired ? 0 : questions.filter((question) => command.answers[question.id] === question.correctOption).length
    const score = Math.round((correct / questions.length) * 100)
    const { data: updated, error: updateError } = await db.from('afc_assessment_attempts').update({
      status: expired ? 'expired' : 'submitted', answers: command.answers, score, passed: !expired && score >= assessment.pass_mark, submitted_at: new Date().toISOString(),
    }).eq('id', attempt.id).eq('status', 'in-progress').select('id').maybeSingle()
    if (updateError) throw new BusinessError(503, 'AFC assessment grading is unavailable.')
    if (!updated) throw new BusinessError(409, 'This assessment attempt is already closed.')
    await audit(db, actor.uid, expired ? 'assessment-expired' : 'assessment-submitted', { attemptId: attempt.id })
    return { score, passed: !expired && score >= assessment.pass_mark, expired }
  }

  const { data: attempt, error } = await db.from('afc_assessment_attempts').select('id, user_id, status').eq('id', command.attemptId).eq('user_id', actor.uid).maybeSingle()
  if (error) throw new BusinessError(503, 'AFC assessment services are unavailable.')
  if (!attempt || attempt.status !== 'in-progress') throw new BusinessError(404, 'Active assessment attempt not found.')
  const { error: eventError } = await db.from('afc_assessment_integrity_events').insert({ attempt_id: attempt.id, user_id: actor.uid, event_type: command.type })
  if (eventError) throw new BusinessError(503, 'AFC integrity services are unavailable.')
  return { recorded: true }
}
