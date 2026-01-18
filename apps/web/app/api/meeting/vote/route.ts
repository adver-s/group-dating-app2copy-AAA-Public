export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { getUserIdFromRequest } from '../../../../utils/api'
import { getCounts, setVote } from '../../../../utils/votes-realtime'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const { itemId, vote } = body as { itemId?: string; vote?: 'UNSET'|'YES'|'NO' }
    if (!itemId || !vote) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const counts = setVote(itemId, userId, vote)
    return NextResponse.json({ success: true, itemId, vote, counts })
  } catch (e) {
    console.error('vote POST error', e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const itemId = searchParams.get('itemId')
    if (!itemId) return NextResponse.json({ error: 'itemId required' }, { status: 400 })
    const counts = getCounts(itemId)
    return NextResponse.json({ success: true, itemId, counts })
  } catch (e) {
    console.error('vote GET error', e)
    return NextResponse.json({ error: 'internal' }, { status: 500 })
  }
}
