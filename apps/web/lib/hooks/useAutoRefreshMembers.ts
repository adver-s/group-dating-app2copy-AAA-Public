import { useEffect, useRef } from 'react'
import type { TeamDTO } from '@/types/team'

type Options = {
  teamId: number | undefined
  intervalMs?: number
  onData?: (team: TeamDTO) => void
  onError?: (err: unknown) => void
}

export function useAutoRefreshMembers(opts: Options) {
  const { teamId, intervalMs = 15000, onData, onError } = opts
  const timer = useRef<number | null>(null)

  useEffect(() => {
    if (!teamId || !Number.isFinite(teamId)) return

    let aborted = false
    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/teams/${teamId}/members/refresh`, {
          method: 'GET',
          headers: { 'cache-control': 'no-cache' },
        })
        if (!res.ok) throw new Error(`refresh failed: ${res.status}`)
        const json = await res.json()
        if (!aborted && json?.team) onData?.(json.team as TeamDTO)
      } catch (e) {
        if (!aborted) onError?.(e)
      }
    }

    // すぐ1回
    fetchOnce()
    // 周期実行
    timer.current = window.setInterval(fetchOnce, intervalMs) as unknown as number

    return () => {
      aborted = true
      if (timer.current) {
        clearInterval(timer.current)
        timer.current = null
      }
    }
  }, [teamId, intervalMs, onData, onError])
}
