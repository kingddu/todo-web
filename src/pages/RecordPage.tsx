import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { todoApi } from '../api/todo'
import type { Todo } from '../types'

export default function RecordPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const today = dayjs()
  const dayOfWeek = today.day() // 0=일, 6=토

  let fromDate: string
  let toDate: string
  let periodLabel: string

  if (dayOfWeek === 0) {
    // 일요일: 지난 주 일~토
    fromDate = today.subtract(7, 'day').format('YYYY-MM-DD')
    toDate = today.subtract(1, 'day').format('YYYY-MM-DD')
    periodLabel = '지난 주'
  } else if (dayOfWeek === 6) {
    // 토요일: 이번 주 일~금
    fromDate = today.subtract(6, 'day').format('YYYY-MM-DD')
    toDate = today.subtract(1, 'day').format('YYYY-MM-DD')
    periodLabel = '이번 주 일~금'
  } else {
    // 평일: 이번 주 일~오늘
    fromDate = today.subtract(dayOfWeek, 'day').format('YYYY-MM-DD')
    toDate = today.format('YYYY-MM-DD')
    periodLabel = '이번 주'
  }

  const fromDay = dayjs(fromDate)
  const toDay = dayjs(toDate)

  useEffect(() => {
    todoApi.getByRange(fromDate, toDate)
      .then(res => {
        const incomplete = res.data.filter(t => !t.completed)
        // 날짜 오름차순 정렬
        incomplete.sort((a, b) => a.endDate.localeCompare(b.endDate))
        setTodos(incomplete)
      })
      .finally(() => setLoading(false))
  }, [fromDate, toDate])

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
    <div className="px-4 py-5 flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-gray-800">기록</h1>
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
                  className="bg-white rounded-2xl px-4 py-3 flex items-start gap-3 shadow-sm border-l-4"
                  style={{ borderLeftColor: todo.groupId ? '#4AAFCC' : '#E85D2F' }}
                >
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
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
