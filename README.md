# Instructor Scheduling

강사 일정 관리 시스템의 프론트엔드와 백엔드를 한 저장소로 통합한 프로젝트입니다.

## 구조

- `frontend/`: React, Redux Toolkit, TypeScript, Create React App
- `backend/`: Express, TypeScript, Sequelize, PostgreSQL
- `ASSESSMENT.md`: 2026-09-08 기준 구현 상태와 검증 결과
- `instructor-scheduling.code-workspace`: 전체 프로젝트를 여는 편집기 워크스페이스

## 설치와 실행

Node.js와 npm, 개발용 PostgreSQL이 필요합니다.

```sh
npm run install:all
npm run typecheck
npm run build
npm run dev
```

`npm run dev`는 프론트엔드(3001)와 백엔드(기본 3000)를 함께 실행하며 종료 시 자식 프로세스도 종료합니다. 개별 실행은 `npm run dev:frontend`, `npm run dev:backend`입니다.

설정은 `frontend/.env`와 `backend/.env`에서 각각 읽습니다. 로컬 원본의 환경 파일은 내용 변경 없이 보존했습니다. 새 환경의 백엔드 설정은 `backend/.env.example`을 참고하세요. 프론트엔드 API 클라이언트는 `REACT_APP_API_BASE_URL=http://localhost:3000/api`를 사용합니다.

백엔드 시작 시 `sequelize.sync({ alter: true })`가 실행됩니다. 재개발 시 전용 개발 DB를 사용하고 테스트 DB를 분리하세요. 로그인(JWT), 관리자 일정·세션 CRUD, 강사 세션 지원·취소·조회 흐름을 제공합니다. API 요청은 토큰이 필요한 경로에 자동으로 Bearer 토큰을 포함합니다.

## 검증

```sh
npm run typecheck
npm run build
npm --prefix backend test -- --runInBand
```

## 통합 이력

두 원본 저장소의 HEAD를 부모로 하는 통합 커밋을 생성했습니다. `legacy-frontend`, `legacy-backend` 브랜치에서 기존 이력을 볼 수 있습니다. 기존 미커밋 변경 7개 파일은 각 하위 폴더에서 미커밋 상태로 유지했습니다. 원본 저장소는 다음 경로에 그대로 남아 있습니다.

- `/Users/youngtak/Projects/instructor-scheduling-system`
- `/Users/youngtak/Projects/instructor-scheduling-backend`

앞으로 수정할 통합본 경로는 `/Users/youngtak/Projects/instructor-scheduling`입니다. 이 통합은 폴더·Git·실행 진입점을 정리한 것이며, 기존 업무 기능을 새로 완성한 작업은 아닙니다. 의존성은 용량이 큰 기존 node_modules를 복제하지 않았으므로 최초 사용 시 `npm run install:all`로 설치하세요.
