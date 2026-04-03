import dayjs from 'dayjs'
import MainPage from './MainPage'

export default function TodayPage() {
  return <MainPage initialDate={dayjs()} />
}
