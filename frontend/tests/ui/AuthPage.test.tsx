import { render, screen, waitFor } from '@testing-library/react'
import userEvent, { type UserEvent } from '@testing-library/user-event'
import { afterEach, test, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthError } from '@supabase/supabase-js'
import { toast } from 'sonner'
import AuthPage from '@/pages/AuthPage'
import { AuthContext, type AuthContextType } from '@/auth/AuthContext'

// vi.spyOn spies outlive their test unless restored
afterEach(() => {
  vi.restoreAllMocks()
})

function renderPage() {
  // user-event recommends calling setup() before render
  const user = userEvent.setup()
  const auth = {
    user: null,
    loading: false,
    signInWithEmail: vi
      .fn<AuthContextType['signInWithEmail']>()
      .mockResolvedValue(null),
    signUpWithEmail: vi
      .fn<AuthContextType['signUpWithEmail']>()
      .mockResolvedValue(null),
    signInAnonymously: vi
      .fn<AuthContextType['signInAnonymously']>()
      .mockResolvedValue(null),
    signOutProcess: vi
      .fn<AuthContextType['signOutProcess']>()
      .mockResolvedValue(null),
  }

  render(
    <AuthContext.Provider value={auth}>
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<p>dashboard</p>} />
        </Routes>
      </MemoryRouter>
    </AuthContext.Provider>,
  )

  return { user, auth }
}

async function submitCredentials(
  user: UserEvent,
  email: string,
  password: string,
  button: string,
) {
  await user.type(screen.getByLabelText(/email/i), email)
  await user.type(screen.getByLabelText(/password/i), password)
  await user.click(screen.getByRole('button', { name: button }))
}

test('locks every button while the demo sets up, so a double-click makes one guest', async () => {
  const { user, auth } = renderPage()
  // never resolves, so the demo stays pending
  auth.signInAnonymously.mockReturnValue(new Promise<never>(() => {}))

  const demoButton = screen.getByRole('button', { name: /try the demo/i })
  await user.dblClick(demoButton)

  expect(auth.signInAnonymously).toHaveBeenCalledTimes(1)
  expect(demoButton).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Sign up' })).toBeDisabled()
})

test('locks every button while an email sign-in is pending', async () => {
  const { user, auth } = renderPage()
  // never resolves, so the sign-in stays pending
  auth.signInWithEmail.mockReturnValue(new Promise<never>(() => {}))
  // grab it before submitting: its label becomes "Signing in…" while pending
  const signInButton = screen.getByRole('button', { name: 'Sign in' })

  await submitCredentials(user, 'kacy@test.dev', 'hunter22', 'Sign in')

  await waitFor(() => {
    expect(signInButton).toBeDisabled()
  })
  expect(screen.getByRole('button', { name: /try the demo/i })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Sign up' })).toBeDisabled()
})

test('a failed demo shows a toast, unlocks every button, and stays put', async () => {
  const toastError = vi.spyOn(toast, 'error')
  const { user, auth } = renderPage()
  auth.signInAnonymously.mockResolvedValue(
    new AuthError('Anonymous sign-ins are disabled'),
  )

  await user.click(screen.getByRole('button', { name: /try the demo/i }))

  await waitFor(() => {
    expect(toastError).toHaveBeenCalledWith('Anonymous sign-ins are disabled')
  })
  expect(toastError).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: /try the demo/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Sign up' })).toBeEnabled()
  expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
})

test('signs in with email and password by default', async () => {
  const { user, auth } = renderPage()

  await submitCredentials(user, 'kacy@test.dev', 'hunter22', 'Sign in')

  expect(await screen.findByText('dashboard')).toBeInTheDocument()
  expect(auth.signInWithEmail).toHaveBeenCalledWith('kacy@test.dev', 'hunter22')
  expect(auth.signUpWithEmail).not.toHaveBeenCalled()
})

test('creates an account instead after switching to sign up', async () => {
  const { user, auth } = renderPage()

  await user.click(screen.getByRole('button', { name: 'Sign up' }))
  await submitCredentials(user, 'kacy@test.dev', 'hunter22', 'Create account')

  expect(await screen.findByText('dashboard')).toBeInTheDocument()
  expect(auth.signUpWithEmail).toHaveBeenCalledWith('kacy@test.dev', 'hunter22')
  expect(auth.signInWithEmail).not.toHaveBeenCalled()
})

test('a failed sign-in shows a toast, unlocks every button, and stays put', async () => {
  const toastError = vi.spyOn(toast, 'error')
  const { user, auth } = renderPage()
  auth.signInWithEmail.mockResolvedValue(
    new AuthError('Invalid login credentials'),
  )

  await submitCredentials(user, 'kacy@test.dev', 'wrongpass', 'Sign in')

  await waitFor(() => {
    expect(toastError).toHaveBeenCalledWith('Invalid login credentials')
  })
  expect(toastError).toHaveBeenCalledTimes(1)
  expect(screen.getByRole('button', { name: 'Sign in' })).toBeEnabled()
  expect(screen.getByRole('button', { name: /try the demo/i })).toBeEnabled()
  expect(screen.getByRole('button', { name: 'Sign up' })).toBeEnabled()
  expect(screen.queryByText('dashboard')).not.toBeInTheDocument()
})
