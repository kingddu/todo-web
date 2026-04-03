import axios from 'axios'

// 메모리 우선, 쿠키 폴백
let _csrfToken: string | null = null

export function setCsrfToken(token: string) {
  _csrfToken = token
}

function getCsrfToken(): string | null {
  if (_csrfToken) return _csrfToken
  // CsrfCookieFilter가 설정한 쿠키에서 폴백
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
