import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { todoApi } from '../api/todo'
import { authApi } from '../api/auth'
import dayjs from 'dayjs'
import type { Todo } from '../types'

export default function ProfilePage() {
  const { user, refresh } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  const [weekTodos, setWeekTodos] = useState<Todo[]>([])
  const [yearTodos, setYearTodos] = useState<Todo[]>([])

  const handleImageClick = () => fileInputRef.current?.click()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      await authApi.uploadProfileImage(file)
      await refresh()
    } catch {
      alert('이미지 업로드에 실패했어요.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const today = dayjs()
  const weekStart = today.startOf('week') // 일요일

  useEffect(() => {
    // 주간 데이터
    todoApi.getByRange(weekStart.format('YYYY-MM-DD'), today.format('YYYY-MM-DD'))
      .then(res => setWeekTodos(res.data))
      .catch(() => {})

    // 올해 데이터
    const yearStart = today.startOf('year')
    todoApi.getByRange(yearStart.format('YYYY-MM-DD'), today.format('YYYY-MM-DD'))
      .then(res => setYearTodos(res.data))
      .catch(() => {})
  }, [])

  const displayName = user?.email?.split('@')[0] ?? ''
  const todayStr = today.format('YYYY-MM-DD')

  // 오늘 달성률
  const todayTodos = weekTodos.filter(t => t.startDate <= todayStr && t.endDate >= todayStr)
  const todayDone = todayTodos.filter(t => t.completed).length
  const todayRate = todayTodos.length > 0 ? Math.round((todayDone / todayTodos.length) * 100) : 0

  // 주간 달성률
  const weekDone = weekTodos.filter(t => t.completed).length
  const weekRate = weekTodos.length > 0 ? Math.round((weekDone / weekTodos.length) * 100) : 0

  // 올해 달성률
  const yearDone = yearTodos.filter(t => t.completed).length
  const yearRate = yearTodos.length > 0 ? Math.round((yearDone / yearTodos.length) * 100) : 0

  const RateBar = ({
    label, rate, done, total, color
  }: { label: string; rate: number; done: number; total: number; color: string }) => (
    <div className="bg-white rounded-2xl p-4 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-gray-700">{label}</span>
        <span className="text-sm font-bold" style={{ color }}>{rate}%</span>
      </div>
      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${rate}%`, background: color }} />
      </div>
      <p className="text-xs text-gray-400 mt-2">{done} / {total} 완료</p>
    </div>
  )

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white px-4 pt-4 pb-6 flex flex-col items-center gap-2 border-b border-gray-100">
        <button onClick={() => navigate(-1)} className="self-start p-1 -ml-1 mb-2 active:opacity-60">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />
        <button
          onClick={handleImageClick}
          disabled={uploading}
          className="relative active:opacity-70"
        >
          {user?.profileImageUrl ? (
            <img
              src={user.profileImageUrl}
              className="w-16 h-16 rounded-full object-cover shadow"
              alt="프로필"
            />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow"
              style={{ background: 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}>
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-white shadow flex items-center justify-center">
            {uploading ? (
              <div className="w-3 h-3 rounded-full border border-t-transparent animate-spin"
                style={{ borderColor: '#E85D2F', borderTopColor: 'transparent' }} />
            ) : (
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                  stroke="#E85D2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="13" r="4" stroke="#E85D2F" strokeWidth="2" />
              </svg>
            )}
          </div>
        </button>
        <p className="text-base font-bold text-gray-800">{user?.name ?? displayName}</p>
        <p className="text-xs text-gray-400">{user?.email}</p>
      </div>

      {/* 달성률 */}
      <div className="px-4 py-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-gray-500">달성률</h2>

        <RateBar
          label="오늘"
          rate={todayRate}
          done={todayDone}
          total={todayTodos.length}
          color="#E85D2F"
        />

        <RateBar
          label="이번 주"
          rate={weekRate}
          done={weekDone}
          total={weekTodos.length}
          color="#E85D2F"
        />

        <RateBar
          label={`올해 (${today.year()}년)`}
          rate={yearRate}
          done={yearDone}
          total={yearTodos.length}
          color="#4AAFCC"
        />
      </div>
    </div>
  )
}
