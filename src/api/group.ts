import client from './client'
import type { Group, GroupDetail, GroupInvitationSummary, MyGroupSummary } from '../types'

export const groupApi = {
  getMyGroups: () =>
    client.get<MyGroupSummary[]>('/groups'),

  create: (data: { groupName: string; inviteEmails: string[] }) =>
    client.post<Group>('/groups', data),

  getDetail: (groupId: number) =>
    client.get<GroupDetail>(`/groups/${groupId}`),

  changeName: (groupId: number, groupName: string) =>
    client.patch(`/groups/${groupId}/name`, { groupName }),

  changeAlias: (groupId: number, aliasName: string) =>
    client.patch(`/groups/${groupId}/alias`, { aliasName }),

  transferLeader: (groupId: number, targetUserId: number) =>
    client.patch(`/groups/${groupId}/leader`, { targetUserId }),

  leave: (groupId: number) =>
    client.delete(`/groups/${groupId}/members/me`),

  kick: (groupId: number, targetUserId: number) =>
    client.delete(`/groups/${groupId}/members/${targetUserId}`),

  disband: (groupId: number) =>
    client.delete(`/groups/${groupId}`),

  invite: (groupId: number, inviteEmails: string[]) =>
    client.post(`/groups/${groupId}/invitations`, { inviteEmails }),

  getMyInvitations: () =>
    client.get<GroupInvitationSummary[]>('/group-invitations/me'),

  acceptInvitation: (invitationId: number) =>
    client.post(`/group-invitations/${invitationId}/accept`),

  rejectInvitation: (invitationId: number) =>
    client.post(`/group-invitations/${invitationId}/reject`),
}
