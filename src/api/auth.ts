import client, { updateCsrfToken } from './client'
import type { User } from '../types'

export const authApi = {
  // CSRF 토큰을 서버에서 받아와 인메모리에 저장 (쿠키 읽기 타이밍 이슈 방지)
  csrf: async () => {
    const res = await client.get<{ headerName: string; parameterName: string; token: string }>('/auth/csrf')
    updateCsrfToken(res.data.token)
    return res
  },

  signup: (data: { email: string; password: string; name: string }) =>
    client.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    client.post<User>('/auth/login', data),

  logout: () =>
    client.post('/auth/logout'),

  me: () =>
    client.get<User>('/auth/me'),

  updateProfile: (data: { name: string }) =>
    client.patch<User>('/auth/me', data),

  sendSignupEmailCode: (email: string) =>
    client.post('/auth/email/signup/send-code', { email }),

  verifySignupEmailCode: (data: { email: string; code: string }) =>
    client.post('/auth/email/signup/verify-code', data),

  sendChangeEmailCode: (email: string) =>
    client.post('/auth/me/email/send-code', { email }),

  verifyChangeEmailCode: (data: { email: string; code: string }) =>
    client.post('/auth/me/email/verify-code', data),

  changeEmail: (email: string) =>
    client.patch<User>('/auth/me/email', { email }),

  verifyPassword: (password: string) =>
    client.post('/auth/me/verify-password', { password }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.patch('/auth/me/password', data),

  sendResetPasswordCode: (email: string) =>
    client.post('/auth/password/send-code', { email }),

  verifyResetPasswordCode: (data: { email: string; code: string }) =>
    client.post('/auth/password/verify-code', data),

  resetPassword: (data: { email: string; newPassword: string; confirmPassword: string }) =>
    client.post('/auth/password/reset', data),

  uploadProfileImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<User>('/auth/me/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
