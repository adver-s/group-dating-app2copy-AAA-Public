import { executeQuery } from '@/utils/database'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  context: any
) {
  const { params } = context as { params: { code: string } };
  try {
    const { code: inviteCode } = params

    console.log('🔍 招待コード処理開始:', inviteCode);

    // まず、新しい方式（invite_codesテーブル）で検索
    const inviteRows = await executeQuery(
      `
        SELECT 
          ic.id,
          ic.code,
          ic.team_id,
          ic.created_by,
          ic.created_at,
          ic.expires_at,
          t.name  AS team_name,
          t.description AS team_description,
          t.is_active,
          t.created_at AS team_created_at,
          t.updated_at AS team_updated_at
        FROM invite_codes ic
        JOIN teams t ON t.id = ic.team_id
        WHERE ic.code = ?
      `,
      [inviteCode]
    ) as any[]

    // 新しい方式で見つからない場合、古い方式（チームIDベース）で検索
    if (inviteRows.length === 0) {
      console.log('📝 新しい方式で見つからないため、古い方式で検索:', inviteCode);

      // チームIDとして直接検索
      const teamRows = await executeQuery(`
        SELECT id, name, description, is_active, created_at, updated_at
        FROM teams 
        WHERE id = ?
      `, [inviteCode]) as any[];

      if (teamRows.length === 0) {
        console.log('❌ チームが見つかりません:', inviteCode);
        return NextResponse.json(
          { error: '無効な招待コードです' },
          { status: 404 }
        );
      }

      const team = teamRows[0];

      // チームがアクティブかチェック
      if (!team.is_active) {
        return NextResponse.json(
          { error: 'このチームは現在非アクティブです' },
          { status: 410 }
        );
      }

      // メンバー数を取得
      const memberRows = await executeQuery(`
        SELECT COUNT(*) as count
        FROM team_members 
        WHERE team_id = ?
      `, [team.id]) as any[];

      let memberCountRaw = memberRows[0]?.count || 0;
      const memberCount = typeof memberCountRaw === 'bigint' ? Number(memberCountRaw) : memberCountRaw;

      return NextResponse.json({
        id: team.id,
        name: team.name,
        description: team.description,
        memberCount: memberCount,
        isActive: team.is_active,
        createdAt: team.created_at,
        updatedAt: team.updated_at,
        inviteCode: team.id, // チームIDを招待コードとして返す
        expiresAt: null // 古い方式では有効期限なし
      });
    }

    // 新しい方式の場合の処理
    console.log('✅ 新しい方式で招待コードが見つかりました')
    const invite = inviteRows[0]

    // 有効期限チェック（schema: expires_at）
    if (invite.expires_at && new Date() > new Date(invite.expires_at)) {
      return NextResponse.json(
        { error: '招待コードの有効期限が切れています' },
        { status: 410 }
      )
    }

    // チームがアクティブかチェック
    if (!invite.is_active) {
      return NextResponse.json(
        { error: 'このチームは現在非アクティブです' },
        { status: 410 }
      )
    }

    const memberCountRows = await executeQuery(
      `
        SELECT COUNT(*) as count
        FROM team_members
        WHERE team_id = ?
      `,
      [invite.team_id]
    ) as any[]

    const memberCountRaw = memberCountRows[0]?.count ?? 0
    const memberCount = typeof memberCountRaw === 'bigint' ? Number(memberCountRaw) : memberCountRaw

    return NextResponse.json({
      id: invite.team_id,
      name: invite.team_name,
      description: invite.team_description,
      memberCount,
      isActive: invite.is_active,
      createdAt: invite.team_created_at,
      updatedAt: invite.team_updated_at,
      inviteCode: invite.code,
      expiresAt: invite.expires_at
    })

  } catch (error) {
    console.error('招待コード情報取得エラー:', error);
    return NextResponse.json(
      { error: '招待情報の取得に失敗しました' },
      { status: 500 }
    );
  }
}
