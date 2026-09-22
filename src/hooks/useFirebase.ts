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
import { getBlogPosts } from '../lib/firestore'
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
  return useLiveRows<ProjectRecord>(
    ['projects', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'projects'),
        where('userId', '==', uid),
        orderBy('updatedAt', 'desc'),
        limit(100),
      ),
    Boolean(uid),
  )
}
export function useProjectMessages(projectId?: string) {
  const { user } = useAuth()
  return useLiveRows<RequestMessage>(
    ['messages', user?.uid ?? '', projectId ?? ''],
    () =>
      query(
        collection(getFirebaseDb(), 'projects', projectId!, 'messages'),
        orderBy('createdAt', 'asc'),
        limitToLast(80),
      ),
    Boolean(projectId && user),
  )
}
export function useAdminProjects(enabled: boolean) {
  const { user } = useAuth()
  return useLiveRows<ProjectRecord>(
    ['admin-projects', user?.uid ?? ''],
    () =>
      query(
        collection(getFirebaseDb(), 'projects'),
        orderBy('updatedAt', 'desc'),
        limit(100),
      ),
    enabled && Boolean(user),
  )
}

export function useAfcCourses(includeUnpublished = false) {
  const { admin } = useAuth()
  return useLiveRows<AfcCourse>(
    ['afc-courses', includeUnpublished ? 'all' : 'published'],
    () => {
      const source = collection(getFirebaseDb(), 'afcCourses')
      return includeUnpublished ? source : query(source, where('published', '==', true))
    },
    includeUnpublished ? admin : true,
  )
}

export function useAfcEnrollments(uid?: string) {
  return useLiveRows<AfcEnrollment>(
    ['afc-enrollments', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcEnrollments'),
        where('userId', '==', uid),
      ),
    Boolean(uid),
  )
}

export function useAfcAssessments(courseId?: string, enabled = true) {
  return useLiveRows<AfcAssessment>(
    ['afc-assessments', courseId ?? 'none'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcAssessments'),
        where('courseId', '==', courseId),
        where('published', '==', true),
      ),
    Boolean(courseId) && enabled,
  )
}

export function useAfcSubmissions(uid?: string) {
  return useLiveRows<AfcSubmission>(
    ['afc-submissions', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcSubmissions'),
        where('userId', '==', uid),
      ),
    Boolean(uid),
  )
}

export function useAfcCertificates(uid?: string) {
  return useLiveRows<AfcCertificate>(
    ['afc-certificates', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcCertificates'),
        where('userId', '==', uid),
      ),
    Boolean(uid),
  )
}

export function useAfcEnrollmentRequests(uid?: string) {
  return useLiveRows<AfcEnrollmentRequest>(
    ['afc-enrollment-requests', uid ?? 'signed-out'],
    () =>
      query(
        collection(getFirebaseDb(), 'afcEnrollmentRequests'),
        where('userId', '==', uid),
      ),
    Boolean(uid),
  )
}

export function useAfcAllSubmissions(enabled: boolean) {
  return useLiveRows<AfcSubmission>(
    ['afc-submissions-admin'],
    () => collection(getFirebaseDb(), 'afcSubmissions'),
    enabled,
  )
}

export function useAfcAllEnrollmentRequests(enabled: boolean) {
  return useLiveRows<AfcEnrollmentRequest>(
    ['afc-enrollment-requests-admin'],
    () => collection(getFirebaseDb(), 'afcEnrollmentRequests'),
    enabled,
  )
}
