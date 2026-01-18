import { prisma } from '../apps/api/lib/database';

/**
 * ユーザーがアクティブグループを1つしか持てないようにする制約を管理するユーティリティ
 */
export class TeamActiveConstraint {
  private static parseUserId(userId: string): number {
    const parsed = parseInt(userId, 10)
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid userId: ${userId}`)
    }
    return parsed
  }

  private static parseTeamId(teamId: string): number {
    const parsed = parseInt(teamId, 10)
    if (Number.isNaN(parsed)) {
      throw new Error(`Invalid teamId: ${teamId}`)
    }
    return parsed
  }

  /**
   * ユーザーの現在のアクティブグループ数を取得
   */
  static async getActiveTeamCount(userId: string): Promise<number> {
    const userIdInt = this.parseUserId(userId)
    const count = await prisma.teamMember.count({
      where: {
        user_id: userIdInt,
        status: 0
      }
    });

    return count;
  }

  /**
   * ユーザーのアクティブグループを取得
   */
  static async getActiveTeam(userId: string): Promise<any | null> {
    const userIdInt = this.parseUserId(userId)
    const activeMember = await prisma.teamMember.findFirst({
      where: {
        user_id: userIdInt,
        status: 0
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
            description: true
          }
        }
      }
    });

    return activeMember;
  }

  /**
   * グループをアクティブに設定（他のグループは非アクティブに）
   */
  static async setActiveTeam(userId: string, teamId: string): Promise<boolean> {
    const userIdInt = this.parseUserId(userId)
    const teamIdInt = this.parseTeamId(teamId)
    try {
      return await prisma.$transaction(async (tx) => {
        // 現在のユーザーの他のチームをすべて非アクティブに設定
        await tx.teamMember.updateMany({
          where: {
            user_id: userIdInt,
            team_id: {
              not: teamIdInt
            }
          },
          data: {
            status: 1
          }
        });

        // 指定されたチームをアクティブに設定
        await tx.teamMember.updateMany({
          where: {
            user_id: userIdInt,
            team_id: teamIdInt
          },
          data: {
            status: 0
          }
        });

        return true;
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * グループを非アクティブに設定
   */
  static async setInactiveTeam(userId: string, teamId: string): Promise<boolean> {
    const userIdInt = this.parseUserId(userId)
    const teamIdInt = this.parseTeamId(teamId)
    try {
      // ユーザーがこのチームのメンバーかチェック
      const membership = await prisma.teamMember.findFirst({
        where: {
          user_id: userIdInt,
          team_id: teamIdInt
        }
      });

      if (!membership) {
        throw new Error('このチームのメンバーではありません');
      }

      // チームを非アクティブに設定
      await prisma.teamMember.updateMany({
        where: {
          user_id: userIdInt,
          team_id: teamIdInt
        },
        data: {
          status: 1
        }
      });

      return true;
    } catch (error) {
      throw error;
    }
  }

  /**
   * 制約違反をチェック（一人のユーザーが複数のアクティブグループを持っていないか）
   */
  static async validateConstraint(userId: string): Promise<{ isValid: boolean; activeCount: number }> {
    const activeCount = await this.getActiveTeamCount(userId);
    return {
      isValid: activeCount <= 1,
      activeCount
    };
  }

  /**
   * 制約を強制適用（複数のアクティブグループがある場合、最初の1つ以外を非アクティブに）
   */
  static async enforceConstraint(userId: string): Promise<boolean> {
    const userIdInt = this.parseUserId(userId)
    try {
      const activeTeams = await prisma.teamMember.findMany({
        where: {
          user_id: userIdInt,
          status: 0
        },
        orderBy: {
          joined_at: 'asc'
        },
        select: {
          team_id: true
        }
      });

      if (activeTeams.length <= 1) {
        return true; // 制約は既に満たされている
      }

      // 最初のチーム以外を非アクティブに設定
      const teamsToDeactivate = activeTeams.slice(1);
      const teamIds = teamsToDeactivate.map(team => team.team_id);

      if (teamIds.length > 0) {
        const teamIdInts = teamIds.map(id => this.parseTeamId(String(id)))
        await prisma.teamMember.updateMany({
          where: {
            user_id: userIdInt,
            team_id: {
              in: teamIdInts
            }
          },
          data: {
            status: 1
          }
        });
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}
