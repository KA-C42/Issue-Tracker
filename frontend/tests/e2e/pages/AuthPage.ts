import type { Locator, Page } from '@playwright/test'

export class AuthPage {
  readonly page: Page
  readonly email: Locator
  readonly password: Locator
  readonly signInButton: Locator
  readonly createAccountButton: Locator
  readonly signUpToggle: Locator
  readonly signInToggle: Locator

  constructor(page: Page) {
    this.page = page
    this.email = page.getByLabel('Email')
    this.password = page.getByLabel('Password')

    // "Sign in" is both a submit and a toggle, so submits are scoped to the
    // form and toggles to the sentence they sit in
    const form = page.locator('form')
    this.signInButton = form.getByRole('button', { name: 'Sign in' })
    this.createAccountButton = form.getByRole('button', {
      name: 'Create account',
    })
    this.signUpToggle = page
      .getByText('Need an account?')
      .getByRole('button', { name: 'Sign up' })
    this.signInToggle = page
      .getByText('Already have an account?')
      .getByRole('button', { name: 'Sign in' })
  }

  async goto() {
    await this.page.goto('/auth')
  }

  async signUp(email: string, password: string) {
    await this.signUpToggle.click()
    await this.email.fill(email)
    await this.password.fill(password)
    // only exists in sign-up mode, so this also confirms the toggle worked
    await this.createAccountButton.click()
  }

  async signIn(email: string, password: string) {
    await this.email.fill(email)
    await this.password.fill(password)
    await this.signInButton.click()
  }
}
