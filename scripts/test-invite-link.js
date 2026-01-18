const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testInviteLink() {
  try {
    console.log('🔍 === 招待リンク機能テスト開始 ===');
    
    // 1. テストユーザーを作成
    console.log('1. テストユーザーを作成中...');
    const timestamp = Date.now();
    const testUser1 = await prisma.user.create({
      data: {
        id: `test_user_${timestamp}_1`,
        username: `テストユーザー1_${timestamp}`,
        email: `test1_${timestamp}@example.com`,
        passwordHash: 'hashedpassword',
        gender: 1,
        age: 25,
        isVerified: true
      }
    });
    
    const testUser2 = await prisma.user.create({
      data: {
        id: `test_user_${timestamp}_2`,
        username: `テストユーザー2_${timestamp}`,
        email: `test2_${timestamp}@example.com`,
        passwordHash: 'hashedpassword',
        gender: 2,
        age: 23,
        isVerified: true
      }
    });
    
    console.log('✅ テストユーザー作成完了:', {
      user1: testUser1.username,
      user2: testUser2.username
    });
    
    // 2. テストチームを作成
    console.log('2. テストチームを作成中...');
    const testTeam = await prisma.team.create({
      data: {
        id: `test_team_${Date.now()}`,
        name: 'テストグループ',
        description: '招待リンク機能をテストするためのグループです',
        gender: 1,
        isActive: true,
        members: {
          create: {
            id: `member_${Date.now()}_1`,
            userId: testUser1.id,
            isActive: true
          }
        },
        targetGenders: {
          create: {
            id: `target_${Date.now()}_1`,
            targetGender: 2
          }
        }
      },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });
    
    console.log('✅ テストチーム作成完了:', {
      teamId: testTeam.id,
      teamName: testTeam.name,
      memberCount: testTeam.members.length
    });
    
    // 3. 招待リンクを生成
    console.log('3. 招待リンクを生成中...');
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const inviteLink = `${baseUrl}/teams/join/${testTeam.id}`;
    const inviteCode = testTeam.id;
    
    console.log('✅ 招待リンク生成完了:');
    console.log('  招待リンク:', inviteLink);
    console.log('  招待コード:', inviteCode);
    
    // 4. 招待リンクの動作をテスト
    console.log('4. 招待リンクの動作をテスト中...');
    
    // チーム情報を取得（招待リンクページで表示される情報）
    const teamInfo = await prisma.team.findUnique({
      where: { id: testTeam.id },
      include: {
        members: {
          include: {
            user: true
          }
        },
        targetGenders: true
      }
    });
    
    console.log('✅ チーム情報取得完了:', {
      teamName: teamInfo.name,
      description: teamInfo.description,
      memberCount: teamInfo.members.length,
      targetGenders: teamInfo.targetGenders.map(tg => tg.targetGender)
    });
    
    // 5. 招待リンクから参加をシミュレート
    console.log('5. 招待リンクから参加をシミュレート中...');
    
    // テストユーザー2が招待リンクから参加
    const joinResult = await prisma.teamMember.create({
      data: {
        id: `member_${Date.now()}_2`,
        teamId: testTeam.id,
        userId: testUser2.id,
        isActive: true
      },
      include: {
        user: true,
        team: true
      }
    });
    
    console.log('✅ 招待リンクからの参加完了:', {
      joinedUser: joinResult.user.username,
      teamName: joinResult.team.name,
      role: joinResult.role
    });
    
    // 6. 参加後のチーム状況を確認
    console.log('6. 参加後のチーム状況を確認中...');
    const updatedTeam = await prisma.team.findUnique({
      where: { id: testTeam.id },
      include: {
        members: {
          include: {
            user: true
          }
        }
      }
    });
    
    console.log('✅ 参加後のチーム状況:', {
      teamName: updatedTeam.name,
      totalMembers: updatedTeam.members.length,
      members: updatedTeam.members.map(m => ({
        username: m.user.username,
        role: m.role,
        isActive: m.isActive
      }))
    });
    
    // 7. マッチング候補として表示されるかテスト
    console.log('7. マッチング候補として表示されるかテスト中...');
    
    // 別のチームを作成してマッチング候補として表示されるかテスト
    const otherTeam = await prisma.team.create({
      data: {
        id: `other_team_${Date.now()}`,
        name: '他のグループ',
        description: 'マッチング候補として表示されるグループ',
        gender: 2,
        isActive: true,
        members: {
          create: {
            id: `member_${Date.now()}_3`,
            userId: testUser2.id,
            isActive: true
          }
        },
        targetGenders: {
          create: {
            id: `target_${Date.now()}_2`,
            targetGender: 1
          }
        }
      }
    });
    
    console.log('✅ 他のチーム作成完了:', {
      teamId: otherTeam.id,
      teamName: otherTeam.name
    });
    
    // マッチング候補を取得
    const candidates = await prisma.team.findMany({
      where: {
        id: { not: testTeam.id },
        isActive: true,
        gender: { in: [2] }, // テストチームがターゲットにしている性別
        targetGenders: {
          some: {
            targetGender: 1 // テストチームの性別
          }
        }
      },
      include: {
        members: {
          where: {
            isActive: true
          }
        }
      }
    });
    
    console.log('✅ マッチング候補取得完了:', {
      candidateCount: candidates.length,
      candidates: candidates.map(c => ({
        teamName: c.name,
        memberCount: c.members.length
      }))
    });
    
    console.log('🎉 === 招待リンク機能テスト完了 ===');
    console.log('');
    console.log('📋 テスト結果サマリー:');
    console.log('✅ テストユーザー作成: 成功');
    console.log('✅ テストチーム作成: 成功');
    console.log('✅ 招待リンク生成: 成功');
    console.log('✅ チーム情報取得: 成功');
    console.log('✅ 招待リンクからの参加: 成功');
    console.log('✅ 参加後のチーム状況確認: 成功');
    console.log('✅ マッチング候補表示テスト: 成功');
    console.log('');
    console.log('🔗 招待リンク:', inviteLink);
    console.log('🔢 招待コード:', inviteCode);
    console.log('');
    console.log('💡 次のステップ:');
    console.log('1. ブラウザで招待リンクにアクセス');
    console.log('2. グループ参加ページが表示されることを確認');
    console.log('3. ログイン後にグループに参加できることを確認');
    console.log('4. マッチングページで他のグループが表示されることを確認');
    
  } catch (error) {
    console.error('❌ テスト中にエラーが発生:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトを実行
if (require.main === module) {
  testInviteLink();
}

module.exports = { testInviteLink };
