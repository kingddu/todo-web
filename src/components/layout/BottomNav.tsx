import { useNavigate, useLocation } from 'react-router-dom'
import { useInvitations } from '../../contexts/InvitationContext'

const TABS = [
  {
    path: '/record',
    label: '이전',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M19 12H5M11 6l-6 6 6 6" stroke={active ? '#E85D2F' : '#AAAAAA'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    path: '/today',
    label: '오늘',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="16" rx="2" stroke={active ? '#E85D2F' : '#AAAAAA'} strokeWidth="2" />
        <path d="M3 9h18" stroke={active ? '#E85D2F' : '#AAAAAA'} strokeWidth="2" />
        <path d="M8 3v4M16 3v4" stroke={active ? '#E85D2F' : '#AAAAAA'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/next',
    label: '다음',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M5 12h14M13 6l6 6-6 6" stroke={active ? '#E85D2F' : '#AAAAAA'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    path: '/settings',
    label: '관리',
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M4 6h16M4 12h16M4 18h16" stroke={active ? '#E85D2F' : '#AAAAAA'} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { count } = useInvitations()

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-white border-t border-gray-100 z-50"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex">
        {TABS.map((tab) => {
          const active = pathname.startsWith(tab.path)
          return (
            <button
              key={tab.path}
              onClick={() =>
                navigate(
                  tab.path,
                  tab.path === '/today'
                    ? { state: { resetTs: Date.now() } }
                    : undefined,
                )
              }
              className="flex-1 flex flex-col items-center gap-1 py-3 transition-opacity active:opacity-60"
            >
              <div className="relative">
                {tab.icon(active)}
                {tab.path === '/settings' && count > 0 && (
                  <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                    style={{ background: '#4AAFCC' }} />
                )}
              </div>
              <span className="text-xs font-medium" style={{ color: active ? '#E85D2F' : '#AAAAAA' }}>
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
