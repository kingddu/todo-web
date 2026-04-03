import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api/auth'

export default function AccountSettingsPage() {
  const { user, refresh, logout } = useAuth()
  const navigate = useNavigate()

  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { setSaveError('이름과 이메일을 모두 입력해주세요.'); return }
    setSaving(true)
    setSaveError('')
    try {
      await authApi.updateProfile({ name: name.trim(), email: email.trim() })
      await refresh()
      setEditing(false)
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setSaveError('이미 사용 중인 이메일이에요.')
      } else {
        setSaveError('저장에 실패했어요. 다시 시도해주세요.')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
    setSaveError('')
    setEditing(false)
  }

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠어요?')) return
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col min-h-full px-4 py-6 gap-6">

      {/* 계정 설정 섹션 */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500">계정 설정</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-xs px-3 py-1.5 rounded-lg font-medium"
              style={{ background: '#FFF3F0', color: '#E85D2F' }}
            >
              수정
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          {editing ? (
            <div className="flex flex-col gap-3 p-4">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">이름</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoComplete="name"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E85D2F] transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="username"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E85D2F] transition-colors"
                />
              </div>
              {saveError && <p className="text-xs text-red-500">{saveError}</p>}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl text-white font-semibold text-sm"
                  style={{ background: saving ? '#CCCCCC' : '#E85D2F' }}
                >
                  {saving ? '저장 중...' : '저장'}
                </button>
                <button
                  onClick={handleCancel}
                  className="flex-1 py-3 rounded-xl text-sm border border-gray-200 text-gray-500"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="px-4 py-3 border-b border-gray-50">
                <p className="text-xs text-gray-400">이름</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{user?.name}</p>
              </div>
              <div className="px-4 py-3">
                <p className="text-xs text-gray-400">이메일</p>
                <p className="text-sm font-medium text-gray-800 mt-0.5">{user?.email}</p>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 로그아웃 */}
      <section>
        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-2xl border text-sm font-semibold transition-colors active:opacity-60"
          style={{ borderColor: '#E85D2F', color: '#E85D2F' }}
        >
          로그아웃
        </button>
      </section>

      {/* 홈으로 */}
      <section className="mt-auto">
        <button
          onClick={() => navigate('/today')}
          className="w-full py-3 rounded-2xl text-sm text-gray-400 border border-gray-100 flex items-center justify-center gap-2"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M3 12L12 3l9 9" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M5 10v9a1 1 0 001 1h4v-4h4v4h4a1 1 0 001-1v-9" stroke="#AAAAAA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          홈으로 가기
        </button>
      </section>
    </div>
  )
}
