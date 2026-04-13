import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

const CODE_TTL = 300

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) navigate('/today', { replace: true })
  }, [user, authLoading, navigate])

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [codeSent, setCodeSent] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)

  const [error, setError] = useState('')
  const [codeError, setCodeError] = useState('')
  const [sendLoading, setSendLoading] = useState(false)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current) }, [])

  const startTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    setTimeLeft(CODE_TTL)
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleEmailChange = (v: string) => {
    setEmail(v)
    if (codeSent || emailVerified) {
      setCodeSent(false)
      setEmailVerified(false)
      setCode('')
      setCodeError('')
      if (timerRef.current) clearInterval(timerRef.current)
      setTimeLeft(0)
    }
  }

  const handleSendCode = async () => {
    setError('')
    setCodeError('')
    if (!email.trim()) { setError('이메일을 입력해주세요.'); return }
    setSendLoading(true)
    try {
      await authApi.sendResetPasswordCode(email.trim())
      setCodeSent(true)
      setEmailVerified(false)
      setCode('')
      startTimer()
    } catch (err: any) {
      if (err?.response?.status === 404) setError('가입되지 않은 이메일이에요.')
      else setError('인증번호 발송에 실패했어요. 잠시 후 다시 시도해주세요.')
    } finally {
      setSendLoading(false)
    }
  }

  const handleVerifyCode = async () => {
    setCodeError('')
    if (!code.trim()) { setCodeError('인증번호를 입력해주세요.'); return }
    setVerifyLoading(true)
    try {
      await authApi.verifyResetPasswordCode({ email: email.trim(), code: code.trim() })
      setEmailVerified(true)
      if (timerRef.current) clearInterval(timerRef.current)
    } catch {
      setCodeError('인증번호가 올바르지 않아요.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleSubmit = async () => {
    if (!emailVerified) { setError('이메일 인증을 완료해주세요.'); return }
    if (newPassword !== confirmPassword) { setError('비밀번호가 일치하지 않아요.'); return }
    setError('')
    setSubmitLoading(true)
    try {
      await authApi.resetPassword({ email: email.trim(), newPassword, confirmPassword })
      setSuccess(true)
    } catch (err: any) {
      if (err?.response?.status === 400) setError(err.response.data?.message ?? '입력 내용을 확인해주세요.')
      else setError('비밀번호 변경에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div
      className="app-shell min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #FFF3F0 0%, #FAFAFA 50%)' }}
    >
      <div className="mb-8 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md"
          style={{ background: 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">비밀번호 찾기</h1>
        <p className="text-sm text-gray-400 mt-1">가입한 이메일로 인증 후 재설정해요</p>
      </div>

      {success ? (
        <div className="w-full flex flex-col items-center gap-5">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-gray-700 text-center leading-relaxed">
            비밀번호가 변경되었습니다.<br />새 비밀번호로 로그인해주세요.
          </p>
          <button
            onClick={() => navigate('/login', { replace: true })}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm shadow-md"
            style={{ background: 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}
          >
            로그인하러 가기
          </button>
        </div>
      ) : (
        <div className="w-full flex flex-col gap-3">
          {/* 이메일 + 인증번호 받기 */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="가입한 이메일"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              autoComplete="username"
              disabled={emailVerified}
              maxLength={100}
              className="flex-1 min-w-0 bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
            />
            {emailVerified ? (
              <div
                className="flex items-center justify-center px-3 flex-shrink-0 rounded-2xl text-xs font-semibold shadow-sm gap-1"
                style={{ background: '#F0FFF4', color: '#16A34A', border: '1px solid #BBF7D0' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                  <path d="M5 13l4 4L19 7" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                인증됨
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSendCode}
                disabled={sendLoading || !email.trim()}
                className="flex-shrink-0 px-3 py-4 rounded-2xl text-xs font-semibold shadow-sm transition-opacity active:opacity-80"
                style={{ background: email.trim() && !sendLoading ? '#E85D2F' : '#CCCCCC', color: 'white', whiteSpace: 'nowrap' }}
              >
                {sendLoading ? '발송 중...' : codeSent ? '재발송' : '인증번호 받기'}
              </button>
            )}
          </div>

          {/* 인증번호 입력 */}
          {codeSent && !emailVerified && (
            <div className="flex flex-col gap-1.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="인증번호 6자리"
                  value={code}
                  onChange={e => { setCode(e.target.value.replace(/\D/g, '')); setCodeError('') }}
                  maxLength={6}
                  inputMode="numeric"
                  className="flex-1 min-w-0 bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm tracking-widest"
                />
                <div
                  className="flex items-center justify-center w-12 flex-shrink-0 text-xs font-mono tabular-nums"
                  style={{ color: timeLeft > 60 ? '#9CA3AF' : '#E85D2F' }}
                >
                  {timeLeft > 0 ? formatTime(timeLeft) : '만료'}
                </div>
                <button
                  type="button"
                  onClick={handleVerifyCode}
                  disabled={verifyLoading || timeLeft === 0 || !code.trim()}
                  className="flex-shrink-0 px-4 py-4 rounded-2xl text-xs font-semibold shadow-sm transition-opacity active:opacity-80"
                  style={{ background: !verifyLoading && timeLeft > 0 && code.trim() ? '#E85D2F' : '#CCCCCC', color: 'white' }}
                >
                  {verifyLoading ? '확인 중' : '확인'}
                </button>
              </div>
              {codeError && <p className="text-xs text-red-500 px-1">{codeError}</p>}
            </div>
          )}

          {/* 새 비밀번호 */}
          {emailVerified && (
            <>
              <input
                type="password"
                placeholder="새 비밀번호 (소문자·숫자·특수문자 포함 8자 이상)"
                value={newPassword}
                onChange={e => { setNewPassword(e.target.value); setError('') }}
                autoComplete="new-password"
                maxLength={72}
                className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm"
              />
              <div className="relative">
                <input
                  type="password"
                  placeholder="새 비밀번호 확인"
                  value={confirmPassword}
                  onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                  autoComplete="new-password"
                  maxLength={72}
                  className="w-full bg-white border rounded-2xl px-4 py-4 text-sm outline-none transition-colors shadow-sm"
                  style={{
                    borderColor: confirmPassword
                      ? newPassword === confirmPassword ? '#22C55E' : '#EF4444'
                      : '#E5E7EB',
                  }}
                />
                {confirmPassword && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    {newPassword === confirmPassword ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="#22C55E" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
            </>
          )}

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          {emailVerified && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitLoading || !newPassword || !confirmPassword}
              className="w-full py-4 rounded-2xl text-white font-bold text-sm mt-1 transition-opacity active:opacity-80 shadow-md"
              style={{
                background: !submitLoading && newPassword && confirmPassword
                  ? 'linear-gradient(135deg, #E85D2F, #FF7B52)'
                  : '#CCCCCC',
              }}
            >
              {submitLoading ? '변경 중...' : '비밀번호 변경'}
            </button>
          )}
        </div>
      )}

      {!success && (
        <p className="mt-6 text-sm text-gray-400">
          <Link to="/login" className="font-semibold" style={{ color: '#E85D2F' }}>
            로그인으로 돌아가기
          </Link>
        </p>
      )}
    </div>
  )
}
