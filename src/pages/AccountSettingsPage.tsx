import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authApi } from '../api/auth'

// 비밀번호 규칙: 소문자 + 숫자 + 특수문자 각 1개 이상, 8자 이상
function validatePassword(pw: string): string {
  if (pw.length < 8) return '비밀번호는 8자 이상이어야 해요.'
  if (!/[a-z]/.test(pw)) return '소문자를 1개 이상 포함해야 해요.'
  if (!/[0-9]/.test(pw)) return '숫자를 1개 이상 포함해야 해요.'
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw)) return '특수문자를 1개 이상 포함해야 해요.'
  return ''
}

function EyeIcon({ show }: { show: boolean }) {
  return show ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" stroke="#9CA3AF" strokeWidth="1.8" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="#9CA3AF" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function PasswordInput({
  label, value, onChange, placeholder
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const [show, setShow] = useState(false)
  return (
    <div>
      <label className="text-xs text-gray-400 mb-1 block">{label}</label>
      <div className="relative">
        <input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-10 text-sm outline-none focus:border-[#E85D2F] transition-colors"
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2"
        >
          <EyeIcon show={show} />
        </button>
      </div>
    </div>
  )
}

type ModalStep = 'verify' | 'change' | 'done'

function PasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<ModalStep>('verify')
  const [current, setCurrent] = useState('')
  const [verifiedPassword, setVerifiedPassword] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleVerify = async () => {
    setError('')
    if (!current) { setError('현재 비밀번호를 입력해주세요.'); return }
    setLoading(true)
    try {
      await authApi.verifyPassword(current)
      setVerifiedPassword(current)
      setStep('change')
    } catch (err: any) {
      setError('현재 비밀번호가 올바르지 않아요.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = async () => {
    setError('')
    const pwError = validatePassword(next)
    if (pwError) { setError(pwError); return }
    if (next !== confirm) { setError('새 비밀번호가 일치하지 않아요.'); return }
    setLoading(true)
    try {
      await authApi.changePassword({ currentPassword: verifiedPassword, newPassword: next })
      setStep('done')
    } catch {
      setError('변경에 실패했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const STEPS: Record<ModalStep, string> = {
    verify: '현재 비밀번호 확인',
    change: '새 비밀번호 설정',
    done: '비밀번호 변경',
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={step === 'done' ? onClose : undefined}>
      <div
        className="absolute inset-x-4 mx-auto max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col"
        style={{ top: 'clamp(120px, 18vh, 200px)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* 헤더 */}
        <div className="px-5 pt-4 pb-3 flex-shrink-0 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {step === 'change' && (
              <button
                type="button"
                onClick={() => { setStep('verify'); setError(''); setNext(''); setConfirm('') }}
                className="w-8 h-8 rounded-full flex items-center justify-center active:bg-gray-100"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M11 6l-6 6 6 6" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-800">{STEPS[step]}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center active:bg-gray-100"
            aria-label="닫기"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Step 1: 현재 비밀번호 확인 */}
        {step === 'verify' && (
          <div className="px-5 py-5 flex flex-col gap-4">
            <p className="text-xs text-gray-400">보안을 위해 현재 비밀번호를 먼저 확인할게요.</p>
            <PasswordInput label="현재 비밀번호" value={current} onChange={v => { setCurrent(v); setError('') }} />
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleVerify}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: loading ? '#CCCCCC' : '#E85D2F' }}
            >
              {loading ? '확인 중...' : '확인'}
            </button>
          </div>
        )}

        {/* Step 2: 새 비밀번호 설정 */}
        {step === 'change' && (
          <div className="px-5 py-5 flex flex-col gap-3">
            <PasswordInput label="새 비밀번호" value={next} onChange={v => { setNext(v); setError('') }} placeholder="소문자·숫자·특수문자 포함 8자 이상" />
            <PasswordInput label="새 비밀번호 확인" value={confirm} onChange={v => { setConfirm(v); setError('') }} />

            {/* 조건 안내 */}
            <div className="flex flex-col gap-1 px-1">
              {[
                { label: '8자 이상', ok: next.length >= 8 },
                { label: '소문자 포함', ok: /[a-z]/.test(next) },
                { label: '숫자 포함', ok: /[0-9]/.test(next) },
                { label: '특수문자 포함', ok: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(next) },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    {item.ok
                      ? <path d="M2 6l3 3 5-5" stroke="#E85D2F" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                      : <circle cx="6" cy="6" r="4" stroke="#D1D5DB" strokeWidth="1.4" />
                    }
                  </svg>
                  <span className="text-[11px]" style={{ color: item.ok ? '#E85D2F' : '#9CA3AF' }}>{item.label}</span>
                </div>
              ))}
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            <button
              onClick={handleChange}
              disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm mt-1"
              style={{ background: loading ? '#CCCCCC' : '#E85D2F' }}
            >
              {loading ? '변경 중...' : '비밀번호 변경'}
            </button>
          </div>
        )}

        {/* Step 3: 완료 */}
        {step === 'done' && (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#FFF3F0' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#E85D2F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800">비밀번호가 변경됐어요</p>
            <p className="text-xs text-gray-400">다음 로그인부터 새 비밀번호를 사용해주세요.</p>
            <button
              onClick={onClose}
              className="mt-2 w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: '#E85D2F' }}
            >
              확인
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function FieldModal({
  title, label, initialValue, inputType = 'text', placeholder,
  onSave, onClose,
}: {
  title: string
  label: string
  initialValue: string
  inputType?: string
  placeholder?: string
  onSave: (value: string) => Promise<void>
  onClose: () => void
}) {
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  const handleSubmit = async () => {
    setError('')
    if (!value.trim()) { setError(`${label}을(를) 입력해주세요.`); return }
    setLoading(true)
    try {
      await onSave(value.trim())
      setDone(true)
    } catch (err: any) {
      if (err?.response?.status === 409) setError('이미 사용 중인 이메일이에요.')
      else setError('변경에 실패했어요. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40" onClick={done ? onClose : undefined}>
      <div
        className="absolute inset-x-4 mx-auto max-w-[480px] overflow-hidden rounded-2xl bg-white shadow-xl flex flex-col"
        style={{ top: 'clamp(120px, 18vh, 200px)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 pt-4 pb-3 flex-shrink-0 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">{title}</h2>
          <button type="button" onClick={onClose}
            className="w-9 h-9 -mr-1 rounded-full flex items-center justify-center active:bg-gray-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6l12 12" stroke="#9CA3AF" strokeWidth="2.2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {done ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#FFF3F0' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M20 6L9 17l-5-5" stroke="#E85D2F" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-gray-800">{label}이(가) 변경됐어요</p>
            <button onClick={onClose} className="mt-2 w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: '#E85D2F' }}>확인</button>
          </div>
        ) : (
          <div className="px-5 py-5 flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">{label}</label>
              <input
                type={inputType}
                value={value}
                onChange={e => { setValue(e.target.value); setError('') }}
                placeholder={placeholder}
                autoComplete="off"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-[#E85D2F] transition-colors"
              />
            </div>
            {error && <p className="text-xs text-red-500">{error}</p>}
            <button onClick={handleSubmit} disabled={loading}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm"
              style={{ background: loading ? '#CCCCCC' : '#E85D2F' }}>
              {loading ? '변경 중...' : '변경'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AccountSettingsPage() {
  const { user, refresh, logout } = useAuth()
  const navigate = useNavigate()
  const [modal, setModal] = useState<'name' | 'email' | 'password' | null>(null)

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠어요?')) return
    await logout()
    navigate('/login', { replace: true })
  }

  const closeModal = async () => {
    await refresh()
    setModal(null)
  }

  return (
    <div className="flex flex-col min-h-full px-4 py-6 gap-6">

      {modal === 'name' && (
        <FieldModal
          title="이름 변경" label="이름" initialValue={user?.name ?? ''}
          onSave={async (v) => { await authApi.updateProfile({ name: v, email: user?.email ?? '' }) }}
          onClose={closeModal}
        />
      )}
      {modal === 'email' && (
        <FieldModal
          title="이메일 변경" label="이메일" initialValue={user?.email ?? ''} inputType="email"
          onSave={async (v) => { await authApi.updateProfile({ name: user?.name ?? '', email: v }) }}
          onClose={closeModal}
        />
      )}
      {modal === 'password' && (
        <PasswordModal onClose={() => setModal(null)} />
      )}

      {/* 계정 설정 섹션 */}
      <section>
        <h2 className="text-sm font-semibold text-gray-500 mb-3">계정 설정</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-gray-400">이름</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{user?.name}</p>
            </div>
            <button onClick={() => setModal('name')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 ml-3"
              style={{ background: '#FFF3F0', color: '#E85D2F' }}>변경</button>
          </div>
          <div className="px-4 py-3 border-b border-gray-50 flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-xs text-gray-400">이메일</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{user?.email}</p>
            </div>
            <button onClick={() => setModal('email')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 ml-3"
              style={{ background: '#FFF3F0', color: '#E85D2F' }}>변경</button>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400">비밀번호</p>
              <p className="text-sm font-medium text-gray-800 mt-0.5">••••••••</p>
            </div>
            <button onClick={() => setModal('password')}
              className="text-xs px-3 py-1.5 rounded-lg font-medium flex-shrink-0 ml-3"
              style={{ background: '#FFF3F0', color: '#E85D2F' }}>변경</button>
          </div>
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
