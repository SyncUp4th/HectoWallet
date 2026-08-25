import { useCallback, useEffect, useState } from 'react'

// Fetch-on-mount with a retry — without this, a rejected fetch (backend down,
// network error) leaves the caller stuck showing "불러오는 중…" forever,
// since a bare `.then()` with no `.catch()` never settles `data`.
export function useApiData(fetcher) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    fetcher()
      .then((res) => { if (!cancelled) setData(res) })
      .catch((err) => { if (!cancelled) setError(err) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt])

  const retry = useCallback(() => setAttempt((a) => a + 1), [])

  return { data, error, retry }
}
