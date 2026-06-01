import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './UseAuth'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/auth" />
  return <Outlet />
}
