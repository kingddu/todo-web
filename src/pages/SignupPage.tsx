import { useState, FormEvent, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'
import { useAuth } from '../contexts/AuthContext'

const CODE_TTL = 300

function formatTime(s: number) {
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

export default function SignupPage() {
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading && user) navigate('/today', { replace: true })
  }, [user, authLoading, navigate])

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [code, setCode] = useState('')

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
      await authApi.sendSignupEmailCode(email.trim())
      setCodeSent(true)
      setEmailVerified(false)
      setCode('')
      startTimer()
    } catch (err: any) {
      if (err?.response?.status === 409) setError('이미 가입된 이메일이에요.')
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
      await authApi.verifySignupEmailCode({ email: email.trim(), code: code.trim() })
      setEmailVerified(true)
      if (timerRef.current) clearInterval(timerRef.current)
    } catch {
      setCodeError('인증번호가 올바르지 않아요.')
    } finally {
      setVerifyLoading(false)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!emailVerified) { setError('이메일 인증을 완료해주세요.'); return }
    if (password.length < 8) { setError('비밀번호는 8자 이상이어야 해요.'); return }
    if (password !== passwordConfirm) { setError('비밀번호가 일치하지 않아요.'); return }
    setError('')
    setSubmitLoading(true)
    try {
      await authApi.signup({ name: name.trim(), email: email.trim(), password })
      setSuccess(true)
    } catch (err: any) {
      if (err?.response?.status === 400) setError('이메일 인증을 다시 진행해주세요.')
      else setError('회원가입에 실패했어요. 다시 시도해주세요.')
    } finally {
      setSubmitLoading(false)
    }
  }

  return (
    <div className="app-shell min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: 'linear-gradient(160deg, #FFF3F0 0%, #FAFAFA 50%)' }}>

      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-md"
          style={{ background: 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
            <path d="M9 11l3 3L22 4" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">회원가입</h1>
        <p className="text-sm text-gray-400 mt-1">Todo와 함께 시작해요</p>
      </div>

      {success ? (
        <div className="w-full flex flex-col items-center gap-5">
          <div className="w-16 h-16 rounded-full flex items-center justify-center shadow-md"
            style={{ background: 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-gray-700 text-center leading-relaxed">
            회원가입을 축하합니다.<br />가입하신 계정으로 로그인을 해주세요.
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
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
          {/* 이름 */}
          <input
            type="text"
            placeholder="이름"
            value={name}
            onChange={e => setName(e.target.value)}
            autoComplete="name"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm"
            required
          />

          {/* 이메일 + 인증번호 받기 */}
          <div className="flex gap-2">
            <input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={e => handleEmailChange(e.target.value)}
              autoComplete="username"
              disabled={emailVerified}
              className="flex-1 min-w-0 bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm disabled:bg-gray-50 disabled:text-gray-400"
              required
            />
            {emailVerified ? (
              <div className="flex items-center justify-center px-3 flex-shrink-0 rounded-2xl text-xs font-semibold shadow-sm gap-1"
                style={{ background: '#F0FFF4', color: '#16A34A', border: '1px solid #BBF7D0' }}>
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
                <div className="flex items-center justify-center w-12 flex-shrink-0 text-xs font-mono tabular-nums"
                  style={{ color: timeLeft > 60 ? '#9CA3AF' : '#E85D2F' }}>
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

          {/* 비밀번호 */}
          <input
            type="password"
            placeholder="비밀번호 (소문자·숫자·특수문자 포함 8자 이상)"
            value={password}
            onChange={e => { setPassword(e.target.value); setError('') }}
            autoComplete="new-password"
            className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm"
            required
          />
          {/* 비밀번호 확인 */}
          <div className="relative">
            <input
              type="password"
              placeholder="비밀번호 확인"
              value={passwordConfirm}
              onChange={e => { setPasswordConfirm(e.target.value); setError('') }}
              autoComplete="new-password"
              className="w-full bg-white border rounded-2xl px-4 py-4 text-sm outline-none transition-colors shadow-sm"
              style={{
                borderColor: passwordConfirm
                  ? password === passwordConfirm ? '#22C55E' : '#EF4444'
                  : '#E5E7EB',
              }}
              required
            />
            {passwordConfirm && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                {password === passwordConfirm ? (
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

          {error && <p className="text-xs text-red-500 text-center">{error}</p>}

          <button
            type="submit"
            disabled={submitLoading || !emailVerified}
            className="w-full py-4 rounded-2xl text-white font-bold text-sm mt-1 transition-opacity active:opacity-80 shadow-md"
            style={{ background: !submitLoading && emailVerified ? 'linear-gradient(135deg, #E85D2F, #FF7B52)' : '#CCCCCC' }}
          >
            {submitLoading ? '가입 중...' : '가입하기'}
          </button>
        </form>
      )}

      {!success && (
        <p className="mt-6 text-sm text-gray-400">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-semibold" style={{ color: '#E85D2F' }}>
            로그인
          </Link>
        </p>
      )}
    </div>
  )
}