// Prismaから型をインポートせず、独自に定義

export interface MatchingFlow {
  matching_id: string
  from_group_id: string
  to_group_id: string
  status: number
  from_team_name: string
  to_team_name: string
  from_team_id: string
  to_team_id: string
  judgements: GroupMemberJudgement[]
  progress: {
    fromTeam: {
      likeCount: number
      total: number
      percentage: number
    }
    toTeam: {
      approveCount: number
      total: number
      percentage: number
    }
  }
  isFromTeam: boolean
  isToTeam: boolean
}

export interface GroupMemberJudgement {
  user_id: string
  group_id: string
  judgement: 'like' | 'dislike' | 'hold' | 'approve'
  judgement_updated_at: Date
  username: string
}

export interface Team {
  id: string
  name: string
  description: string
  memberCount: number
  photos: string[]
  gender: number
  target_gender: number
  smoke: number
  alcohol: number
}

export interface ActiveTeam {
  id: string
  name: string
  description: string
  is_active_team: boolean
}

export type JudgementType = 'like' | 'dislike' | 'hold' | 'approve' 