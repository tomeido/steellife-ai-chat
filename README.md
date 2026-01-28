# STEELLIFE AI 고객 지원 챗봇

(주)스틸라이프 홈페이지용 AI 고객 지원 챗봇입니다. 다국어를 지원하며 제품, 서비스, 연락처에 대한 질문에 자동으로 응답합니다.

## 주요 기능

- 🌍 **다국어 지원** - 한국어, 영어, 일본어, 중국어 자동 감지 및 응답
- 💬 **플로팅 챗봇 위젯** - 기존 홈페이지에 쉽게 통합
- 📊 **대화 로그 저장** - 고객 문의 내역 관리
- 🤖 **Google Gemini AI** - 자연스러운 대화형 응답
- 🔌 **A2A 프로토콜** - Agent-to-Agent 통신 지원

## 시작하기

### 요구사항

- Node.js 18+
- Gemini API 키

### 설치

1. 저장소 클론:
```bash
git clone <repository-url>
cd steellife-ai-chatbot
```

2. 의존성 설치:
```bash
npm install
```

3. 환경 변수 설정:
`.env.local` 파일 생성:
```env
GEMINI_API_KEY=your_gemini_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
LOGS_API_KEY=your_admin_api_key_here
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 페이지 구조

| URL | 설명 |
|-----|------|
| `/` | 메인 데모 페이지 (챗봇 위젯 포함) |
| `/widget` | iframe 임베드용 위젯 전용 페이지 |
| `/logs` | 대화 로그 관리 페이지 |

## API 엔드포인트

| 엔드포인트 | 메서드 | 설명 |
|------------|--------|------|
| `/api/a2a/.well-known/agent.json` | GET | 에이전트 카드 정보 |
| `/api/a2a` | POST | 채팅 메시지 처리 |
| `/api/logs` | GET | 대화 로그 조회 |
| `/api/logs` | POST | 로그 통계 조회 |
| `/api/logs?sessionId=xxx` | DELETE | 특정 세션 삭제 |

## 홈페이지 통합

### iframe 방식
STEELLIFE 홈페이지 (PHP)에 아래 코드 추가:
```html
<iframe 
  src="https://your-vercel-url.vercel.app/widget"
  style="position:fixed; bottom:0; right:0; 
         width:420px; height:640px; 
         border:none; z-index:9999;"
></iframe>
```

## 기술 스택

- **Next.js 15** - React 기반 프레임워크
- **Google Gemini AI** - 자연어 처리
- **A2A Protocol** - 에이전트 간 통신
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링

## Vercel 배포

환경 변수 설정:
- `GEMINI_API_KEY` - Gemini API 키
- `NEXT_PUBLIC_SITE_URL` - 배포된 사이트 URL
- `LOGS_API_KEY` - 로그 API 접근용 키 (선택)

## 회사 정보

**회사명**: (주)스틸라이프 (STEELLIFE)
**주요 제품**: 워터웨이브 패널, 스틸 패널 시스템
**연락처**: 
- TEL: 02-855-1405
- EMAIL: steelbu@steellife.net
- WEB: http://www.steellife.net

## 라이선스

MIT
