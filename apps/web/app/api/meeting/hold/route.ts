export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getHoldItems } from '../../../../utils/hold-store'

export async function GET(_req: NextRequest) {
  try {
    const items = getHoldItems()
    return NextResponse.json(items)
  } catch (e) {
    console.error('GET /api/meeting/hold error', e)
    return NextResponse.json([], { status: 200 })
  }
}

