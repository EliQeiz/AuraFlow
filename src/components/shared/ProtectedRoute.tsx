import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Skeleton } from '../ui/Skeleton'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) return <div className="section-shell pt-36"><Skeleton className="h-56 w-full" /></div>
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return children
}
