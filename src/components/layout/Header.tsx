import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Header() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const displayName = user?.email?.split('@')[0] ?? ''

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100"
      style={{ paddingTop: 'calc(env(safe-area-inset-top) + 12px)' }}>

      {/* 왼쪽: 프로필 */}
      <button
        onClick={() => navigate('/profile')}
        className="flex items-center gap-2 active:opacity-60 transition-opacity"
      >
        {user?.profileImageUrl ? (
          <img
            src={user.profileImageUrl}
            className="w-9 h-9 rounded-full object-cover"
            alt="프로필"
          />
        ) : (
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
            style={{ background: 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}>
            {displayName.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-gray-700 max-w-[120px] truncate">
          {displayName}
        </span>
      </button>

      {/* 오른쪽: 계정 설정 */}
      <button
        onClick={() => navigate('/account-settings')}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-100 active:opacity-60 transition-opacity"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" stroke="#555555" strokeWidth="2" />
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"
            stroke="#555555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </header>
  )
}
