# 구현 상태 점검 — 2026-09-08

판정: 초기 프로토타입. 화면과 데이터 모델의 기본 구조는 있으나, 실제 사용자 흐름을 끝까지 수행하는 MVP는 미완성입니다. 정식 요구사항과 수용 기준이 없어 정확한 완성률을 산출할 수 없습니다. 로그인 → 일정 관리 → 강사 지원 → 승인이라는 최소 업무 흐름을 기준으로 보면 대략 30~40% 수준이라는 정성적 추정입니다. 테스트 커버리지 수치가 아닙니다.

## 기능별 근거

| 영역 | 구현 상태 | 근거 |
|---|---|---|
| 관리자 UI | 캘린더, 일정 폼, 목록, 필터, 세션 폼 구현 | frontend/src/components |
| 로그인 | 프론트는 입력 비밀번호를 검증하지 않고 항상 관리자·mock-jwt-token 반환 | frontend/src/services/authService.ts |
| 서버 인증 | bcrypt·JWT 로그인/회원가입 코드 존재. 공개 회원가입에서 요청 role을 그대로 사용하며 JWT 기본값이 발급·검증 간 다름 | backend/src/controllers/authController.ts, backend/src/middleware/authMiddleware.ts |
| 일정 생성·조회 | 모델 저장·조회 구현. 실제 DB 연동은 미검증 | backend/src/controllers/scheduleController.ts |
| 일정 수정·삭제 | 빈 함수로 응답도 보내지 않음 | 위 파일의 updateSchedule, deleteSchedule |
| 서버 권한 | 일정 라우트에 인증·역할 미들웨어 없음. 프론트 권한 표시는 서버 보호를 대체하지 못함 | backend/src/routes/scheduleRoutes.ts |
| 세션 CRUD | 프론트는 /schedules/:id/sessions를 호출하나 서버 라우트·Session 모델 없음 | frontend/src/services/api.ts, backend/src/routes, backend/src/models |
| 강사 지원 | 컨트롤러/라우터는 있으나 server.ts에 등록 안 됨. URL과 응답 형식도 프론트와 불일치 | instructorApplicationRoutes.ts, instructorApplicationController.ts, server.ts |
| 지원 데이터 모델 | 프론트 sessionId/session과 백엔드 scheduleId가 다름. include에 사용하는 schedule association 정의 없음 | frontend/src/types/index.ts, backend/src/models/InstructorApplication.ts |
| 인증 헤더 | 공통 Axios 클라이언트에 Bearer 토큰 주입 없음 | frontend/src/services/api.ts |
| 승인·배정·정산 | 상태/타입 일부만 존재. 해당 업무를 완료하는 서버 API 없음 | 모델 및 전체 라우트 조사 |
| 배포·테스트 | 백엔드 컴파일 실패, 시작 경로 불일치, 테스트 구성/계약 정비 필요 | 아래 검증 결과 |

## 실행한 검증

- 원본 프론트: TypeScript `tsc --noEmit` 통과.
- 통합 임시본 프론트: `CI=true npm run build` 통과. 기존 설치된 node_modules를 사용했으며 새 npm ci로 재현한 결과는 아님. Browserslist 및 Babel 의존성 경고 존재.
- 원본 백엔드: `tsc --noEmit` 실패. `src/config/dbMigration.ts` 15행의 connect, 25행의 end는 Sequelize에 없는 메서드입니다. pg Pool과 Sequelize 코드가 혼재합니다.
- 백엔드 시작 스크립트는 dist/server.js를 가리키나 tsconfig의 rootDir='.' 설정상 server.ts 출력은 dist/src/server.js입니다.
- Jest `--showConfig`로 구성만 확인. ts-jest 의존성은 있으나 TypeScript용 명시적 변환 설정은 없음.
- 기존 테스트는 `/api/schedules/create`와 최상위 id 응답을 기대하나 실제 생성 경로는 `/api/schedules`, 응답은 `{ success, data }`입니다.
- 기존 테스트 beforeEach가 Schedule.destroy({where:{}})를 호출하고 server import 시 DB sync가 실행돼 실제 테스트는 실행하지 않았습니다. DB 연동/E2E는 미검증입니다.
- 통합 실행 스크립트 `node --check scripts/dev.cjs` 통과. 서버 시작은 DB 스키마 변경을 수반해 실행하지 않았습니다.
- 두 원본 Git HEAD가 통합 main의 조상으로 보존되는지 검사하고, 원본 작업 파일과 통합본의 바이트 일치를 확인했습니다.

## 완료 순서 제안

1. DB 초기화와 서버 실행을 분리하고 마이그레이션·빌드 출력·테스트 DB 설정을 정리.
2. 실제 로그인 연결, 토큰 전달, 서버 역할 검증, 회원가입 role 제한.
3. 일정 수정·삭제 구현과 API 응답 계약 통일.
4. Schedule/Session 구분 확정 후 세션 CRUD, 지원·취소·승인·배정 구현 및 연결.
5. 중복 지원, 일정 충돌, 정원, 권한 실패를 포함한 통합 테스트와 사용자 흐름 검증.

요구사항 범위와 목표 운영 규모를 확인하기 전에는 남은 개발 기간을 확정하기 어렵습니다.
