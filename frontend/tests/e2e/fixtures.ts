import fs from 'node:fs'
import path from 'node:path'
import {
  test as baseTest,
  type Browser,
  type BrowserContext,
  type Page,
} from '@playwright/test'
import { createClient } from '@supabase/supabase-js'
import { loadEnv } from 'vite'

// One set of accounts per parallel worker, see
// https://playwright.dev/docs/auth#moderate-one-account-per-parallel-worker
// Every test on a worker shares its accounts: give created data unique names,
// and never sign out (it revokes the session server-side).

export * from '@playwright/test'

type Role = 'owner' | 'contributor' | 'outsider'

export type Account = {
  email: string
  password: string
  username: string
  storageState: Awaited<ReturnType<BrowserContext['storageState']>>
}

type TestFixtures = { contributorPage: Page; outsiderPage: Page }
type WorkerFixtures = Record<Role, Account>

const PASSWORD = 'password'

// The same VITE_ vars the dev server sees: frontend/.env locally, the job's
// env in CI
const env = loadEnv(
  'development',
  path.resolve(import.meta.dirname, '../..'),
  'VITE_',
)

// Exported for tests that need an account nobody else uses (e.g. sign-out)
export async function signUp(label: string): Promise<Account> {
  const baseURL = test.info().project.use.baseURL!
  const email = `playwright+${label}-${Date.now()}@e2e.test`

  // supabase-js saves the session through `storage`. Catching it here and
  // storing in storageState allows us to skip the sign up screen
  const saved = new Map<string, string>()
  const supabase = createClient(
    env.VITE_SUPABASE_URL,
    env.VITE_SUPABASE_PUBLISHABLE_KEY,
    {
      auth: {
        storage: {
          getItem: (key) => saved.get(key) ?? null,
          setItem: (key, value) => void saved.set(key, value),
          removeItem: (key) => void saved.delete(key),
        },
        autoRefreshToken: false,
      },
    },
  )

  const { data, error } = await supabase.auth.signUp({
    email,
    password: PASSWORD,
  })
  if (error) throw error
  // if email confirmation was turned on (off by default locally), won't return session
  if (!data.session) throw new Error(`No session after signing up ${email}`)

  // New accounts get an auto username (see 002_create_profiles.sql),
  // grab it from API. If DB connection fails, it fails here first.
  const res = await fetch(new URL('/api/me/profile', baseURL), {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
  })
  if (!res.ok) throw new Error(`GET /api/me/profile failed: ${res.status}`)
  const { username } = await res.json()
  if (typeof username !== 'string')
    throw new Error('profile response missing username')

  return {
    email,
    password: PASSWORD,
    username,
    storageState: {
      cookies: [],
      origins: [
        {
          origin: new URL(baseURL).origin,
          localStorage: [...saved].map(([name, value]) => ({ name, value })),
        },
      ],
    },
  }
}

async function acquireAccount(role: Role): Promise<Account> {
  const id = test.info().parallelIndex // worker index

  // outputDir is wiped each run, so each run signs up fresh
  const fileName = path.resolve(
    test.info().project.outputDir,
    `.auth/${id}-${role}.json`,
  )
  if (fs.existsSync(fileName)) {
    return JSON.parse(fs.readFileSync(fileName, 'utf-8'))
  }

  const account = await signUp(`${role}-${id}`)
  fs.mkdirSync(path.dirname(fileName), { recursive: true })
  fs.writeFileSync(fileName, JSON.stringify(account))
  return account
}

function accountFixture(role: Role) {
  // eslint-disable-next-line no-empty-pattern
  return async ({}, use: (account: Account) => Promise<void>) =>
    use(await acquireAccount(role))
}

async function pageFor(
  browser: Browser,
  baseURL: string | undefined,
  account: Account,
  use: (page: Page) => Promise<void>,
) {
  const context = await browser.newContext({
    baseURL,
    storageState: account.storageState,
  })
  await use(await context.newPage())
  await context.close()
}

export const test = baseTest.extend<TestFixtures, WorkerFixtures>({
  // the built-in page/context log in as the owner by default
  storageState: ({ owner }, use) => use(owner.storageState),

  owner: [accountFixture('owner'), { scope: 'worker' }],
  contributor: [accountFixture('contributor'), { scope: 'worker' }],
  outsider: [accountFixture('outsider'), { scope: 'worker' }],

  contributorPage: ({ browser, baseURL, contributor }, use) =>
    pageFor(browser, baseURL, contributor, use),
  outsiderPage: ({ browser, baseURL, outsider }, use) =>
    pageFor(browser, baseURL, outsider, use),
})
