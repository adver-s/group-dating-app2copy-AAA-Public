export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { onUpdate } from '../../../../../utils/votes-realtime'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(new TextEncoder().encode(`event: ping\ndata: "ok"\n\n`))
      const unsub = onUpdate((payload) => {
        const data = JSON.stringify(payload)
        controller.enqueue(new TextEncoder().encode(`event: update\ndata: ${data}\n\n`))
      })
      const onClose = () => { try { unsub() } catch {} }
      // @ts-ignore
      req.signal?.addEventListener('abort', onClose)
    },
    cancel() {},
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
