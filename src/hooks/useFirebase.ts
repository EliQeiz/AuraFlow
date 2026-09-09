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
import type { ProjectRecord, RequestMessage } from '../types'

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
