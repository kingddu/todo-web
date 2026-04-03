import { useState, useEffect } from 'react'
import dayjs from 'dayjs'
import { todoApi } from '../api/todo'
import type { Todo } from '../types'

export default function NextPage() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)

  const today = dayjs()
  const tomorrow = today.add(1, 'day')
  // 돌아오는 토요일: 토요일이면 다음 토요일(+7), 나머지는 이번 주 토요일
  const daysToSaturday = today.day() === 6 ? 7 : (6 - today.day())
  const comingSaturday = today.add(daysToSaturday, 'day')
  // 일요일이면 "이번 주 토~일", 토요일이면 "다음 주 일~토" 라벨
  const dayOfWeek = today.day()

  const fromDate = tomorrow.format('YYYY-MM-DD')
  const toDate = comingSaturday.format('YYYY-MM-DD')

  useEffect(() => {
    if (fromDate > toDate) { setLoading(false); return }
    todoApi.getByRange(fromDate, toDate)
      .then(res => {
        const sorted = [...res.data].sort((a, b) => a.endDate.localeCompare(b.endDate))
        setTodos(sorted)
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
    const isToday = d.isSame(today, 'day')
    const isTomorrow = d.isSame(tomorrow, 'day')
    const label = isToday ? '오늘' : isTomorrow ? '내일' : d.format('M월 D일')
    return `${label} (${days[d.day()]})`
  }

  return (
    <div className="px-4 py-5 flex flex-col gap-4">
      <div>
        <h1 className="text-lg font-bold text-gray-800">다음</h1>
        <p className="text-xs text-gray-400 mt-0.5">
          {dayOfWeek === 6 ? '다음 주' : '이번 주'}{' '}
          ({tomorrow.format('M/D')} ~ {comingSaturday.format('M/D')}) 할 일
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
              <path d="M5 12h14M13 6l6 6-6 6" stroke="#E85D2F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm text-gray-400">이번 주 예정된 할 일이 없어요!</p>
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
                  {todo.completed && (
                    <span className="text-xs px-2 py-1 rounded-full flex-shrink-0"
                      style={{ background: '#F0FDF4', color: '#16A34A' }}>
                      완료
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
