export interface User {
  userId: number
  email: string
  name: string
  role: string
  status: string
  profileImageUrl?: string
}

export type TodoType = 'DATE_ONLY' | 'RANGE' | 'DEADLINE'

export interface Todo {
  id: number
  title: string
  content?: string
  category?: string
  type: TodoType
  startDate: string
  endDate: string
  completed: boolean
  completedBy?: number
  completedAt?: string
  carryOver: boolean
  groupId?: number
  groupName?: string
  groupDisbanded: boolean
}

export interface TodoCreatePayload {
  title: string
  content?: string
  category?: string
  type: TodoType
  startDate: string
  endDate: string
  carryOver?: boolean
  groupId?: number
}

export interface TodoPatchPayload {
  title?: string
  content?: string
  category?: string
  type?: TodoType
  startDate?: string
  endDate?: string
  carryOver?: boolean
}

export interface Group {
  id: number
  groupName: string
  creatorUserId: number
  invitedEmails: string[]
}

export interface GroupMember {
  userId: number
  userName: string
  role: 'LEADER' | 'MEMBER'
  status: string
  aliasName?: string
}

export interface GroupDetailMember {
  userId: number
  userName: string
  userEmail: string
  role: 'LEADER' | 'MEMBER'
  aliasName?: string
  profileImageUrl?: string
  joinedAt: string
}

export interface GroupDetail {
  groupId: number
  groupName: string
  groupStatus: string
  creatorUserId: number
  leaderUserId: number
  memberSummary: {
    activeCount: number
    leftCount: number
    kickedCount: number
  }
  members: GroupDetailMember[]
  pendingInvitations: Array<{
    invitationId: number
    email: string
    invitedByUserId: number
    expiresAt: string
  }>
}

export interface MyGroupSummary {
  groupId: number
  groupName: string
  aliasName: string
  myRole: 'LEADER' | 'MEMBER'
  status: 'ACTIVE' | 'DISBANDED'
  activeMemberCount: number
}

export interface GroupInvitationSummary {
  invitationId: number
  groupId: number
  groupName: string
  status: string
  expiresAt: string
  invitedByUserId: number
  invitedByUserName: string
  memberEmails: string[]
}

export type FontId = 'noto' | 'gothic' | 'nanum' | 'doHyeon' | 'gowun' | 'blackHan' | 'sunflower' | 'gaegu' | 'jua'

export interface FontOption {
  id: FontId
  name: string
  label: string
  family: string
}
