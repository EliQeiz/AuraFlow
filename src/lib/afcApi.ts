import { getFirebaseAuth } from './firebase'
import type { AfcAssessmentAttempt } from '../types'

type AssessmentDraftQuestion = {
  id: string
  prompt: string
  choices: string[]
  correctOption: number
}

async function afcRequest<T>(body: Record<string, unknown>): Promise<T> {
  const user = getFirebaseAuth().currentUser
  if (!user) throw new Error('Sign in to continue.')
  const response = await fetch('/api/afc', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${await user.getIdToken()}`,
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
