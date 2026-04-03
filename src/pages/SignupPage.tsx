import { useState, FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authApi } from '../api/auth'

export default function SignupPage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (password.length < 6) { setError('비밀번호는 6자 이상이어야 해요.'); return }
    setError('')
    setLoading(true)
    try {
      await authApi.signup({ name: name.trim(), email: email.trim(), password })
      setSuccess(true)
    } catch (err: any) {
      if (err?.response?.status === 409) {
        setError('이미 사용 중인 이메일이에요.')
      } else {
        setError('회원가입에 실패했어요. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
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
        <input
          type="text"
          placeholder="이름"
          value={name}
          onChange={e => setName(e.target.value)}
          autoComplete="name"
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm"
          required
        />
        <input
          type="email"
          placeholder="이메일"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="username"
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm"
          required
        />
        <input
          type="password"
          placeholder="비밀번호 (6자 이상)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 text-sm outline-none focus:border-[#E85D2F] transition-colors shadow-sm"
          required
        />

        {error && <p className="text-xs text-red-500 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 rounded-2xl text-white font-bold text-sm mt-1 transition-opacity active:opacity-80 shadow-md"
          style={{ background: loading ? '#CCCCCC' : 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}
        >
          {loading ? '가입 중...' : '가입하기'}
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
