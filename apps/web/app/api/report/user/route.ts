import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { reporterId, reportedUserId, reason, description } = body;
    
    if (!reporterId || !reportedUserId || !reason) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // モック実装：本来はDBに通報を保存
    const report = {
      id: Date.now().toString(),
      reporterId,
      reportedUserId,
      reason,
      description,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      reportId: report.id,
      message: 'Report submitted successfully'
    }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Report submission failed' }, { status: 500 });
  }
} 