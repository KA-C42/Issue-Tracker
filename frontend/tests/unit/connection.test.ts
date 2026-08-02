import { describe, it, expect, vi } from 'vitest'
import { checkConnection } from '@/api/connection'

describe('checkConnection', () => {
  it('returns the data when the response is ok and well-formed', async () => {
    const data = { connection: 'ok' }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => data,
      }),
    )

    const result = await checkConnection()

    expect(result).toEqual(data)
  })

  it('throws with the status when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: 503,
      }),
    )

    await expect(checkConnection()).rejects.toThrowError(
      'API unreachable, status: 503', // string copied from connection.ts
    )
  })

  it('throws when the response is missing the connection field', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ somethingElse: true }),
      }),
    )

    await expect(checkConnection()).rejects.toThrowError('Invalid response') // string copied from connection.ts
  })
})
