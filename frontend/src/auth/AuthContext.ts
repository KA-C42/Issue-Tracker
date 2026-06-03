import { createContext } from 'react'
import type { AuthError, User } from '@supabase/supabase-js'

export type AuthContextType = {
  user: User | null

  loading: boolean

  signInWithEmail: (
    email: string,
    password: string,
  ) => Promise<AuthError | null>

  signUpWithEmail: (
    email: string,
    password: string,
  ) => Promise<AuthError | null>

  signOutProcess: () => Promise<AuthError | null>
}

export const AuthContext = createContext<AuthContextType | null>(null)
