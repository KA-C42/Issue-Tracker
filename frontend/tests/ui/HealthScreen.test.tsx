import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import HealthScreen from '../../src/pages/HealthScreen'
import { checkConnection } from '../../src/api/connection'

vi.mock('../../src/api/connection', () => ({
  checkConnection: vi.fn(),
}))

describe('HealthScreen', () => {
  it('displays a "Loading..." message on initial load', () => {
    render(<HealthScreen />)
    expect(screen.getByLabelText('connection-status')).toHaveTextContent(
      'Loading...',
    )
  })

  it('displays positive connection status on successful get /health', async () => {
    vi.mocked(checkConnection).mockResolvedValueOnce({ connection: 'ok' })
    render(<HealthScreen />)

    const status = await screen.findByLabelText('connection-status')
    expect(status).toHaveTextContent('ok')
  })

  it('displays error message on unsuccessful get /health', async () => {
    const errorString = 'API unreachable, status: schwoopsie'
    vi.mocked(checkConnection).mockRejectedValueOnce(new Error(errorString))
    render(<HealthScreen />)

    const status = await screen.findByLabelText('connection-status')
    expect(status).toHaveTextContent(`Error: ${errorString}`)
  })
})
