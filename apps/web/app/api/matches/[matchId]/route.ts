import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const { matchId } = await params;
    
    // team_matching_flowsテーブルからマッチング情報を取得
    const match = await executeQuery(`
      SELECT 
        tmf.id,
        tmf.status,
        tmf.created_at,
        tmf.updated_at,
        tmf.match_confirmed_at,
        t1.name as team1_name,
        t2.name as team2_name,
        t1.id as team1_id,
        t2.id as team2_id
      FROM team_matching_flows tmf
      JOIN teams t1 ON tmf.from_group_id = t1.id
      JOIN teams t2 ON tmf.to_group_id = t2.id
      WHERE tmf.id = ? AND tmf.status = 3
    `, [matchId]) as any[];

    if (match.length === 0) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 });
    }

    const matchData = match[0];

    return NextResponse.json({
      id: matchData.id,
      teams: [matchData.team1_id, matchData.team2_id],
      status: 'confirmed',
      teamName: `${matchData.team1_name} × ${matchData.team2_name}`,
      createdAt: matchData.created_at,
      confirmedAt: matchData.match_confirmed_at
    });
  } catch (error) {
    console.error('Match取得エラー:', error);
    return NextResponse.json(
      { error: 'Match取得エラー' },
      { status: 500 }
    );
  }
} 