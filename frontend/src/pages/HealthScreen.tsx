import { useEffect, useState } from 'react'
import { checkConnection } from '../api/connection'

export default function HealthScreen() {
  const [connection, setConnection] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let current = true
    const abortController = new AbortController()

    async function load() {
      try {
        const response = await checkConnection(abortController.signal)
        if (!current) return
        setConnection(response.connection)
      } catch (error) {
        if (!current) return
        if (abortController.signal.aborted) return
        const message = error instanceof Error ? error.message : 'Unknown error'
        setError(message)
      } finally {
        if (current) setLoading(false)
      }
    }

    load()

    return () => {
      current = false
      abortController.abort()
    }
  }, [])

  let content = connection
  if (loading) content = 'Loading...'
  else if (error) content = `Error: ${error}`

  return (
    <>
      <h1>API Connection Health</h1>
      <div>
        <p aria-label="connection-status">{content}</p>
      </div>
    </>
  )
}
