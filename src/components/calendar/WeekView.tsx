import dayjs from 'dayjs'
import 'dayjs/locale/ko'

dayjs.locale('ko')

interface Props {
  selectedDate: dayjs.Dayjs
  onSelect: (date: dayjs.Dayjs) => void
}

export default function WeekView({ selectedDate, onSelect }: Props) {
  const startOfWeek = selectedDate.startOf('week')
  const days = Array.from({ length: 7 }, (_, i) => startOfWeek.add(i, 'day'))
  const today = dayjs()

  const prevWeek = () => onSelect(selectedDate.subtract(7, 'day'))
  const nextWeek = () => onSelect(selectedDate.add(7, 'day'))

  return (
    <div className="bg-white px-2 py-3 border-b border-gray-100">
      {/* 월 표시 + 주 이동 */}
      <div className="flex items-center justify-between mb-2 px-2">
        <button onClick={prevWeek} className="p-1 rounded-full active:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-600">
          {selectedDate.format('YYYY년 M월')}
        </span>
        <button onClick={nextWeek} className="p-1 rounded-full active:bg-gray-100">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* 요일 + 날짜 */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const isSelected = day.isSame(selectedDate, 'day')
          const isToday = day.isSame(today, 'day')
          const isSun = day.day() === 0
          const isSat = day.day() === 6

          return (
            <button
              key={day.format('YYYY-MM-DD')}
              onClick={() => onSelect(day)}
              className="flex flex-col items-center gap-1 py-1 rounded-xl transition-all active:scale-95"
              style={isSelected ? { background: '#E85D2F' } : undefined}
            >
              <span className="text-[10px] font-medium"
                style={{ color: isSelected ? 'white' : isSun ? '#E85D2F' : isSat ? '#4AAFCC' : '#999' }}>
                {day.format('dd')}
              </span>
              <span className="text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full"
                style={{
                  color: isSelected ? 'white' : isToday ? '#E85D2F' : isSun ? '#E85D2F' : isSat ? '#4AAFCC' : '#1A1A1A',
                  fontWeight: isToday && !isSelected ? 700 : undefined,
                }}>
                {day.format('D')}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
