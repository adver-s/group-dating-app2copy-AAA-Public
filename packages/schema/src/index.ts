// 共通の型定義

// ユーザー関連
export interface User {
  id: string
  email: string
  name: string
  age?: number
  gender?: number
  profileImage?: string
  createdAt: Date
  updatedAt: Date
}

// チーム関連
export interface Team {
  id: string
  name: string
  description?: string
  gender: number
  targetGender: number
  smoke: number
  alcohol: number
  maxMembers: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  members: TeamMember[]
  photos: TeamPhoto[]
  hobbies: TeamHobby[]
  prefectures: TeamPrefecture[]
  targetGenders: TeamTargetGender[]
  weekdays: TeamWeekday[]
}

export interface TeamMember {
  id: string
  teamId: string
  userId: string
  joinedAt: Date
  isActive: boolean
  user: User
}

export interface TeamPhoto {
  id: string
  teamId: string
  imageUrl: string
  order: number
  createdAt: Date
}

export interface TeamHobby {
  id: string
  teamId: string
  hobby: string
}

export interface TeamPrefecture {
  id: string
  teamId: string
  prefecture: string
}

export interface TeamTargetGender {
  id: string
  teamId: string
  targetGender: number
}

export interface TeamWeekday {
  id: string
  teamId: string
  weekday: number
  timeslot: string
}

// マッチング関連
export interface Match {
  id: string
  team1Id: string
  team2Id: string
  status: MatchStatus
  createdAt: Date
  updatedAt: Date
  team1: Team
  team2: Team
}

export type MatchStatus = 'pending' | 'matched' | 'rejected' | 'cancelled'

export interface MatchingFlow {
  id: string
  fromGroupId: string
  toGroupId: string
  status: MatchingFlowStatus
  createdAt: Date
  updatedAt: Date
}

export type MatchingFlowStatus = 'pending' | 'accepted' | 'rejected'

export interface Judgement {
  id: string
  userId: string
  targetTeamId: string
  judgement: JudgementType
  createdAt: Date
  user: User
  targetTeam: Team
}

export type JudgementType = 'like' | 'reject'

// チャット関連
export interface ChatRoom {
  id: string
  name?: string
  type: ChatRoomType
  team1Id?: string
  team2Id?: string
  createdAt: Date
  updatedAt: Date
  team1?: Team
  team2?: Team
  messages: ChatMessage[]
}

export type ChatRoomType = 'team' | 'match'

export interface ChatMessage {
  id: string
  roomId: string
  userId: string
  content: string
  type: MessageType
  createdAt: Date
  user: User
}

export type MessageType = 'text' | 'image' | 'file' | 'system'

// ミーティング関連
export interface MeetingProposal {
  id: string
  fromTeamId: string
  toTeamId: string
  proposedDate: Date
  location?: string
  message?: string
  status: ProposalStatus
  createdAt: Date
  updatedAt: Date
  fromTeam: Team
  toTeam: Team
}

export type ProposalStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled'

export interface MeetingSchedule {
  id: string
  proposalId: string
  confirmedDate: Date
  location: string
  status: ScheduleStatus
  createdAt: Date
  updatedAt: Date
  proposal: MeetingProposal
}

export type ScheduleStatus = 'scheduled' | 'completed' | 'cancelled'

// 招待関連
export interface InviteCode {
  id: string
  teamId: string
  code: string
  expiresAt: Date
  isActive: boolean
  createdAt: Date
  team: Team
}

// フィードバック関連
export interface Feedback {
  id: string
  userId: string
  category: string
  title: string
  content: string
  status: FeedbackStatus
  priority: FeedbackPriority
  adminNotes?: string
  resolvedAt?: Date
  resolvedBy?: string
  createdAt: Date
  updatedAt: Date
  user: User
}

export type FeedbackStatus = 'pending' | 'in_progress' | 'resolved' | 'closed'
export type FeedbackPriority = 'low' | 'normal' | 'high' | 'urgent'

// 認証関連
export interface AuthUser {
  id: string
  email: string
  name: string
  token: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface SimpleLoginRequest {
  email: string
  password: string
  name?: string
}

// API レスポンス関連
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// エラー関連
export interface ApiError {
  error: string
  code: string
  details?: string
}

// フォーム関連
export interface TeamFormData {
  name: string
  description?: string
  gender: number
  targetGender: number
  maxMembers: number
  images: string[]
  hobbies: string[]
  preferredPrefs: string[]
  availabilities: Availability[]
}

export interface Availability {
  weekday: number
  timeslot: string
}

// 音声通話関連
export interface VoiceCallConfig {
  meetingId: string
  attendeeId: string
  region: string
}

export interface VoiceCallState {
  isConnected: boolean
  isMuted: boolean
  isVideoEnabled: boolean
  attendees: Attendee[]
}

export interface Attendee {
  attendeeId: string
  name: string
  isMuted: boolean
  isVideoEnabled: boolean
}

// 統計関連
export interface MatchStats {
  totalMatches: number
  activeMatches: number
  pendingMatches: number
  completedMatches: number
}

export interface TeamStats {
  totalTeams: number
  activeTeams: number
  averageMembers: number
  popularHobbies: string[]
}

// 検索・フィルター関連
export interface TeamSearchFilters {
  gender?: number
  targetGender?: number
  prefectures?: string[]
  hobbies?: string[]
  ageRange?: {
    min: number
    max: number
  }
}

export interface TeamSearchParams {
  page?: number
  limit?: number
  sortBy?: 'createdAt' | 'name' | 'memberCount'
  sortOrder?: 'asc' | 'desc'
  filters?: TeamSearchFilters
}

// 通知関連
export interface Notification {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  isRead: boolean
  createdAt: Date
  data?: Record<string, any>
}

export type NotificationType = 
  | 'match' 
  | 'message' 
  | 'meeting_proposal' 
  | 'meeting_confirmed' 
  | 'team_invite' 
  | 'system'

// 設定関連
export interface UserSettings {
  id: string
  userId: string
  notifications: NotificationSettings
  privacy: PrivacySettings
  preferences: UserPreferences
  updatedAt: Date
}

export interface NotificationSettings {
  email: boolean
  push: boolean
  match: boolean
  message: boolean
  meeting: boolean
}

export interface PrivacySettings {
  showAge: boolean
  showLocation: boolean
  allowInvites: boolean
}

export interface UserPreferences {
  language: string
  theme: 'light' | 'dark' | 'auto'
  timezone: string
}
