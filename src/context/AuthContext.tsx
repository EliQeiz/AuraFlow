import { onAuthStateChanged, type User } from 'firebase/auth'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { firebaseConfigured, getFirebaseAuth } from '../lib/firebase'
import { getUserProfile } from '../lib/firestore'
import { logoutAccount } from '../lib/auth'
import type { UserProfile } from '../types'

interface AuthValue {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(firebaseConfigured)

  const refreshProfile = useCallback(async () => {
    if (!user || !firebaseConfigured) return
    setProfile(await getUserProfile(user.uid))
  }, [user])

  useEffect(() => {
    if (!firebaseConfigured) return

    return onAuthStateChanged(getFirebaseAuth(), async (nextUser) => {
      setUser(nextUser)
      try {
        setProfile(nextUser ? await getUserProfile(nextUser.uid) : null)
      } catch (error) {
        console.warn('AuraFlow profile load failed.', error)
        setProfile(null)
      } finally {
        setLoading(false)
      }
    })
  }, [])

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      logout: logoutAccount,
    }),
    [loading, profile, refreshProfile, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider.')
  return context
}
