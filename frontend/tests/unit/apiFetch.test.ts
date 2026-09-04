import { describe, it, expect, vi } from 'vitest'
import { apiFetch } from '@/api/apiFetch'
import { supabase } from '@/auth/supabaseClient'
import { type ApiErrorBody } from '@/api/apiError'

vi.mock('@/auth/supabaseClient', () => ({
  supabase: { auth: { getSession: vi.fn() } },
}))

describe('apiFetch', () => {
  it('returns fetched data when response.ok === true', async () => {
    const data = {
      id: 42,
      title: 'Finding the answer',
      description:
        'The answer to the ultimate question of Life, the Universe, and Everything',
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => data,
      }),
    )

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: 'token' } },
    } as any)

    const result = await apiFetch('GET', '/projects')

    expect(result).toEqual(data)
  })

  it('throws a properly formatted ApiError when response.ok !== true', async () => {
    const errorInfo: ApiErrorBody = {
      code: 'BAD_CODE_NONO',
      message: 'it burns my processors, please write better',
      field: 'everything',
    }

    const status = 500

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: status,
        json: async () => ({ error: errorInfo }),
      }),
    )

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: 'token' } },
    } as any)

    await expect(() => apiFetch('GET', '/projects')).rejects.toMatchObject({
      status: status,
      error: errorInfo,
    })
  })

  it('throws a generic ApiError when the error body is not JSON', async () => {
    const status = 502
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValueOnce({
        ok: false,
        status: status,
        json: async () => {
          throw new SyntaxError('Unexpected token <')
        },
      }),
    )

    vi.mocked(supabase.auth.getSession).mockResolvedValueOnce({
      data: { session: { access_token: 'token' } },
    } as any)

    await expect(apiFetch('GET', '/projects')).rejects.toMatchObject({
      status: status,
    })
  })
})
