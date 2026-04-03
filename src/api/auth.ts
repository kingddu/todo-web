import client from './client'
import type { User } from '../types'

export const authApi = {
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
}
