import { useAuth } from '@/auth/UseAuth'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'

const REPO_URL = 'https://github.com/KA-C42/Issue-Tracker'
const CONTACT_EMAIL = 'kacycote42@gmail.com'

type AuthFields = { email: string; password: string }

const linkClass = 'underline-offset-4 hover:text-foreground hover:underline'

export default function AuthPage() {
  const navigate = useNavigate()
  const { signInWithEmail, signUpWithEmail, signInAnonymously } = useAuth()
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<AuthFields>()
  const [newUser, setNewUser] = useState(false)
  const [demoPending, setDemoPending] = useState(false)

  // one action at a time, submit and demo both block more button presses
  const busy = isSubmitting || demoPending

  const handleDemoSignIn = async () => {
    setDemoPending(true)
    const error = await signInAnonymously()

    if (error) {
      toast.error(error.message)
      setDemoPending(false)
    } else navigate('/')
  }

  // RHF keeps isSubmitting true until this promise settles
  const onSubmit = async ({ email, password }: AuthFields) => {
    const error = newUser
      ? await signUpWithEmail(email, password)
      : await signInWithEmail(email, password)

    if (error) toast.error(error.message)
    else navigate('/')
  }

  // TODO: Zod rules (validation pass)
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <header className="flex max-w-sm flex-col gap-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Issue Tracker</h1>
        <p className="text-sm text-muted-foreground">
          Plan projects, invite teammates, and move issues across a kanban
          board.
        </p>
        <p className="text-xs text-muted-foreground">
          React · TypeScript · Express · PostgreSQL
        </p>
      </header>

      <Card className="w-full max-w-sm">
        <CardContent className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Button
              size="lg"
              className="w-full"
              onClick={handleDemoSignIn}
              disabled={busy}
            >
              {demoPending
                ? 'Setting up your demo…'
                : 'Try the demo — no sign-up'}
            </Button>
            <p className="text-center text-muted-foreground">
              Your own pre-filled sample workspace, free to edit and explore.
            </p>
          </div>

          <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
            {newUser ? 'or create an account' : 'or sign in'}
          </FieldSeparator>

          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="auth-email">Email</FieldLabel>
                <Input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="auth-password">Password</FieldLabel>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={newUser ? 'new-password' : 'current-password'}
                  {...register('password')}
                />
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={busy}
            >
              {isSubmitting
                ? newUser
                  ? 'Creating account…'
                  : 'Signing in…'
                : newUser
                  ? 'Create account'
                  : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-muted-foreground">
            {newUser ? 'Already have an account?' : 'Need an account?'}{' '}
            <Button
              type="button"
              variant="link"
              className="h-auto p-0"
              onClick={() => setNewUser((v) => !v)}
              disabled={busy}
            >
              {newUser ? 'Sign in' : 'Sign up'}
            </Button>
          </p>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Built by Kacy Cote ·{' '}
        <a
          href={REPO_URL}
          target="_blank"
          rel="noreferrer"
          className={linkClass}
        >
          GitHub
        </a>{' '}
        ·{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
          Email
        </a>
      </p>
    </main>
  )
}
