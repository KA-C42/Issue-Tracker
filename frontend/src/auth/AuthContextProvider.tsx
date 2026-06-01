import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { supabase } from './supabaseClient'
import { AuthContext } from './AuthContext'
import { useQueryClient } from '@tanstack/react-query'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    async function fetchUser() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch {
        // getSession fails in CI where no Supabase server is running
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    const authStateListener = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN') {
          setUser(session?.user ?? null)
          setLoading(false)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setLoading(false)
        }
      },
    )

    return () => {
      authStateListener.data.subscription.unsubscribe()
    }
  }, [])

  async function signInWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return error
  }

  async function signUpWithEmail(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password })
    return error
  }

  async function signOutProcess() {
    // clear local data and pending queries before sign out
    queryClient.clear()

    const { error } = await supabase.auth.signOut()
    return error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signInWithEmail,
        signUpWithEmail,
        signOutProcess,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
