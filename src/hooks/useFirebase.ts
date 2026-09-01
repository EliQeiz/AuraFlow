import { useQuery } from '@tanstack/react-query'
import { seedPosts } from '../data/blog'
import { firebaseConfigured } from '../lib/firebase'
import { getAdminProjects, getBlogPosts, getProjectMessages, getUserProjects } from '../lib/firestore'

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

export function useProjects(uid?: string) {
  return useQuery({
    queryKey: ['projects', uid],
    queryFn: () => (uid && firebaseConfigured ? getUserProjects(uid) : []),
    enabled: Boolean(uid),
    initialData: [],
  })
}

export function useProjectMessages(projectId?: string) {
  return useQuery({
    queryKey: ['messages', projectId],
    queryFn: () => (projectId && firebaseConfigured ? getProjectMessages(projectId) : []),
    enabled: Boolean(projectId),
    initialData: [],
  })
}

export function useAdminProjects(enabled: boolean) {
  return useQuery({
    queryKey: ['admin-projects'],
    queryFn: () => (enabled && firebaseConfigured ? getAdminProjects() : []),
    enabled,
    initialData: [],
  })
}
