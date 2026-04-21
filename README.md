# TodoKing Frontend

TodoKing의 프론트엔드 애플리케이션입니다.  
할 일을 관리하고, 그룹 단위로 협업하며, 기록과 달성률을 확인할 수 있는 웹 서비스입니다.

---

## 📌 프로젝트 소개

TodoKing은 개인 및 그룹 단위로 할 일을 관리할 수 있는 서비스입니다.

사용자는 다음과 같은 기능을 사용할 수 있습니다:

- 회원가입 / 로그인 / 로그아웃
- 이메일 인증 기반 회원가입
- 비밀번호 찾기 / 재설정
- 오늘 할 일 관리
- 주간 기준 미완료 / 예정 할 일 조회
- 그룹 생성 및 초대/관리
- 프로필 설정 및 달성률 확인

---

## 🛠 기술 스택

- **Frontend**
  - React 19
  - TypeScript
  - Vite

- **상태 관리 / 데이터**
  - TanStack Query
  - React Context

- **네트워크**
  - Axios

- **스타일**
  - Tailwind CSS

- **기타**
  - React Router DOM
  - Day.js

---

## 📁 폴더 구조

```bash
src/
├─ api/            # API 통신 로직
├─ components/     # 공통 UI 컴포넌트
├─ contexts/       # 전역 상태 (인증, 초대, 폰트 등)
├─ pages/          # 페이지 단위 컴포넌트
├─ types/          # 타입 정의
├─ App.tsx
└─ main.tsx
```
