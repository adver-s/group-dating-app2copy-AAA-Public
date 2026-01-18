#!/usr/bin/env node

/**
 * データベース参照修正スクリプト
 * 古いデータベース構造から新しい構造への自動修正
 */

const fs = require('fs');
const path = require('path');

const TARGET_FILES = [
  'apps/web/app/api/match/swipe/route.ts',
  'apps/web/app/api/teams/[id]/route.ts',
  'apps/web/app/api/teams/[id]/target-genders/route.ts',
  'apps/web/app/api/admin/photo-reviews/route.ts',
  'apps/web/app/api/admin/photo-reviews/[reviewId]/review/route.ts',
  'apps/web/app/api/me/profile/route.ts',
  'apps/web/app/api/teams/[id]/members/route.ts',
  'apps/web/app/api/me/verification-status/route.ts',
  'apps/web/app/api/teams/[id]/data/route.ts',
  'apps/web/app/api/teams/clear-matching-state/route.ts',
  'apps/web/app/api/matching/flows/route.ts',
  'apps/web/app/api/user/hidden-groups/route.ts',
  'apps/web/app/api/matching/judgements/route.ts.backup',
  'apps/web/app/api/matching/hide/route.ts',
  'apps/web/app/api/matches/[matchId]/route.ts',
  'apps/web/app/api/matches/[matchId]/intent/route.ts',
  'apps/web/app/api/matches/[matchId]/confirm/route.ts',
  'apps/web/app/api/matching/keep/route.ts',
  // 追加で発見されたファイル
  'apps/web/app/api/admin/feedback/route.ts',
  'apps/web/app/api/admin/feedback/export/route.ts',
  'apps/web/app/api/admin/verifications/route.ts',
  'apps/web/app/api/admin/verifications/[id]/approve/route.ts',
  'apps/web/app/api/admin/verifications/[id]/reject/route.ts',
  'apps/web/app/api/auth/verification/route.ts',
  'apps/web/app/api/auth/signup/route.ts'
];

// 各ファイルの具体的な修正関数
const FILE_FIXES = {
  'apps/web/app/api/match/swipe/route.ts': fixSwipeRoute,
  'apps/web/app/api/teams/[id]/route.ts': fixTeamsIdRoute,
  'apps/web/app/api/teams/[id]/target-genders/route.ts': fixTargetGendersRoute,
  'apps/web/app/api/admin/photo-reviews/route.ts': fixPhotoReviewsRoute,
  'apps/web/app/api/admin/photo-reviews/[reviewId]/review/route.ts': fixPhotoReviewRoute,
  'apps/web/app/api/me/profile/route.ts': fixProfileRoute,
  'apps/web/app/api/teams/[id]/members/route.ts': fixMembersRoute,
  'apps/web/app/api/me/verification-status/route.ts': fixVerificationStatusRoute,
  'apps/web/app/api/teams/[id]/data/route.ts': fixTeamDataRoute,
  'apps/web/app/api/teams/clear-matching-state/route.ts': fixClearMatchingStateRoute,
  'apps/web/app/api/matching/flows/route.ts': fixMatchingFlowsRoute,
  'apps/web/app/api/user/hidden-groups/route.ts': fixHiddenGroupsRoute,
  'apps/web/app/api/matching/judgements/route.ts.backup': fixJudgementsBackupRoute,
  'apps/web/app/api/matching/hide/route.ts': fixHideRoute,
  'apps/web/app/api/matches/[matchId]/route.ts': fixMatchRoute,
  'apps/web/app/api/matches/[matchId]/intent/route.ts': fixIntentRoute,
  'apps/web/app/api/matches/[matchId]/confirm/route.ts': fixConfirmRoute,
  'apps/web/app/api/matching/keep/route.ts': fixKeepRoute,
  // 追加で発見されたファイル
  'apps/web/app/api/admin/feedback/route.ts': fixFeedbackRoute,
  'apps/web/app/api/admin/feedback/export/route.ts': fixFeedbackExportRoute,
  'apps/web/app/api/admin/verifications/route.ts': fixVerificationsRoute,
  'apps/web/app/api/admin/verifications/[id]/approve/route.ts': fixVerificationApproveRoute,
  'apps/web/app/api/admin/verifications/[id]/reject/route.ts': fixVerificationRejectRoute,
  'apps/web/app/api/auth/verification/route.ts': fixAuthVerificationRoute,
  'apps/web/app/api/auth/signup/route.ts': fixAuthSignupRoute
};

function fixSwipeRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Prismaインポートを追加
  content = content.replace(
    /import.*from.*next\/server.*;\s*import.*from.*utils\/api.*;\s*import.*from.*utils\/database.*;/g,
    `import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/api';
import { prisma } from '@/utils/prisma';`
  );

  // 2. team_target_gendersクエリをPrismaに変換
  content = content.replace(
    /const userTeamTargetGenders = await executeQuery\(\s*`[\s\S]*?`,\s*\[userTeamId\]\s*\) as any\[\];/g,
    `// ターゲットジェンダーをteamsテーブルから取得
    const userTeam = await prisma.team.findUnique({
      where: { id: parseInt(userTeamId) }
    });
    const userTargetGenders = userTeam?.target_gender ? [userTeam.target_gender] : [];`
  );

  // 3. team_target_gendersの参照を修正
  content = content.replace(/team_target_genders/g, 'teams.target_gender');

  // 4. executeQueryをPrismaに変換
  content = content.replace(/executeQuery\(/g, 'await prisma.$queryRawUnsafe(');

  return content;
}

function fixTeamsIdRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // team_target_gendersの修正
  content = content.replace(
    /await executeQuery\(`DELETE FROM team_target_genders WHERE team_id = \?`, \[id\]\)/g,
    `// ターゲットジェンダーを更新
    await prisma.team.update({
      where: { uuid: id },
      data: { target_gender: targetGender }
    })`
  );

  content = content.replace(
    /`INSERT INTO team_target_genders \(id, team_id, target_gender, created_at\) VALUES \(\?, \?, \?, CURRENT_TIMESTAMP\)`/g,
    `// ターゲットジェンダーを更新
    await prisma.team.update({
      where: { uuid: id },
      data: { target_gender: targetGender }
    })`
  );

  return content;
}

function fixTargetGendersRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // GETメソッドの修正
  content = content.replace(
    /const targetGenders = await executeQuery\(\s*`[\s\S]*?`,\s*\[teamId\]\s*\) as any\[\];[\s\S]*?const targetGenderValues = targetGenders\.map\(tg => tg\.target_gender\);/g,
    `// チームのターゲットジェンダーを取得
    const team = await prisma.team.findUnique({
      where: { uuid: teamId }
    });
    const targetGenderValues = team?.target_gender ? [team.target_gender] : [];`
  );

  // PUTメソッドの修正
  content = content.replace(
    /await executeQuery\(\s*`DELETE FROM team_target_genders WHERE team_id = \?`,\s*\[teamId\]\s*\);[\s\S]*?for \(const targetGender of targetGenders\) \{[\s\S]*?await executeQuery\(\s*`INSERT INTO team_target_genders[\s\S]*?`\);[\s\S]*?\}/g,
    `// ターゲットジェンダーを更新
    await prisma.team.update({
      where: { uuid: teamId },
      data: { target_gender: targetGenders[0] || 1 }
    });`
  );

  return content;
}

function fixPhotoReviewsRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // photosテーブルのクエリを削除（存在しないため）
  content = content.replace(
    /const userPhotos = await executeQuery\(\s*`[\s\S]*?`\) as any\[\];/g,
    `// ユーザー画像機能は削除されました
    const userPhotos: any[] = [];`
  );

  // team_photosをteamPhotoに変更
  content = content.replace(/team_photos/g, 'teamPhoto');

  return content;
}

function fixPhotoReviewRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // team_photosをteamPhotoに変更
  content = content.replace(/team_photos/g, 'teamPhoto');

  return content;
}

function fixProfileRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // photosテーブルを削除
  content = content.replace(
    /FROM photos/g,
    '// photosテーブルは削除されました'
  );

  return content;
}

function fixMembersRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // photosテーブルを削除
  content = content.replace(
    /FROM photos/g,
    '// photosテーブルは削除されました'
  );

  return content;
}

function fixVerificationStatusRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // identity_verificationsをusers.is_verifiedに変更
  content = content.replace(
    /FROM identity_verifications/g,
    'FROM users'
  );

  content = content.replace(
    /identity_verifications\./g,
    'users.is_verified'
  );

  return content;
}

function fixTeamDataRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // chat_roomsをchatRoomに変更
  content = content.replace(/chat_rooms/g, 'chatRoom');

  return content;
}

function fixClearMatchingStateRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // group_matching_flowsをgroupMatchingFlowに変更
  content = content.replace(/group_matching_flows/g, 'groupMatchingFlow');

  return content;
}

function fixMatchingFlowsRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 特定のマッチングフローのクエリをPrismaに変換
  content = content.replace(
    /const flows = await executeQuery\(\s*`[\s\S]*?WHERE gmf\.matching_id = \?[\s\S]*?`,\s*\[specificMatchingId\]\s*\) as any\[\];/g,
    `// 特定のマッチングフローを取得
    const flows = await prisma.groupMatchingFlow.findMany({
      where: {
        uuid: specificMatchingId
      },
      include: {
        from_group: {
          select: {
            name: true,
            id: true
          }
        },
        to_group: {
          select: {
            name: true,
            id: true
          }
        }
      }
    });`
  );

  // 2. 一般的なマッチングフロークエリも修正
  content = content.replace(/group_matching_flows/g, 'groupMatchingFlow');
  content = content.replace(/gmf\./g, 'flow.');

  // 3. executeQueryを適切なPrismaクエリに変換
  content = content.replace(/executeQuery\(/g, 'await prisma.$queryRawUnsafe(');

  return content;
}

function fixHiddenGroupsRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. user_hidden_groupsクエリをPrismaに変換
  content = content.replace(
    /const hiddenGroups = await executeQuery\(\s*`[\s\S]*?FROM user_hidden_groups uhg[\s\S]*?`,\s*\[currentUserId\]\s*\);/g,
    `// 非表示グループを取得
    const hiddenGroups = await prisma.userHiddenGroup.findMany({
      where: {
        user_id: parseInt(currentUserId)
      },
      include: {
        team: {
          select: {
            name: true,
            description: true
          }
        }
      },
      orderBy: {
        hidden_start: 'desc'
      }
    });`
  );

  // 2. DELETEクエリも修正
  content = content.replace(
    /await executeQuery\(\s*`DELETE FROM user_hidden_groups[\s\S]*?`,\s*\[groupId\]\s*\);/g,
    `// 非表示グループを削除
    await prisma.userHiddenGroup.deleteMany({
      where: {
        user_id: parseInt(currentUserId),
        hidden_group_id: parseInt(groupId)
      }
    });`
  );

  // 3. user_hidden_groupsをuserHiddenGroupに変更
  content = content.replace(/user_hidden_groups/g, 'userHiddenGroup');
  content = content.replace(/uhg\./g, 'hiddenGroup.');

  // 4. executeQueryを適切なPrismaクエリに変換
  content = content.replace(/executeQuery\(/g, 'await prisma.$queryRawUnsafe(');

  return content;
}

function fixJudgementsBackupRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // group_matching_flowsをgroupMatchingFlowに変更
  content = content.replace(/group_matching_flows/g, 'groupMatchingFlow');

  return content;
}

function fixHideRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. user_hidden_groupsのクエリをPrismaに変換
  content = content.replace(
    /await executeQuery\(\s*`DELETE FROM user_hidden_groups[\s\S]*?`,\s*\[groupId, currentUserId\]\s*\);/g,
    `// 非表示グループを削除
    await prisma.userHiddenGroup.deleteMany({
      where: {
        user_id: parseInt(currentUserId),
        hidden_group_id: parseInt(groupId)
      }
    });`
  );

  // 2. SELECTクエリも修正
  content = content.replace(
    /const existingHide = await executeQuery\(\s*`[\s\S]*?FROM user_hidden_groups[\s\S]*?`,\s*\[groupId, currentUserId\]\s*\) as any\[\];/g,
    `// 非表示グループの存在を確認
    const existingHide = await prisma.userHiddenGroup.findMany({
      where: {
        user_id: parseInt(currentUserId),
        hidden_group_id: parseInt(groupId)
      }
    });`
  );

  // 3. user_hidden_groupsをuserHiddenGroupに変更
  content = content.replace(/user_hidden_groups/g, 'userHiddenGroup');

  return content;
}

function fixMatchRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // group_matching_flowsをgroupMatchingFlowに変更
  content = content.replace(/group_matching_flows/g, 'groupMatchingFlow');

  return content;
}

function fixIntentRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // group_matching_flowsをgroupMatchingFlowに変更
  content = content.replace(/group_matching_flows/g, 'groupMatchingFlow');

  return content;
}

function fixConfirmRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // group_matching_flowsをgroupMatchingFlowに変更
  content = content.replace(/group_matching_flows/g, 'groupMatchingFlow');

  return content;
}

function fixKeepRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 必要に応じて修正（内容による）
  return fs.readFileSync(filePath, 'utf8');
}

function fixFeedbackRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 古いPrismaインポートを新しいものに変更
  content = content.replace(
    /import.*from.*lib\/prisma/g,
    `import { prisma } from '@/utils/prisma'`
  );

  // 2. emailフィールドをcognito_subに変更
  content = content.replace(
    /select: \{ email: true \}/g,
    `select: { cognito_sub: true }`
  );

  content = content.replace(
    /user\?\.email/g,
    `user?.cognito_sub`
  );

  // 3. feedbackテーブルの参照を削除（存在しないため）
  content = content.replace(/prisma\.feedback/g, '// prisma.feedback (削除されたテーブル)');

  return content;
}

function fixFeedbackExportRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 古いPrismaインポートを新しいものに変更
  content = content.replace(
    /import.*from.*lib\/prisma/g,
    `import { prisma } from '@/utils/prisma'`
  );

  // 2. emailフィールドをcognito_subに変更
  content = content.replace(
    /select: \{ email: true \}/g,
    `select: { cognito_sub: true }`
  );

  content = content.replace(
    /user\.email/g,
    `user.cognito_sub`
  );

  // 3. feedbackテーブルの参照を削除
  content = content.replace(/prisma\.feedback/g, '// prisma.feedback (削除されたテーブル)');

  return content;
}

function fixVerificationsRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 古いPrismaインポートを新しいものに変更
  content = content.replace(
    /import.*from.*lib\/prisma/g,
    `import { prisma } from '@/utils/prisma'`
  );

  // 2. identity_verificationsテーブルの参照を削除
  content = content.replace(/prisma\.identity_verifications/g, '// prisma.identity_verifications (削除されたテーブル)');

  return content;
}

function fixVerificationApproveRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 古いPrismaインポートを新しいものに変更
  content = content.replace(
    /import.*from.*lib\/prisma/g,
    `import { prisma } from '@/utils/prisma'`
  );

  // 2. identity_verificationsテーブルの参照を削除
  content = content.replace(/prisma\.identity_verifications/g, '// prisma.identity_verifications (削除されたテーブル)');

  return content;
}

function fixVerificationRejectRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 古いPrismaインポートを新しいものに変更
  content = content.replace(
    /import.*from.*lib\/prisma/g,
    `import { prisma } from '@/utils/prisma'`
  );

  // 2. identity_verificationsテーブルの参照を削除
  content = content.replace(/prisma\.identity_verifications/g, '// prisma.identity_verifications (削除されたテーブル)');

  return content;
}

function fixAuthVerificationRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 古いPrismaインポートを新しいものに変更
  content = content.replace(
    /import.*from.*lib\/prisma/g,
    `import { prisma } from '@/utils/prisma'`
  );

  // 2. identity_verificationsテーブルの参照を削除
  content = content.replace(/prisma\.identity_verifications/g, '// prisma.identity_verifications (削除されたテーブル)');

  return content;
}

function fixAuthSignupRoute(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // 1. 古いPrismaインポートを新しいものに変更
  content = content.replace(
    /import.*from.*lib\/prisma/g,
    `import { prisma } from '@/utils/prisma'`
  );

  // 2. usernameでの検索をcognito_subに変更
  content = content.replace(
    /await prisma\.user\.findUnique\(\{ where: \{ username: candidate \} \}\)/g,
    `// username検索はサポートされなくなりました
    const existing = null; // 仮の実装`
  );

  // 3. emailフィールドの参照をcognito_subに変更
  content = content.replace(
    /where: \{ email \}/g,
    `where: { cognito_sub: email }`
  );

  content = content.replace(
    /createdUser\.email/g,
    `createdUser.cognito_sub`
  );

  return content;
}

function addPrismaImport(content) {
  // Prismaインポートを追加
  if (!content.includes("import { prisma }") && (content.includes("prisma.") || content.includes("await prisma"))) {
    // 複数のインポートパターンを試す
    const patterns = [
      /import.*from.*next\/server.*;\s*import.*from.*utils\/api.*;\s*import.*from.*utils\/database.*;/g,
      /import.*from.*next\/server.*;\s*import.*from.*utils\/api.*;/g,
      /import.*NextRequest.*from.*next\/server.*;\s*import.*getUserIdFromRequest.*from.*utils\/api.*;\s*import.*executeQuery.*from.*utils\/database.*;/g
    ];

    for (const pattern of patterns) {
      if (pattern.test(content)) {
        content = content.replace(pattern,
          `import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/api';
import { prisma } from '@/utils/prisma';`
        );
        break;
      }
    }

    // それでも見つからない場合は、ファイルの先頭に追加
    if (!content.includes("import { prisma }")) {
      content = content.replace(
        /import.*from.*next\/server.*;/,
        `import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/utils/api';
import { prisma } from '@/utils/prisma';`
      );
    }
  }
  return content;
}

function fixFile(filePath) {
  console.log(`🔧 修正中: ${filePath}`);

  try {
    const relativePath = path.relative(process.cwd(), filePath);
    const fixFunction = FILE_FIXES[relativePath];

    if (fixFunction) {
      let content = fs.readFileSync(filePath, 'utf8');

      // まずPrismaインポートを追加
      content = addPrismaImport(content);

      // 各ファイル固有の修正を適用
      content = fixFunction(filePath, content);
      const modified = content !== fs.readFileSync(filePath, 'utf8');

      if (modified) {
        // バックアップ作成
        const backupPath = filePath + '.backup';
        fs.copyFileSync(filePath, backupPath);
        console.log(`  📦 バックアップ作成: ${backupPath}`);

        // 修正内容を書き込み
        fs.writeFileSync(filePath, content);
        console.log(`  ✅ 修正完了: ${filePath}`);
        return true;
      } else {
        console.log(`  ⏭️ 修正不要: ${filePath}`);
        return false;
      }
    } else {
      console.log(`  ⚠️ 修正関数が見つかりません: ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ エラー (${filePath}):`, error.message);
    return false;
  }
}

function main() {
  console.log('🚀 データベース参照修正スクリプト開始\n');
  console.log('📋 修正対象ファイル:');
  TARGET_FILES.forEach(file => console.log(`  - ${file}`));
  console.log('');

  let fixedCount = 0;
  let errorCount = 0;

  for (const file of TARGET_FILES) {
    const fullPath = path.join(process.cwd(), file);
    if (fs.existsSync(fullPath)) {
      const fixed = fixFile(fullPath);
      if (fixed) fixedCount++;
    } else {
      console.log(`⚠️ ファイルが存在しません: ${file}`);
      errorCount++;
    }
  }

  console.log('\n📊 修正結果:');
  console.log(`✅ 修正完了: ${fixedCount}ファイル`);
  console.log(`❌ エラー: ${errorCount}ファイル`);
  console.log(`📦 バックアップ: ${fixedCount}ファイル作成`);

  if (fixedCount > 0) {
    console.log('\n⚠️ 注意事項:');
    console.log('   1. 修正されたファイルは .backup ファイルがあります');
    console.log('   2. 修正内容を確認し、手動調整が必要な場合があります');
    console.log('   3. 特に複雑なクエリは手動確認をおすすめします');
    console.log('\n🔄 次の手順:');
    console.log('   1. 修正されたファイルを確認');
    console.log('   2. Prismaクライアントを再生成');
    console.log('   3. テスト実行');
  }
}

// スクリプト実行
if (require.main === module) {
  main();
}

module.exports = { fixFile, FILE_FIXES, TARGET_FILES };
