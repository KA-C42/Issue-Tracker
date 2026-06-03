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

  return (
    <div>
      <form
        onSubmit={handleSubmit(async (data) => {
          let error: AuthError | null

          if (newUser) error = await signUpWithEmail(data.email, data.password)
          else error = await signInWithEmail(data.email, data.password)

          if (error) {
            alert(error.message)
          } else navigate('/')
        })}
      >
        <input {...register('email')} placeholder="Email" />
        <input {...register('password')} placeholder="Password" />
        <input type="submit" />
      </form>
      <button type="button" onClick={() => setNewUser(!newUser)}>
        {newUser
          ? 'Already have an account? Sign in'
          : 'Need an account? Sign up'}
      </button>
    </div>
  )
}
