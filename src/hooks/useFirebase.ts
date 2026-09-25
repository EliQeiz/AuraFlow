import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  collection,
  getDocs,
  limit,
  limitToLast,
  onSnapshot,
  orderBy,
  query,
  where,
  type Query,
} from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { seedPosts } from '../data/blog'
import { firebaseConfigured, getFirebaseDb } from '../lib/firebase'
import { backendProvider } from '../lib/backend'
import { getAdminProjects, getBlogPosts, getProjectMessages, getUserProjects } from '../lib/firestore'
import {
  listAfcCertificates,
  listAfcCourses,
  listAfcEnrollmentRequests,
  listAfcEnrollments,
  listAfcSubmissions,
} from '../lib/afc'
import { getSupabase } from '../lib/supabase'
import type {
  AfcCertificate,
  AfcAssessment,
  AfcCourse,
  AfcEnrollment,
  AfcEnrollmentRequest,
  AfcSubmission,
  ProjectRecord,
  RequestMessage,
} from '../types'

export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog'],
    queryFn: async () => {
      if (!firebaseConfigured) return seedPosts
      const posts = await getBlogPosts()
      return posts.length ? posts : seedPosts
    },
    initialData: seedPosts,
  })
}

export function useLiveRows<T>(
  key: string[],
  makeQuery: () => Query,
  enabled = true,
) {
  const cache = useQueryClient()
  const stableKey = JSON.stringify(key)
  const result = useQuery({
    queryKey: key,
    queryFn: async () => {
      const snapshot = await getDocs(makeQuery())
      return snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as T)
    },
    enabled: enabled && firebaseConfigured,
  })
  useEffect(() => {
    if (!enabled || !firebaseConfigured) return
    let active = true
    const unsubscribe = onSnapshot(
      makeQuery(),
      (snapshot) => {
        if (active)
          cache.setQueryData(
            JSON.parse(stableKey),
            snapshot.docs.map((item) => ({ ...item.data(), id: item.id })),
          )
      },
      () => {
        if (active)
          void cache.invalidateQueries({ queryKey: JSON.parse(stableKey) })
      },
    )
    return () => {
      active = false
      unsubscribe()
    }
    // The serialized key defines the query's complete identity.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stableKey, enabled, cache])
  return { ...result, data: result.data ?? ([] as T[]) }
}
export function useProjects(uid?: string) {
  const supabase = useQuery({
    queryKey: ['projects', 'supabase', uid ?? 'signed-out'],
    queryFn: () => getUserProjects(uid!),
    enabled: backendProvider === 'supabase' && Boolean(uid),
  })
  const firebase = useLiveRows<ProjectRecord>(
    ['projects', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'projects'),
        where('userId', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(100),
      ),
    backendProvider === 'firebase' && Boolean(uid),
  )
  return backendProvider === 'supabase'
    ? { ...supabase, data: supabase.data ?? ([] as ProjectRecord[]) }
    : firebase
}
export function useProjectMessages(projectId?: string) {
  const { user } = useAuth()
  const supabase = useQuery({
    queryKey: ['messages', 'supabase', user?.uid ?? '', projectId ?? ''],
    queryFn: () => getProjectMessages(projectId!),
    enabled: backendProvider === 'supabase' && Boolean(projectId && user),
  })
  const firebase = useLiveRows<RequestMessage>(
    ['messages', user?.uid ?? '', projectId ?? ''],
    () =>
      query(
        collection(getFirebaseDb(), 'projects', projectId!, 'messages'),
        orderBy('createdAt', 'asc'),
        limitToLast(80),
      ),
    backendProvider === 'firebase' && Boolean(projectId && user),
  )
  return backendProvider === 'supabase'
    ? { ...supabase, data: supabase.data ?? ([] as RequestMessage[]) }
    : firebase
}
export function useAdminProjects(enabled: boolean) {
  const { user } = useAuth()
  const supabase = useQuery({ queryKey: ['admin-projects', 'supabase', user?.uid ?? ''], queryFn: getAdminProjects, enabled: backendProvider === 'supabase' && enabled && Boolean(user) })
  const firebase = useLiveRows<ProjectRecord>(
    ['admin-projects', user?.uid ?? ''],
    () =>
      query(
        collection(getFirebaseDb(), 'projects'),
        orderBy('updatedAt', 'desc'),
        limit(100),
      ),
    backendProvider === 'firebase' && enabled && Boolean(user),
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as ProjectRecord[]) } : firebase
}

export function useAfcCourses(includeUnpublished = false) {
  const { admin } = useAuth()
  const supabase = useQuery({
    queryKey: ['afc-courses', 'supabase', includeUnpublished ? 'all' : 'published'],
    queryFn: () => listAfcCourses(includeUnpublished),
    enabled: backendProvider === 'supabase' && (!includeUnpublished || admin),
  })
  const firebase = useLiveRows<AfcCourse>(
    ['afc-courses', includeUnpublished ? 'all' : 'published'],
    () => {
      const source = collection(getFirebaseDb(), 'afcCourses')
      return includeUnpublished ? source : query(source, where('published', '==', true))
    },
    backendProvider === 'firebase' && (includeUnpublished ? admin : true),
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as AfcCourse[]) } : firebase
}

export function useAfcEnrollments(uid?: string) {
  const supabase = useQuery({ queryKey: ['afc-enrollments', 'supabase', uid ?? 'signed-out'], queryFn: () => listAfcEnrollments(uid!), enabled: backendProvider === 'supabase' && Boolean(uid) })
  const firebase = useLiveRows<AfcEnrollment>(
    ['afc-enrollments', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcEnrollments'),
        where('userId', '==', uid),
      ),
    backendProvider === 'firebase' && Boolean(uid),
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as AfcEnrollment[]) } : firebase
}

export function useAfcAssessments(courseId?: string, enabled = true) {
  const supabase = useQuery({
    queryKey: ['afc-assessments', 'supabase', courseId ?? 'none'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('afc_assessments').select('*').eq('course_id', courseId!).eq('published', true)
      if (error) throw new Error('AFC assessments are unavailable.')
      return (data ?? []).map((item) => ({ id: item.id, courseId: item.course_id, title: item.title, durationMinutes: item.duration_minutes, passMark: item.pass_mark, maxAttempts: item.max_attempts, questionCount: item.question_count, published: item.published, createdAt: item.created_at, updatedAt: item.updated_at }) as AfcAssessment)
    },
    enabled: backendProvider === 'supabase' && Boolean(courseId) && enabled,
  })
  const firebase = useLiveRows<AfcAssessment>(
    ['afc-assessments', courseId ?? 'none'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcAssessments'),
        where('courseId', '==', courseId),
        where('published', '==', true),
      ),
    backendProvider === 'firebase' && Boolean(courseId) && enabled,
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as AfcAssessment[]) } : firebase
}

export function useAfcSubmissions(uid?: string) {
  const supabase = useQuery({ queryKey: ['afc-submissions', 'supabase', uid ?? 'signed-out'], queryFn: () => listAfcSubmissions(uid!), enabled: backendProvider === 'supabase' && Boolean(uid) })
  const firebase = useLiveRows<AfcSubmission>(
    ['afc-submissions', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcSubmissions'),
        where('userId', '==', uid),
      ),
    backendProvider === 'firebase' && Boolean(uid),
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as AfcSubmission[]) } : firebase
}

export function useAfcCertificates(uid?: string) {
  const supabase = useQuery({ queryKey: ['afc-certificates', 'supabase', uid ?? 'signed-out'], queryFn: () => listAfcCertificates(uid!), enabled: backendProvider === 'supabase' && Boolean(uid) })
  const firebase = useLiveRows<AfcCertificate>(
    ['afc-certificates', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcCertificates'),
        where('userId', '==', uid),
      ),
    backendProvider === 'firebase' && Boolean(uid),
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as AfcCertificate[]) } : firebase
}

export function useAfcEnrollmentRequests(uid?: string) {
  const supabase = useQuery({ queryKey: ['afc-enrollment-requests', 'supabase', uid ?? 'signed-out'], queryFn: () => listAfcEnrollmentRequests(uid!), enabled: backendProvider === 'supabase' && Boolean(uid) })
  const firebase = useLiveRows<AfcEnrollmentRequest>(
    ['afc-enrollment-requests', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcEnrollmentRequests'),
        where('userId', '==', uid),
      ),
    backendProvider === 'firebase' && Boolean(uid),
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as AfcEnrollmentRequest[]) } : firebase
}

export function useAfcAllSubmissions(enabled: boolean) {
  const supabase = useQuery({
    queryKey: ['afc-submissions-admin', 'supabase'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('afc_submissions').select('*').order('created_at', { ascending: false })
      if (error) throw new Error('AFC submissions are unavailable.')
      return (data ?? []).map((item) => ({ id: item.id, userId: item.user_id, courseId: item.course_id, title: item.title, response: item.response, attachmentPath: item.attachment_path ?? undefined, status: item.status, score: item.score === null ? undefined : Number(item.score), reviewerNote: item.reviewer_note ?? undefined, createdAt: item.created_at, updatedAt: item.updated_at }) as AfcSubmission)
    }, enabled: backendProvider === 'supabase' && enabled,
  })
  const firebase = useLiveRows<AfcSubmission>(
    ['afc-submissions-admin'],
    () => collection(getFirebaseDb(), 'afcSubmissions'),
    backendProvider === 'firebase' && enabled,
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as AfcSubmission[]) } : firebase
}

export function useAfcAllEnrollmentRequests(enabled: boolean) {
  const supabase = useQuery({
    queryKey: ['afc-enrollment-requests-admin', 'supabase'],
    queryFn: async () => {
      const { data, error } = await getSupabase().from('afc_enrollment_requests').select('*').order('created_at', { ascending: false })
      if (error) throw new Error('AFC enrollment requests are unavailable.')
      return (data ?? []).map((item) => ({ id: item.id, userId: item.user_id, courseId: item.course_id, note: item.note, status: item.status, createdAt: item.created_at, updatedAt: item.updated_at }) as AfcEnrollmentRequest)
    }, enabled: backendProvider === 'supabase' && enabled,
  })
  const firebase = useLiveRows<AfcEnrollmentRequest>(
    ['afc-enrollment-requests-admin'],
    () => collection(getFirebaseDb(), 'afcEnrollmentRequests'),
    backendProvider === 'firebase' && enabled,
  )
  return backendProvider === 'supabase' ? { ...supabase, data: supabase.data ?? ([] as AfcEnrollmentRequest[]) } : firebase
}
