import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

interface Props {
  selectedDate: dayjs.Dayjs
  onSelect: (date: dayjs.Dayjs) => void
  dotDates?: string[]  // 'YYYY-MM-DD' 형식, todo 있는 날짜들
}

export default function MonthView({ selectedDate, onSelect, dotDates = [] }: Props) {
  const today = dayjs()
  const firstDay = selectedDate.startOf('month')
  const daysInMonth = selectedDate.daysInMonth()
  const startOffset = firstDay.day() // 0=일

  const prevMonth = () => onSelect(selectedDate.subtract(1, 'month').date(1))
  const nextMonth = () => onSelect(selectedDate.add(1, 'month').date(1))

  const dotSet = new Set(dotDates)

  // 달력 셀 배열 (빈 칸 + 날짜)
  const cells: (dayjs.Dayjs | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => firstDay.add(i, 'day')),
  ]

  return (
    <div className="bg-white px-4 py-3 border-b border-gray-100">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prevMonth} className="p-1 rounded-full active:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-base font-semibold text-gray-800">
          {selectedDate.format('YYYY년 M월')}
        </span>
        <button onClick={nextMonth} className="p-1 rounded-full active:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 mb-1">
        {['일', '월', '화', '수', '목', '금', '토'].map((d, i) => (
          <div key={d} className="text-center text-[11px] font-medium py-1"
            style={{ color: i === 0 ? '#E85D2F' : i === 6 ? '#4AAFCC' : '#999' }}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 gap-y-1">
        {cells.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} />

          const key = day.format('YYYY-MM-DD')
          const isSelected = day.isSame(selectedDate, 'day')
          const isToday = day.isSame(today, 'day')
          const hasDot = dotSet.has(key)
          const isSun = day.day() === 0
          const isSat = day.day() === 6

          return (
            <button
              key={key}
              onClick={() => onSelect(day)}
              className="flex flex-col items-center gap-[2px] py-1 rounded-xl active:scale-95 transition-all"
              style={isSelected ? { background: '#E85D2F' } : undefined}
            >
              <span className="text-sm w-7 h-7 flex items-center justify-center rounded-full font-medium"
                style={{
                  color: isSelected ? 'white' : isToday ? '#E85D2F' : isSun ? '#E85D2F' : isSat ? '#4AAFCC' : '#1A1A1A',
                  fontWeight: isToday && !isSelected ? 700 : undefined,
                }}>
                {day.format('D')}
              </span>
              {/* todo 있는 날 점 */}
              <div className="w-1 h-1 rounded-full"
                style={{ background: hasDot ? (isSelected ? 'white' : '#E85D2F') : 'transparent' }} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
