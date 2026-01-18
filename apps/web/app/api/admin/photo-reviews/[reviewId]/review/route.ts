import { executeQuery } from '@/utils/database';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await params;
    const { status, notes } = await req.json();

    if (!status || !['active', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // まずteamPhotoテーブルで検索
    const teamPhoto = await executeQuery(`
      SELECT id FROM teamPhoto WHERE id = ?
    `, [reviewId]) as any[];

    if (teamPhoto.length > 0) {
      // チーム画像の場合
      await executeQuery(`
        UPDATE teamPhoto 
        SET status = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, notes || null, reviewId]);
    } else {
      // ユーザー画像の場合
      await executeQuery(`
        UPDATE photos 
        SET status = ?, review_notes = ?, reviewed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [status, notes || null, reviewId]);

      // 承認時は users.avatar_url をこの写真に更新（プロフィール用の個人アイコン）
      if (status === 'active') {
        const photoRows = await executeQuery(`
          SELECT user_id, photo_url, type
          FROM photos
          WHERE id = ?
        `, [reviewId]) as any[];

        if (photoRows.length > 0) {
          const { user_id, photo_url, type } = photoRows[0];
          // プロフィールアイコンとして設定されたもののみ反映（デフォルトは 'profile_icon'）
          if (!type || type === 'profile_icon') {
            await executeQuery(`
              UPDATE users
              SET avatar_url = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `, [photo_url, user_id]);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update review:', error);
    return NextResponse.json(
      { error: 'Failed to update review' },
      { status: 500 }
    );
  }
} 