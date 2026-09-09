import { onIdTokenChanged, type User } from 'firebase/auth'
import { useQueryClient } from '@tanstack/react-query'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from 'react'
import { firebaseConfigured, getFirebaseAuth } from '../lib/firebase'
import {
  completeGoogleRedirectSignIn,
  ensureUserProfile,
  logoutAccount,
} from '../lib/auth'
import type { UserProfile } from '../types'

interface AuthValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  admin: boolean
  profileError: string | null
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}
const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [admin, setAdmin] = useState(false)
  const [loading, setLoading] = useState(firebaseConfigured)
  const [profileError, setProfileError] = useState<string | null>(null)
  const cache = useQueryClient()
  const profileRequest = useRef(0)

  const refreshProfile = useCallback(async () => {
    const current = getFirebaseAuth().currentUser
    if (!current) return
    const request = ++profileRequest.current
    const next = await ensureUserProfile(current)
    if (
      request === profileRequest.current &&
      getFirebaseAuth().currentUser?.uid === current.uid
    ) {
      setProfile(next)
      setProfileError(next ? null : 'Your profile is still syncing.')
    }
  }, [])

  useEffect(() => {
    if (!firebaseConfigured) return
    let generation = 0
    let lastUid: string | null = null
    void completeGoogleRedirectSignIn().catch(() => {
      setProfileError(
        'Google sign-in could not be completed. Please try signing in again.',
      )
    })
    const unsubscribe = onIdTokenChanged(
      getFirebaseAuth(),
      (nextUser) => {
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
        // Identity is ready independently of a slow profile network request.
        void nextUser
          .getIdTokenResult()
          .then((token) => {
            if (generation === currentGeneration)
              setAdmin(token.claims.admin === true)
          })
          .catch(() => {
            if (generation === currentGeneration)
              setProfileError('Unable to refresh account permissions.')
          })
          .finally(() => {
            if (generation === currentGeneration) setLoading(false)
          })
        void ensureUserProfile(nextUser).then((nextProfile) => {
          if (
            generation !== currentGeneration ||
            request !== profileRequest.current
          )
            return
          setProfile(nextProfile)
          if (!nextProfile)
            setProfileError(
              'We could not sync your profile. Check your connection and retry.',
            )
        })
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
  const value = useMemo(
    () => ({
      user,
      profile,
      admin,
      loading,
      profileError,
      refreshProfile,
      logout,
    }),
    [admin, loading, profile, profileError, refreshProfile, user, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
