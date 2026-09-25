import { onIdTokenChanged } from 'firebase/auth'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type PropsWithChildren,
} from 'react'
import { backendConfigured, backendProvider } from '../lib/backend'
import { getFirebaseAuth } from '../lib/firebase'
import { getSupabase } from '../lib/supabase'
import { toSupabaseAuraUser } from '../lib/supabase-auth'
import { completeGoogleRedirectSignIn, ensureUserProfile, logoutAccount, type AuraUser } from '../lib/auth'
import type { UserProfile } from '../types'

interface AuthValue {
  user: AuraUser | null
  profile: UserProfile | null
  loading: boolean
  admin: boolean
  profileError: string | null
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuraUser | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [admin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(backendConfigured)
  const [profileError, setProfileError] = useState<string | null>(null)
  const cache = useQueryClient()
  const profileRequest = useRef(0)

  const refreshProfile = useCallback(async () => {
    let normalized: AuraUser | null
    if (backendProvider === 'supabase') {
      const { data } = await getSupabase().auth.getUser()
      normalized = data.user ? toSupabaseAuraUser(data.user) : null
    } else {
      normalized = getFirebaseAuth().currentUser
    }
    if (!normalized) return
    const request = ++profileRequest.current
    const next = await ensureUserProfile(normalized)
    if (request === profileRequest.current) {
      setProfile(next)
      setProfileError(next ? null : 'Your profile is still syncing.')
    }
  }, [])

  useEffect(() => {
    if (!backendConfigured) return
    let generation = 0
    let lastUid: string | null = null
    const beginIdentity = (nextUser: AuraUser | null) => {
      const currentGeneration = ++generation
      const request = ++profileRequest.current
      if (lastUid !== (nextUser?.uid ?? null)) {
        cache.clear()
        setProfile(null)
        setAdmin(false)
      }
      lastUid = nextUser?.uid ?? null
      setUser(nextUser)
      setProfileError(null)
      setLoading(Boolean(nextUser))
      if (!nextUser) {
        setLoading(false)
        return
      }
      void ensureUserProfile(nextUser).then((nextProfile) => {
        if (generation !== currentGeneration || request !== profileRequest.current) return
        setProfile(nextProfile)
        if (!nextProfile) setProfileError('We could not sync your profile. Check your connection and retry.')
      })
      return { currentGeneration }
    }

    if (backendProvider === 'supabase') {
      let active = true
      const sync = async (rawUser: Parameters<typeof toSupabaseAuraUser>[0] | null) => {
        const result = beginIdentity(rawUser ? toSupabaseAuraUser(rawUser) : null)
        if (!rawUser || !result) return
        try {
          const { data, error } = await getSupabase()
            .from('user_roles')
            .select('role')
            .eq('user_id', rawUser.id)
            .maybeSingle()
          if (error) throw error
          if (active && generation === result.currentGeneration) setAdmin(data?.role === 'admin')
        } catch {
          if (active && generation === result.currentGeneration) setProfileError('Unable to refresh account permissions.')
        } finally {
          if (active && generation === result.currentGeneration) setLoading(false)
        }
      }
      void getSupabase().auth.getUser().then(({ data, error }) => {
        if (error) {
          setLoading(false)
          setProfileError('Unable to connect to account services.')
          return
        }
        void sync(data.user)
      })
      const { data: listener } = getSupabase().auth.onAuthStateChange((_event, session) => {
        void sync(session?.user ?? null)
      })
      return () => {
        active = false
        generation++
        listener.subscription.unsubscribe()
      }
    }

    void completeGoogleRedirectSignIn().catch(() => {
      setProfileError('Google sign-in could not be completed. Please try signing in again.')
    })
    const unsubscribe = onIdTokenChanged(
      getFirebaseAuth(),
      (nextUser) => {
        const result = beginIdentity(nextUser)
        if (!nextUser || !result) return
        void nextUser.getIdTokenResult()
          .then((token) => { if (generation === result.currentGeneration) setAdmin(token.claims.admin === true) })
          .catch(() => { if (generation === result.currentGeneration) setProfileError('Unable to refresh account permissions.') })
          .finally(() => { if (generation === result.currentGeneration) setLoading(false) })
      },
      () => {
        setLoading(false)
        setProfileError('Unable to connect to account services.')
      },
    )
    return () => {
      generation++
      unsubscribe()
    }
  }, [cache])

  const logout = useCallback(async () => {
    await logoutAccount()
    cache.clear()
  }, [cache])
  const value = useMemo(() => ({ user, profile, admin, loading, profileError, refreshProfile, logout }), [admin, loading, profile, profileError, refreshProfile, user, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
