import type { TeamDTO, TeamMemberDTO, UserLite } from '@/types/team'

export function normalizeTeam(db: any): TeamDTO {
  return {
    id: db.id,
    name: db.name,
    createdAt: new Date(db.createdAt).toISOString(),
    updatedAt: new Date(db.updatedAt).toISOString(),
    members: (db.members ?? []).map(normalizeMember),
  }
}

export function normalizeMember(m: any): TeamMemberDTO {
  return {
    id: m.id,
    teamId: m.teamId,
    userId: m.userId,
    role: m.role ?? null,
    joinedAt: m.joinedAt ? new Date(m.joinedAt).toISOString() : null,
    isActive: !!m.isActive,
    user: normalizeUser(m.user),
  }
}

export function normalizeUser(u: any): UserLite {
  if (!u) return { id: 0, name: null, avatarUrl: null }
  return { id: u.id, name: u.name ?? null, avatarUrl: u.avatarUrl ?? null }
}
