export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(_req: NextRequest) {
  // Dev stub: 3名中 3名確認済み とする
  const data = {
    allVerified: true,
    unverifiedMembers: [],
    totalMembers: 3,
    verifiedMembers: 3,
  }
  return NextResponse.json(data)
}

