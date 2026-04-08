import client from './client'
import type { User } from '../types'

export const authApi = {
  // CSRF 쿠키를 서버에서 받아오기 위해 호출 (응답 본문은 사용하지 않음)
  csrf: () =>
    client.get('/auth/csrf'),

  signup: (data: { email: string; password: string; name: string }) =>
    client.post('/auth/signup', data),

  login: (data: { email: string; password: string }) =>
    client.post<User>('/auth/login', data),

  logout: () =>
    client.post('/auth/logout'),

  me: () =>
    client.get<User>('/auth/me'),

  updateProfile: (data: { name: string; email: string }) =>
    client.patch<User>('/auth/me', data),

  verifyPassword: (password: string) =>
    client.post('/auth/me/verify-password', { password }),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    client.patch('/auth/me/password', data),

  uploadProfileImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return client.post<User>('/auth/me/profile-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
