export type UserLite = {
  id: number
  name: string | null
  avatarUrl: string | null
}

export type TeamMemberDTO = {
  id: number
  teamId: number
  userId: number
  role?: string | null
  joinedAt?: string | null
  isActive: boolean
  user: UserLite
}

export type TeamDTO = {
  id: number
  name: string
  createdAt: string
  updatedAt: string
  members: TeamMemberDTO[]
}
