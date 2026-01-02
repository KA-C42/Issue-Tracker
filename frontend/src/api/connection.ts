type HealthResponse = {
  connection: string
}

export async function checkConnection(
  abortSignal?: AbortSignal,
): Promise<HealthResponse> {
  const result = await fetch('/api/health', { signal: abortSignal })

  if (!result.ok) {
    throw new Error(`API unreachable, status: ${result.status}`)
  }

  const data = await result.json()

  if (!data?.connection) {
    throw new Error('Invalid response')
  }

  return data
}
