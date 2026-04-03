import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { todoApi } from '../api/todo'
import dayjs from 'dayjs'
import type { Todo } from '../types'

export default function ProfilePage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [weekTodos, setWeekTodos] = useState<Todo[]>([])
  const [yearTodos, setYearTodos] = useState<Todo[]>([])

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
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow"
          style={{ background: 'linear-gradient(135deg, #E85D2F, #FF7B52)' }}>
          {displayName.charAt(0).toUpperCase()}
        </div>
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
