import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../api/auth'
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

  // 앱 시작 시: CSRF 쿠키 확보 후 로그인 상태 복원
  useEffect(() => {
    const init = async () => {
      try {
        // CSRF 쿠키를 서버에서 받아옴 (이후 모든 POST에서 쿠키를 직접 읽음)
        await authApi.csrf()
        await refresh()
      } catch {
        // 백엔드 미기동 시에도 로딩은 해제
        setUser(null)
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
