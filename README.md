# Instructor Scheduling

관리자가 일정과 세션을 관리하고, 강사가 열린 세션에 지원하거나 본인 지원을 취소하는 MVP입니다. 역할은 `admin`, `instructor` 두 가지만 지원합니다. 승인·배정·정산·추가 역할은 이 MVP 범위에 포함하지 않습니다.

## 빠른 실행

Node.js와 PostgreSQL이 필요합니다. 비밀값이 담긴 기존 환경 파일은 복사하거나 공유하지 말고, 각 예시 파일에서 새 환경을 만드세요.

```sh
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
npm run migrate
npm run dev
```

- 프런트엔드는 기본 `http://localhost:3001`입니다.
- API는 기본 `http://localhost:3000/api`입니다.
- 서버 시작은 스키마를 변경하지 않습니다. `npm run migrate`를 명시적으로 실행합니다.
- `npm run dev`는 두 서버를 함께 종료합니다. 개별 실행은 `npm run dev:frontend`, `npm run dev:backend`입니다.

## 데이터·API 계약

- 모든 JSON 식별자와 JWT의 `userId`는 숫자입니다.
- `Schedule.date`는 업무 날짜(`YYYY-MM-DD`)입니다. `Session.startTime`/`endTime`은 명시적 UTC 오프셋이 포함된 ISO timestamp로 요청하고, API는 UTC ISO timestamp로 반환합니다.
- 프런트엔드는 날짜와 시간을 결합할 때 우선 브라우저의 현지 시간대를 사용합니다. 조직 고정 업무 시간대가 필요하면 운영 전 별도 결정을 해야 합니다.
- 로그인 성공 응답은 호환성을 위해 `{ token, user }`를 유지합니다. 그 밖의 성공 응답은 `{ success: true, data }`, 오류 응답은 `{ success: false, error: { code, message } }`입니다.
- 생성·수정은 허용된 입력 필드만 처리합니다. 역할, ID, 부모 ID 같은 서버 관리 필드는 요청으로 바꿀 수 없습니다.
- 목록 API는 이번 MVP에서 페이지네이션을 제공하지 않습니다. `page`/`pageSize` 응답 계약도 없습니다.

## 검증

```sh
npm run typecheck
npm run build
npm run test
```

통합 테스트는 별도 PostgreSQL 데이터베이스를 사용해야 합니다. CI는 일회용 PostgreSQL 서비스와 `NODE_ENV=test`를 사용하며, 개발·운영 DB에는 마이그레이션을 적용하지 않습니다.

## 운영 전 점검

배포나 기존 DB 전환은 이 저장소에서 자동으로 수행하지 않습니다. 실제 배포 전에 다음을 검토하세요.

- 배포 대상·비용·도메인·HTTPS
- 토큰 보관/폐기 정책과 CORS 허용 출처
- 기존 DB 보존·전환 계획과 백업/복구 리허설
- 고정 업무 시간대, 세션 정원 의미, 삭제 이력 보존, 계정 발급 방식

현재 구현 상태와 과거 점검 결과는 [ASSESSMENT.md](ASSESSMENT.md)에 분리해 기록합니다.
