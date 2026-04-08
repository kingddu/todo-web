import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { todoApi } from '../api/todo'
import { useAuth } from '../contexts/AuthContext'
import type { Todo } from '../types'

export default function RecordPage() {
  const { user } = useAuth()
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const pinnedGroupId = user?.userId
    ? Number(localStorage.getItem(`pinnedGroupId_${user.userId}`)) || undefined
    : undefined

  const today = dayjs()
  const dayOfWeek = today.day()

  let fromDate: string
  let toDate: string
  let periodLabel: string

  if (dayOfWeek === 0) {
    fromDate = today.subtract(7, 'day').format('YYYY-MM-DD')
    toDate = today.subtract(1, 'day').format('YYYY-MM-DD')
    periodLabel = '지난 주'
  } else if (dayOfWeek === 6) {
    fromDate = today.subtract(6, 'day').format('YYYY-MM-DD')
    toDate = today.subtract(1, 'day').format('YYYY-MM-DD')
    periodLabel = '이번 주 일~금'
  } else {
    fromDate = today.subtract(dayOfWeek, 'day').format('YYYY-MM-DD')
    toDate = today.format('YYYY-MM-DD')
    periodLabel = '이번 주'
  }

  const fromDay = dayjs(fromDate)
  const toDay = dayjs(toDate)

  const load = () => {
    todoApi.getByRange(fromDate, toDate)
      .then(res => {
        const incomplete = res.data.filter(t => !t.completed)
        incomplete.sort((a, b) => {
          // 1. 날짜 오름차순 (날짜별 섹션 순서)
          const dateCompare = a.endDate.localeCompare(b.endDate)
          if (dateCompare !== 0) return dateCompare
          // 2. 같은 날짜: 개인 먼저, 그룹 나중
          const aIsGroup = a.groupId ? 1 : 0
          const bIsGroup = b.groupId ? 1 : 0
          if (aIsGroup !== bIsGroup) return aIsGroup - bIsGroup
          // 3. 그룹 내: 고정 그룹 우선
          const aPinned = pinnedGroupId !== undefined && a.groupId === pinnedGroupId ? 0 : 1
          const bPinned = pinnedGroupId !== undefined && b.groupId === pinnedGroupId ? 0 : 1
          if (aPinned !== bPinned) return aPinned - bPinned
          // 4. 생성순 (id 오름차순)
          return a.id - b.id
        })
        setTodos(incomplete)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [fromDate, toDate])

  const handleComplete = async (todoId: number) => {
    try {
      await todoApi.complete(todoId)
      setTodos(prev => prev.filter(t => t.id !== todoId))
    } catch {
      alert('완료 처리에 실패했어요.')
    }
  }

  const handleDelete = async (todoId: number) => {
    try {
      await todoApi.delete(todoId)
      setTodos(prev => prev.filter(t => t.id !== todoId))
    } catch {
      alert('삭제에 실패했어요.')
    }
  }

  const grouped: Record<string, Todo[]> = {}
  for (const todo of todos) {
    const key = todo.endDate
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(todo)
  }

  const dayLabel = (dateStr: string) => {
    const d = dayjs(dateStr)
    const days = ['일', '월', '화', '수', '목', '금', '토']
    return `${d.format('M월 D일')} (${days[d.day()]})`
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4 pb-20">
      <div>
        <h1 className="text-lg font-bold text-gray-800">이전</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {periodLabel} ({fromDay.format('M/D')} ~ {toDay.format('M/D')}) 미완료 할 일
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: '#E85D2F', borderTopColor: 'transparent' }} />
        </div>
      ) : todos.length === 0 ? (
        <div className="flex flex-col items-center py-16 gap-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: '#FFF3F0' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M9 11l3 3L22 4" stroke="#E85D2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="#E85D2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">이번 주 미완료 할 일이 없어요!</p>
        </div>
      ) : (
        Object.keys(grouped).sort().map(dateStr => (
          <section key={dateStr}>
            <h2 className="text-xs font-semibold text-gray-400 mb-2">{dayLabel(dateStr)}</h2>
            <div className="flex flex-col gap-2">
              {grouped[dateStr].map(todo => (
                <div
                  key={todo.id}
                  className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm border-l-4"
                  style={{ borderLeftColor: todo.groupId ? '#4AAFCC' : '#E85D2F' }}
                >
                  {/* 완료 체크 버튼 */}
                  <button
                    onClick={() => handleComplete(todo.id)}
                    className="w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center active:opacity-60"
                    style={{ borderColor: todo.groupId ? '#4AAFCC' : '#E85D2F' }}
                  />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{todo.title}</p>
                    {todo.category && (
                      <p className="text-xs text-gray-400 mt-0.5">{todo.category}</p>
                    )}
                    {todo.groupName && (
                      <p className="text-xs mt-0.5" style={{ color: '#4AAFCC' }}>
                        {todo.groupDisbanded ? `${todo.groupName} (해산)` : todo.groupName}
                      </p>
                    )}
                  </div>

                  <span className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                    style={{ background: '#FFF3F0', color: '#E85D2F' }}>
                    미완료
                  </span>

                  <button
                    onClick={() => handleDelete(todo.id)}
                    className="flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-full active:opacity-60"
                    style={{ background: '#FFE0DB' }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <polyline points="3 6 5 6 21 6" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M10 11v6M14 11v6" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" />
                      <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
