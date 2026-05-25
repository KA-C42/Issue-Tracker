import { useState, useEffect } from 'react'
import type { User } from '@supabase/supabase-js'
import type { ReactNode } from 'react'
import { supabase } from './supabaseClient'
import { AuthContext } from './AuthContext'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  )
}
