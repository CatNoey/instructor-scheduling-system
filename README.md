# Instructor Scheduling

관리자가 일정·세션과 강사 지원을 관리하고, 강사가 열린 세션에 지원하거나 본인 지원을 취소하는 MVP입니다. 역할은 `admin`, `instructor` 두 가지만 지원합니다.

## 빠른 실행

Node.js와 PostgreSQL이 필요합니다. 비밀값이 담긴 기존 환경 파일은 복사하거나 공유하지 말고, 각 예시 파일에서 새 환경을 만드세요.

```sh
npm run install:all
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# backend/.env의 your_* 값을 개발용 PostgreSQL과 32자 이상 JWT 비밀값으로 교체
npm run migrate
npm run dev
```

- 프런트엔드는 기본 `http://localhost:3001`입니다.
- API는 기본 `http://localhost:3000/api`입니다.
- 서버 시작은 스키마를 변경하지 않습니다. `npm run migrate`를 명시적으로 실행합니다.
- `npm run dev`는 두 서버를 함께 종료합니다. 개별 실행은 `npm run dev:frontend`, `npm run dev:backend`입니다.
- 초기 관리자 계정은 공개 가입으로 만들 수 없습니다. 환경 변수로 값을 전달해 `npm --prefix backend run create:admin`을 한 번 실행합니다.

## 데이터·API 계약

- 모든 JSON 식별자와 JWT의 `userId`는 숫자입니다.
- `Schedule.date`는 업무 날짜(`YYYY-MM-DD`)입니다. `Session.startTime`/`endTime`은 명시적 UTC 오프셋이 포함된 ISO timestamp로 요청하고, API는 UTC ISO timestamp로 반환합니다.
- 프런트엔드는 날짜와 시간을 결합할 때 우선 브라우저의 현지 시간대를 사용합니다. 조직 고정 업무 시간대가 필요하면 운영 전 별도 결정을 해야 합니다.
- 로그인 성공 응답은 호환성을 위해 `{ token, user }`를 유지합니다. 그 밖의 성공 응답은 `{ success: true, data }`, 오류 응답은 `{ success: false, error: { code, message } }`입니다.
- 생성·수정은 허용된 입력 필드만 처리합니다. 역할, ID, 부모 ID 같은 서버 관리 필드는 요청으로 바꿀 수 없습니다.
- 목록 API는 이번 MVP에서 페이지네이션을 제공하지 않습니다. `page`/`pageSize` 응답 계약도 없습니다.
- `capacity`는 일정 단위의 필요 배정 인원입니다. 관리자는 접수 순서대로 지원을 검토하고, 필요 인원 범위에서 수동으로 배정·반려·재검토할 수 있습니다.
- 한 강사는 겹치는 시간의 세션에 중복 배정될 수 없습니다. 모집 마감·재개·조정은 일정 상태를 관리자가 직접 변경합니다.
- 관리자가 지원을 `승인`하면 해당 강사 계정에 확정 알림이 생성됩니다. 알림은 로그인한 사용자만 조회·읽음 처리할 수 있습니다.

## 검증

```sh
npm run typecheck
npm run build
npm run test
```

통합 테스트는 별도 PostgreSQL 데이터베이스를 사용해야 합니다. CI는 일회용 PostgreSQL 서비스와 `NODE_ENV=test`를 사용하며, 개발·운영 DB에는 마이그레이션을 적용하지 않습니다.

## 화면 사용성

- 사용자 화면과 오류 안내는 한국어로 제공합니다.
- 모바일 320px부터 관리자·강사 화면을 한 열로 재배치하고, 표는 가로 스크롤로 보존합니다.
- 키보드 초점 표시와 44px 이상의 주요 입력·버튼 터치 영역을 적용했습니다.
- 세션 시각은 현재 브라우저의 현지 시간대를 기준으로 입력·표시합니다.

## 운영 전 점검

배포나 기존 DB 전환은 이 저장소에서 자동으로 수행하지 않습니다. 실제 배포 전에 다음을 검토하세요.

- 배포 대상·비용·도메인·HTTPS
- 토큰 보관/폐기 정책과 CORS 허용 출처
- 기존 DB 보존·전환 계획과 백업/복구 리허설
- 고정 업무 시간대, 삭제 이력 보존, 계정 발급 방식

현재 구현 상태와 과거 점검 결과는 [ASSESSMENT.md](ASSESSMENT.md)에 분리해 기록합니다.
AWS에 운영 배포할 때는 [AWS_DEPLOYMENT_GUIDE.md](AWS_DEPLOYMENT_GUIDE.md)를 사용하세요.
역할별 업무 시나리오와 예외 흐름은 [USER_FLOWS_AND_USE_CASES.md](USER_FLOWS_AND_USE_CASES.md)를 사용하세요.
