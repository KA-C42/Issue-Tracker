import { useAuth } from '@/auth/UseAuth'
import type { AuthError } from '@supabase/supabase-js'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'

export default function AuthPage() {
  const { register, handleSubmit } = useForm()
  const [newUser, setNewUser] = useState(false)
  const { signInWithEmail, signUpWithEmail } = useAuth()

  const navigate = useNavigate()

  // I intend to revisit all visual and verification when the frontend functionality is complete
  // for v1, some repetition of tailwind classes and wrappers is okay
  // TODO: loading state, ZOD, alerts
  return (
    <div className="flex min-h-screen items-center justify-center">
      <form
        className="flex w-full max-w-sm flex-col gap-4"
        onSubmit={handleSubmit(async (data) => {
          let error: AuthError | null

          if (newUser) error = await signUpWithEmail(data.email, data.password)
          else error = await signInWithEmail(data.email, data.password)

          if (error) {
            alert(error.message)
          } else navigate('/')
        })}
      >
        <h1 className="text-xl font-semibold">
          {newUser ? 'Sign up' : 'Sign in'}
        </h1>

        <div className="flex flex-col gap-1">
          <label htmlFor="email">Email</label>
          <input id="email" {...register('email')} className="border p-2" />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="border p-2"
          />
        </div>

        <button type="submit" className="border p-2">
          Submit
        </button>

        <button
          type="button"
          onClick={() => setNewUser(!newUser)}
          className="text-sm underline"
        >
          {newUser
            ? 'Already have an account? Sign in'
            : 'Need an account? Sign up'}
        </button>
      </form>
    </div>
  )
}
