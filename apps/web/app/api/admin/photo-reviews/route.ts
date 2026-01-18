import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '../../../../utils/database';

export async function GET(_req: NextRequest) {
  try {
    // 管理者権限チェック（実装が必要）
    // const isAdmin = await checkAdminPermissions(req);
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // チーム画像の取得
    const teamPhotos = await executeQuery(`
      SELECT 
        tp.id,
        tp.photo_url,
        tp.status,
        tp.moderation_result,
        tp.created_at,
        t.name as team_name,
        u.username as user_name,
        'team' as photo_type
      FROM teamPhoto tp
      JOIN teams t ON tp.team_id = t.id
      JOIN team_members tm ON t.id = tm.team_id
      JOIN users u ON tm.user_id = u.id
      WHERE tp.status IN ('pending_review', 'active', 'rejected')
      ORDER BY tp.created_at DESC
    `) as any[];

    // ユーザー画像の取得
    // ユーザー画像機能は削除されました
    const userPhotos: any[] = [];

    console.log('🔍 取得した画像データ:', {
      teamPhotos: teamPhotos.length,
      userPhotos: userPhotos.length
    });

    // 詳細な画像情報をログ出力
    if (teamPhotos.length > 0) {
      console.log('🔍 チーム画像詳細:', teamPhotos.map(photo => ({
        id: photo.id,
        status: photo.status,
        createdAt: photo.created_at,
        teamName: photo.team_name,
        userName: photo.user_name,
        photoUrl: photo.photo_url.substring(0, 100) + '...'
      })));
    }

    if (userPhotos.length > 0) {
      console.log('🔍 ユーザー画像詳細:', userPhotos.map(photo => ({
        id: photo.id,
        status: photo.status,
        createdAt: photo.created_at,
        userName: photo.user_name,
        originalType: photo.original_type,
        photoUrl: photo.photo_url.substring(0, 100) + '...'
      })));
    }

    // 両方の結果を結合して日付順にソートし、フロントエンド用の形式に変換
    const allPhotos = [...teamPhotos, ...userPhotos].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    console.log('🔍 結合後の画像データ:', {
      total: allPhotos.length,
      teamCount: teamPhotos.length,
      userCount: userPhotos.length
    });

    // フロントエンド用の形式に変換
    const reviews = allPhotos.map(photo => ({
      id: photo.id,
      photoUrl: photo.photo_url,
      teamName: photo.team_name,
      userName: photo.user_name,
      photoType: photo.photo_type,
      status: photo.status,
      moderationResult: photo.moderation_result ? JSON.parse(photo.moderation_result) : null,
      createdAt: photo.created_at
    }));

    console.log('🔍 変換後のレビューデータ:', {
      total: reviews.length,
      pending: reviews.filter(r => r.status === 'pending_review').length,
      active: reviews.filter(r => r.status === 'active').length,
      rejected: reviews.filter(r => r.status === 'rejected').length
    });

    console.log('🔍 最終レスポンス:', {
      total: reviews.length,
      reviews: reviews.map(r => ({
        id: r.id,
        status: r.status,
        photoType: r.photoType,
        userName: r.userName,
        teamName: r.teamName
      }))
    });

    return NextResponse.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    console.error('Failed to fetch photo reviews:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reviews'
      },
      { status: 500 }
    );
  }
} 