import axios from 'axios'

// CSRF 토큰을 항상 쿠키에서 읽음
// CsrfCookieFilter가 모든 응답에 XSRF-TOKEN 쿠키를 갱신하므로 항상 최신 값
function getCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : null
}

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const method = config.method?.toUpperCase() ?? ''
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const token = getCsrfToken()
    if (token) config.headers['X-XSRF-TOKEN'] = token
  }
  return config
})

export default client
