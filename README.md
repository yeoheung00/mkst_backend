# MKST Backend
Next.js프론트엔드와 유기적으로 통신하는 기술 블로그 플랫폼의 핵심 API 서버입니다. 관심사 분리(SoC) 원칙에 입각한 도메인 계층형 아키텍처를 채택하였으며, 블록 단위 JSON 콘텐츠 파이프라인, NextAuth 기반의 하이브리드 인증/인가, 그리고 홈 서버 Ubuntu CLI 환경에 최적화된 Docker 컨테이너 오케스트레이션을 구현했습니다.

## 기술 스택
* **Runtime & Language:** Node.js, TypeScript
* **Framework:** Express.js
* **ORM & Database:** Prisma ORM, PostgreSQL
* **Authentication:** NextAuth (Kakao OAuth) + 자체 서명 대칭키 JWT (jose)
* **Infrastructure & Deployment:** Ubuntu Server CLI (Self-hosted), Docker, Docker Compose