import axios from 'axios'

// 서버 응답에서 받은 CSRF 토큰을 메모리에 보관
// 쿠키 읽기 타이밍 이슈를 방지하기 위해 인메모리 값을 우선 사용
let _csrfToken: string | null = null

export function updateCsrfToken(token: string) {
  _csrfToken = token
}

function getCsrfToken(): string | null {
  if (_csrfToken) return _csrfToken
  // 인메모리 값이 없을 때만 쿠키에서 읽는 fallback
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

// 응답 인터셉터: 쿠키가 갱신됐을 때 인메모리 토큰도 동기화
client.interceptors.response.use(
  (response) => {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
    if (match) _csrfToken = decodeURIComponent(match[1])
    return response
  },
  (error) => {
    // 실패한 응답에도 서버가 새 CSRF 토큰을 심었을 수 있으므로 동기화
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/)
    if (match) _csrfToken = decodeURIComponent(match[1])
    return Promise.reject(error)
  }
)

export default client