import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth'
import { setCsrfToken } from '../api/client'
import type { User } from '../types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await authApi.me()
      setUser(res.data)
    } catch {
      setUser(null)
    }
  }, [])

  // 앱 시작 시 CSRF 토큰 획득 + 로그인 상태 확인
  useEffect(() => {
    const init = async () => {
      try {
        const csrfRes = await authApi.csrf()
        setCsrfToken(csrfRes.data.token)
        await refresh()
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [refresh])

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password })
    setUser(res.data)
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
