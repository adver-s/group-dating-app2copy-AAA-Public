export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { prisma } from '@/api/lib/database'
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library'
import { NextResponse } from 'next/server'


export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams.id.trim()
    if (!id) {
      return NextResponse.json({ error: 'invalid id' }, { status: 400 })
    }

    const team = await prisma.team.findUnique({
      where: { id }
    })
    if (!team) return NextResponse.json({ error: 'not found' }, { status: 404 })

    return NextResponse.json({ team }, { status: 200 })
  } catch (e) {
    const detail =
      e instanceof PrismaClientKnownRequestError
        ? { code: e.code, meta: (e as PrismaClientKnownRequestError).meta }
        : String(e)
    console.error('GET /api/teams/[id]/members/refresh failed:', e)
    return NextResponse.json({ error: 'internal', detail }, { status: 500 })
  }
}
