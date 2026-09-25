import { getFirebaseAuth } from './firebase'
import { backendProvider } from './backend'
import { getSupabase } from './supabase'
import type { AfcAssessmentAttempt } from '../types'

type AssessmentDraftQuestion = {
  id: string
  prompt: string
  choices: string[]
  correctOption: number
}

async function afcRequest<T>(body: Record<string, unknown>): Promise<T> {
  const token = backendProvider === 'supabase'
    ? (await getSupabase().auth.getSession()).data.session?.access_token
    : await getFirebaseAuth().currentUser?.getIdToken()
  if (!token) throw new Error('Sign in to continue.')
  const response = await fetch('/api/afc', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const result = (await response.json().catch(() => ({}))) as { message?: string }
  if (!response.ok) throw new Error(result.message || 'AFC could not complete that action.')
  return result as T
}

export async function createAfcAssessment(input: {
  courseId: string
  title: string
  durationMinutes: number
  passMark: number
  maxAttempts: number
  questions: AssessmentDraftQuestion[]
}) {
  return afcRequest<{ assessmentId: string }>({
    action: 'assessment-create',
    ...input,
  })
}

export async function installAfcFoundationAssessments() {
  return afcRequest<{ installed: number; total: number }>({
    action: 'foundation-install',
  })
}

export async function setAfcLessonProgress(input: {
  courseId: string
  lessonId: string
  completed: boolean
}) {
  return afcRequest<{
    completedLessonIds: string[]
    progress: number
    status: 'active' | 'completed'
  }>({
    action: 'lesson-progress',
    ...input,
  })
}

export async function startAfcAssessment(assessmentId: string) {
  return afcRequest<AfcAssessmentAttempt>({
    action: 'assessment-start',
    assessmentId,
  })
}

export async function submitAfcAssessment(
  attemptId: string,
  answers: Record<string, number>,
) {
  return afcRequest<{ score: number; passed: boolean; expired: boolean }>({
    action: 'assessment-submit',
    attemptId,
    answers,
  })
}

export async function recordAfcIntegrityEvent(
  attemptId: string,
  type:
    | 'visibility-hidden'
    | 'window-blur'
    | 'fullscreen-exit'
    | 'copy'
    | 'paste'
    | 'network-reconnected',
) {
  return afcRequest<{ recorded: boolean }>({
    action: 'integrity-event',
    attemptId,
    type,
  })
}
