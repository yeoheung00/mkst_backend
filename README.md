# MKST Backend
Next.js프론트엔드와 유기적으로 통신하는 기술 블로그 플랫폼의 핵심 API 서버입니다. 관심사 분리(SoC) 원칙에 입각한 도메인 계층형 아키텍처를 채택하였으며, 블록 단위 JSON 콘텐츠 파이프라인, NextAuth 기반의 하이브리드 사용자 인증/인가, 그리고 홈 서버 Ubuntu CLI 환경에 최적화된 Docker 컨테이너 오케스트레이션을 구현했습니다.

## 기술 스택
* **Runtime & Language:** Node.js, TypeScript
* **Framework:** Express.js
* **ORM & Database:** Prisma ORM, PostgreSQL
* **Authentication:** NextAuth (Kakao OAuth) + 자체 서명 대칭키 JWT (jose)
* **Infrastructure & Deployment:** Ubuntu Server CLI (Self-hosted), Docker, Docker Compose

## 아키텍처 및 디렉터리 설계
단순한 기능 분할을 넘어, 기능 추가 및 수정 시 부작용을 최소화하고 코드의 재사용성을 높이기 위해 **도메인 계층화**와 **횡단 관심시 격리**를 결합한 디렉터리 구조를 설계했습니다.

![Architecture](docs/architecture.png)

```
mkst_backend/
├── prisma/
│   ├── migrations/            # DB 형상 관리 마이그레이션 이력
│   └── schema.prisma          # PostgreSQL 데이터 모델링 명세서
├── public/
│   └── uploads/               # 미디어 영속 경로 (Docker Host Volume Bind)
├── src/
│   ├── api/                   # 도메인별 비즈니스 API 모듈
│   │   ├── auth/              # 인증/인가 및 계정 정보 조회
│   │   ├── blog/              # 블로그 코어 엔진 (CRUD, Slugify, TOC 파서)
│   │   ├── upload/            # 멀티파트 폼데이터 미디어 처리
│   │   └── search.ts          # 통합 단일 검색 엔진
│   ├── shared/                # 전역 공통 횡단 관심사
│   │   ├── config/            # DB 커넥션 풀 및 스토리지 경로 제어
│   │   ├── http/              # 일원화된 HTTP 응답 포맷터
│   │   ├── middlewares/       # 커스텀 JWT 인가 가드 및 글로벌 에러 제어
│   │   └── types/             # Express Request 확장 및 전역 인터페이스
│   └── server.ts              # 애플리케이션 진입점 및 미들웨어 파이프라인
├── docker-compose.dev.yml     # 로컬 개발용 DB 전용 컨테이너
├── docker-compose.yml         # 운영 배포용 전체 서비스 오케스트레이션
└── Dockerfile                 # Multi-stage 빌드 명세서
```

### 설계 강점 및 의도
* **도메인 단위 응집도 확보(```src/api/{domain}```):** 각 도메인(```auth```, ```blog```, ```upload```, ```search```)을 각 폴더 내에서 ```router```, ```controller```, ```service```로 분리하여 유지보수성을 향상시키면서 각 기능의 독립성을 확보합니다.
* **횡단 관심사의 중앙 집중화(```src/shared```):** 전역적으로 사용되는 횡단 관심사(예: 인증, 에러 처리, DB 커넥션 풀 등)를 중앙에서 관리하여 코드 중복을 줄이고 유지보수성을 향상시킵니다.
* **강박적인 양식 통일화 지양:** 검색(```search```) 기능만을 수행하여 하위 도메인이 없는 경우 타 도메인처럼 ```router```, ```controller```, ```service```로 분리하지 않고 단일 파일로 유지하여 오버엔지니어링을 지양합니다.

## 사용자 인증/인가 절차

Next.js와 Express백엔드로 분리된 구조에서 별도의 복잡한 토큰 관리 인프라 없이 가볍고 빠르게 인증을 처리하도록 **Next.js의 서버리스 세션과 연동된 자체 토큰 발급 구조**를 설계했습니다.

![Authorization](docs/authorization.png)
