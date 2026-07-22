import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

// keep typescript happy by returning an explicitly not null user
export function useAuthProtected() {
  const { user, ...stuff } = useAuth()
  if (!user)
    throw new Error('protectedUseAuth must be used only in protected routes')
  return { user, ...stuff }
}
