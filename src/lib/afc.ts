import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore'
import type {
  AfcCertificate,
  AfcCourse,
  AfcEnrollment,
  AfcEnrollmentRequest,
  AfcSubmission,
} from '../types'
import { afcStarterCourses } from '../data/afcCourses'
import { getFirebaseAuth, getFirebaseDb } from './firebase'
import { backendProvider } from './backend'
import { getSupabase } from './supabase'

function currentUser() {
  if (backendProvider === 'supabase') {
    throw new Error('Use currentSupabaseUser for Supabase operations.')
  }
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to use AuraFlow Class.')
  return user
}

async function currentSupabaseUser() {
  const { data } = await getSupabase().auth.getUser()
  if (!data.user) throw new Error('Sign in to use AuraFlow Class.')
  return data.user
}

async function requireAfcAdmin() {
  if (backendProvider === 'supabase') {
    const user = await currentSupabaseUser()
    const { data, error } = await getSupabase().from('user_roles').select('role').eq('user_id', user.id).maybeSingle()
    if (error || data?.role !== 'admin') throw new Error('Only AuraFlow administrators can manage AFC courses.')
    return user
  }
  const user = currentUser()
  const token = await user.getIdTokenResult()
  if (token.claims.admin !== true)
    throw new Error('Only AuraFlow administrators can manage AFC courses.')
  return user
}

function asCourse(id: string, value: Record<string, unknown>): AfcCourse {
  return { id, ...value } as AfcCourse
}

export function afcYoutubeEmbedUrl(value?: string) {
  if (!value) return undefined
  try {
    const url = new URL(value)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    let id = ''
    if (host === 'youtu.be') id = url.pathname.split('/').filter(Boolean)[0] || ''
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      id = url.searchParams.get('v') || ''
      if (!id && url.pathname.startsWith('/embed/'))
        id = url.pathname.split('/').filter(Boolean)[1] || ''
    }
    return /^[a-zA-Z0-9_-]{11}$/.test(id)
      ? `https://www.youtube-nocookie.com/embed/${id}?rel=0`
      : undefined
  } catch {
    return undefined
  }
}

export async function listAfcCourses(includeUnpublished = false) {
  if (backendProvider === 'supabase') {
    let query = getSupabase().from('afc_courses').select('*').order('created_at')
    if (!includeUnpublished) query = query.eq('published', true)
    const { data, error } = await query
    if (error) throw new Error('AFC courses are unavailable.')
    return (data ?? []).map((item) => ({
      id: item.id, title: item.title, slug: item.slug, summary: item.summary, category: item.category,
      level: item.level, priceGhs: Number(item.price_ghs), instructorName: item.instructor_name,
      coverImage: item.cover_image ?? '', published: item.published, estimatedHours: item.estimated_hours,
      outcomes: Array.isArray(item.outcomes) ? item.outcomes : [], lessons: Array.isArray(item.lessons) ? item.lessons : [],
      assignments: Array.isArray(item.assignments) ? item.assignments : [], createdAt: item.created_at, updatedAt: item.updated_at,
    }) as AfcCourse)
  }
  const source = collection(getFirebaseDb(), 'afcCourses')
  const snapshot = await getDocs(
    includeUnpublished ? source : query(source, where('published', '==', true)),
  )
  return snapshot.docs.map((item) => asCourse(item.id, item.data()))
}

export async function listAfcEnrollments(uid: string) {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase().from('afc_enrollments').select('*').eq('user_id', uid)
    if (error) throw new Error('AFC enrolments are unavailable.')
    return (data ?? []).map((item) => ({ id: item.id, userId: item.user_id, courseId: item.course_id, status: item.status, completedLessonIds: Array.isArray(item.completed_lesson_ids) ? item.completed_lesson_ids : [], progress: item.progress, createdAt: item.created_at, updatedAt: item.updated_at }) as AfcEnrollment)
  }
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), 'afcEnrollments'), where('userId', '==', uid)),
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as AfcEnrollment,
  )
}

export async function listAfcSubmissions(uid: string) {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase().from('afc_submissions').select('*').eq('user_id', uid).order('created_at', { ascending: false })
    if (error) throw new Error('AFC submissions are unavailable.')
    return (data ?? []).map((item) => ({ id: item.id, userId: item.user_id, courseId: item.course_id, title: item.title, response: item.response, attachmentPath: item.attachment_path ?? undefined, status: item.status, score: item.score === null ? undefined : Number(item.score), reviewerNote: item.reviewer_note ?? undefined, createdAt: item.created_at, updatedAt: item.updated_at }) as AfcSubmission)
  }
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), 'afcSubmissions'), where('userId', '==', uid)),
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as AfcSubmission,
  )
}

export async function listAfcCertificates(uid: string) {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase().from('afc_certificates').select('*').eq('user_id', uid)
    if (error) throw new Error('AFC certificates are unavailable.')
    return (data ?? []).map((item) => ({ id: item.id, userId: item.user_id, courseId: item.course_id, certificateCode: item.certificate_code, issuedAt: item.issued_at }) as AfcCertificate)
  }
  const snapshot = await getDocs(
    query(collection(getFirebaseDb(), 'afcCertificates'), where('userId', '==', uid)),
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as AfcCertificate,
  )
}

export async function listAfcEnrollmentRequests(uid: string) {
  if (backendProvider === 'supabase') {
    const { data, error } = await getSupabase().from('afc_enrollment_requests').select('*').eq('user_id', uid)
    if (error) throw new Error('AFC enrollment requests are unavailable.')
    return (data ?? []).map((item) => ({ id: item.id, userId: item.user_id, courseId: item.course_id, note: item.note, status: item.status, createdAt: item.created_at, updatedAt: item.updated_at }) as AfcEnrollmentRequest)
  }
  const snapshot = await getDocs(
    query(
      collection(getFirebaseDb(), 'afcEnrollmentRequests'),
      where('userId', '==', uid),
    ),
  )
  return snapshot.docs.map(
    (item) => ({ id: item.id, ...item.data() }) as AfcEnrollmentRequest,
  )
}

export async function createAfcStarterCourses() {
  if (backendProvider === 'supabase') {
    await requireAfcAdmin()
    const records = afcStarterCourses.map((course) => ({ id: course.slug, slug: course.slug, title: course.title, summary: course.summary, category: course.category, level: course.level, price_ghs: course.priceGhs, instructor_name: course.instructorName, cover_image: course.coverImage, published: course.published, estimated_hours: course.estimatedHours, outcomes: course.outcomes, lessons: course.lessons, assignments: course.assignments ?? [] }))
    const { error } = await getSupabase().from('afc_courses').upsert(records, { onConflict: 'id', ignoreDuplicates: true })
    if (error) throw new Error('AFC course provisioning is unavailable.')
    return
  }
  await requireAfcAdmin()
  const db = getFirebaseDb()
  await Promise.all(
    afcStarterCourses.map(async (course) => {
      const reference = doc(db, 'afcCourses', course.slug)
      const existing = await getDoc(reference)
      await setDoc(reference, {
        ...course,
        ...(existing.exists() ? {} : { createdAt: serverTimestamp() }),
        updatedAt: serverTimestamp(),
      }, { merge: true })
    }),
  )
}

export async function saveAfcCourse(course: Omit<AfcCourse, 'id'>, id?: string) {
  await requireAfcAdmin()
  const title = course.title.trim()
  const slug = course.slug.trim().toLowerCase()
  if (title.length < 4 || title.length > 140)
    throw new Error('Use a course title between 4 and 140 characters.')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new Error('Use a lowercase course slug with letters, numbers, and hyphens.')
  if (course.lessons.length < 1 || course.lessons.length > 50)
    throw new Error('Add between 1 and 50 lessons before saving a course.')
  if (
    course.lessons.some(
      (lesson) =>
        lesson.title.trim().length < 3 ||
        lesson.title.trim().length > 180 ||
        !Number.isInteger(lesson.durationMinutes) ||
        lesson.durationMinutes < 1 ||
        lesson.durationMinutes > 480 ||
        (lesson.videoUrl && !afcYoutubeEmbedUrl(lesson.videoUrl)),
    )
  )
    throw new Error(
      'Each lesson needs a valid title, duration, and optional YouTube video URL.',
    )
  if (
    course.assignments &&
    (course.assignments.length > 8 ||
      course.assignments.some(
        (assignment) =>
          assignment.id.length < 3 ||
          assignment.id.length > 120 ||
          assignment.title.length < 4 ||
          assignment.title.length > 180 ||
          assignment.brief.length < 20 ||
          assignment.brief.length > 4000 ||
          assignment.deliverables.length < 1 ||
          assignment.deliverables.length > 10 ||
          assignment.rubric.length < 1 ||
          assignment.rubric.length > 10,
      ))
  )
    throw new Error('Each assignment needs a clear brief, deliverables, and review rubric.')
  if (backendProvider === 'supabase') {
    await requireAfcAdmin()
    const courseId = id || slug
    const { error } = await getSupabase().from('afc_courses').upsert({ id: courseId, slug, title, summary: course.summary, category: course.category, level: course.level, price_ghs: course.priceGhs, instructor_name: course.instructorName, cover_image: course.coverImage, published: course.published, estimated_hours: course.estimatedHours, outcomes: course.outcomes, lessons: course.lessons, assignments: course.assignments ?? [] }, { onConflict: 'id' })
    if (error) throw new Error('AFC course publishing is unavailable.')
    return courseId
  }
  const reference = doc(getFirebaseDb(), 'afcCourses', id || slug)
  await setDoc(
    reference,
    {
      ...course,
      title,
      slug,
      updatedAt: serverTimestamp(),
      ...(id ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  )
  return reference.id
}

export async function requestAfcEnrollment(course: AfcCourse, note = '') {
  if (backendProvider === 'supabase') {
    const user = await currentSupabaseUser()
    if (course.priceGhs === 0) {
      const { error } = await getSupabase().from('afc_enrollments').insert({ user_id: user.id, course_id: course.id, status: 'active' })
      if (error && error.code !== '23505') throw new Error('AFC enrollment is unavailable.')
      return 'enrolled'
    }
    const { error } = await getSupabase().from('afc_enrollment_requests').upsert({ user_id: user.id, course_id: course.id, note: note.trim().slice(0, 1000), status: 'submitted' }, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
    if (error) throw new Error('AFC enrollment request is unavailable.')
    return 'requested'
  }
  const user = currentUser()
  const db = getFirebaseDb()
  if (course.priceGhs === 0) {
    const reference = doc(db, 'afcEnrollments', `${user.uid}_${course.id}`)
    const existing = await getDoc(reference)
    if (!existing.exists())
      await setDoc(reference, {
        userId: user.uid,
        courseId: course.id,
        status: 'active',
        completedLessonIds: [],
        progress: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    return 'enrolled'
  }
  const reference = doc(db, 'afcEnrollmentRequests', `${user.uid}_${course.id}`)
  const existing = await getDoc(reference)
  if (!existing.exists())
    await setDoc(reference, {
      userId: user.uid,
      courseId: course.id,
      note: note.trim().slice(0, 1000),
      status: 'submitted',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  return 'requested'
}

export async function decideAfcEnrollmentRequest(
  request: AfcEnrollmentRequest,
  decision: 'approved' | 'declined',
) {
  if (backendProvider === 'supabase') {
    await requireAfcAdmin()
    const user = await currentSupabaseUser()
    const db = getSupabase()
    const { error } = await db.from('afc_enrollment_requests').update({ status: decision, decided_by: user.id }).eq('id', request.id)
    if (error) throw new Error('AFC enrollment review is unavailable.')
    if (decision === 'approved') {
      const { error: enrollmentError } = await db.from('afc_enrollments').upsert({ user_id: request.userId, course_id: request.courseId, status: 'active' }, { onConflict: 'user_id,course_id', ignoreDuplicates: true })
      if (enrollmentError) throw new Error('AFC enrollment review is unavailable.')
    }
    return
  }
  await requireAfcAdmin()
  const db = getFirebaseDb()
  await updateDoc(doc(db, 'afcEnrollmentRequests', request.id), {
    status: decision,
    updatedAt: serverTimestamp(),
  })
  if (decision === 'approved') {
    const enrollment = doc(db, 'afcEnrollments', `${request.userId}_${request.courseId}`)
    const existing = await getDoc(enrollment)
    if (!existing.exists())
      await setDoc(enrollment, {
        userId: request.userId,
        courseId: request.courseId,
        status: 'active',
        completedLessonIds: [],
        progress: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
  }
}

export async function submitAfcAssignment(input: {
  courseId: string
  title: string
  response: string
  attachmentPath?: string
}) {
  if (backendProvider === 'supabase') {
    const user = await currentSupabaseUser()
    const title = input.title.trim(), response = input.response.trim()
    if (title.length < 3 || title.length > 160) throw new Error('Use an assignment title between 3 and 160 characters.')
    if (response.length < 20 || response.length > 12000) throw new Error('Write a response between 20 and 12,000 characters.')
    const { data, error } = await getSupabase().from('afc_submissions').insert({ user_id: user.id, course_id: input.courseId, title, response, attachment_path: input.attachmentPath ?? null }).select('id').single()
    if (error || !data) throw new Error('AFC assignment submission is unavailable.')
    return data.id
  }
  const user = currentUser()
  const title = input.title.trim()
  const response = input.response.trim()
  if (title.length < 3 || title.length > 160)
    throw new Error('Use an assignment title between 3 and 160 characters.')
  if (response.length < 20 || response.length > 12000)
    throw new Error('Write a response between 20 and 12,000 characters.')
  const reference = doc(collection(getFirebaseDb(), 'afcSubmissions'))
  await setDoc(reference, {
    userId: user.uid,
    courseId: input.courseId,
    title,
    response,
    ...(input.attachmentPath ? { attachmentPath: input.attachmentPath } : {}),
    status: 'submitted',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return reference.id
}

export async function reviewAfcSubmission(
  submissionId: string,
  input: { status: 'reviewed' | 'returned'; score: number; reviewerNote: string },
) {
  if (backendProvider === 'supabase') {
    await requireAfcAdmin()
    if (!Number.isInteger(input.score) || input.score < 0 || input.score > 100) throw new Error('Use a whole-number score from 0 to 100.')
    const { error } = await getSupabase().from('afc_submissions').update({ status: input.status, score: input.score, reviewer_note: input.reviewerNote.trim().slice(0, 4000) }).eq('id', submissionId)
    if (error) throw new Error('AFC assignment review is unavailable.')
    return
  }
  await requireAfcAdmin()
  if (!Number.isInteger(input.score) || input.score < 0 || input.score > 100)
    throw new Error('Use a whole-number score from 0 to 100.')
  await updateDoc(doc(getFirebaseDb(), 'afcSubmissions', submissionId), {
    status: input.status,
    score: input.score,
    reviewerNote: input.reviewerNote.trim().slice(0, 4000),
    updatedAt: serverTimestamp(),
  })
}

export async function issueAfcCertificate(input: {
  userId: string
  courseId: string
}) {
  if (backendProvider === 'supabase') {
    await requireAfcAdmin()
    const code = `AFC-${new Date().getFullYear()}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
    const { error } = await getSupabase().from('afc_certificates').upsert({ user_id: input.userId, course_id: input.courseId, certificate_code: code }, { onConflict: 'user_id,course_id' })
    if (error) throw new Error('AFC certificate issuance is unavailable.')
    return
  }
  await requireAfcAdmin()
  const code = `AFC-${new Date().getFullYear()}-${crypto
    .randomUUID()
    .slice(0, 8)
    .toUpperCase()}`
  const reference = doc(getFirebaseDb(), 'afcCertificates', `${input.userId}_${input.courseId}`)
  await setDoc(
    reference,
    {
      userId: input.userId,
      courseId: input.courseId,
      certificateCode: code,
      issuedAt: serverTimestamp(),
    },
    { merge: true },
  )
}
