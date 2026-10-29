import { test } from '@playwright/test'

// Accounts are shared across a worker's tests (see fixtures.ts), so created
// titles must be unique. Suffix: browser + worker + timestamp + counter.

let counter = 0

export function uniqueName(base: string) {
  const { project, workerIndex } = test.info()
  const browser = project.name.slice(0, 2)
  const stamp = Date.now().toString(36)

  return `${base} ${browser}${workerIndex}-${stamp}${counter++}`
}
