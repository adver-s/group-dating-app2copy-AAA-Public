export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const proposalId = searchParams.get('proposalId')
  return NextResponse.json({
    success: true,
    proposalId,
    info: 'dev-stub: proposal exists',
  })
}

