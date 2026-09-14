# AWS 배포 가이드

이 문서는 이 서비스를 운영 환경에 배포하는 기준 아키텍처와 절차를 정리합니다. 실제 AWS 리소스 생성·도메인 연결·비용 발생은 여기서 자동으로 수행하지 않습니다. 운영·스테이징은 별도 계정 또는 최소한 별도 VPC·RDS·Secrets Manager 비밀값으로 분리하세요.

## 권장 구성

| 영역 | AWS 서비스 | 배치 원칙 |
| --- | --- | --- |
| 프런트엔드 | S3 + CloudFront | S3 버킷은 비공개로 두고 CloudFront Origin Access Control(OAC)로만 읽습니다. |
| API | ECR + ECS Fargate + Application Load Balancer | 컨테이너는 프라이빗 서브넷, ALB만 퍼블릭 서브넷에 둡니다. |
| 데이터베이스 | RDS for PostgreSQL | 프라이빗 DB 서브넷에 두고 ECS 보안 그룹에서만 5432 접근을 허용합니다. |
| 비밀값 | Secrets Manager | DB 접속 정보와 JWT 비밀값을 코드·GitHub·이미지에 넣지 않습니다. |
| 도메인·TLS | Route 53 + ACM | CloudFront와 ALB에 HTTPS를 적용하고 HTTP는 HTTPS로 리디렉션합니다. |
| 관측 | CloudWatch Logs, Alarm | API 오류율·ALB 5xx·ECS CPU/메모리·RDS 용량을 알림으로 연결합니다. |

S3 원본은 CloudFront OAC로 제한하는 구성이 권장됩니다. [CloudFront OAC 공식 안내](https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html)를 따르세요. React SPA는 CloudFront의 403·404 응답을 `/index.html`로 보내고 상태 코드를 200으로 바꿔 직접 URL 접속도 동작하게 설정합니다. 이 설정은 프런트엔드 배포판에만 적용하고 API 원본에는 적용하지 않습니다. [AWS SPA 배포 패턴](https://docs.aws.amazon.com/prescriptive-guidance/latest/patterns/deploy-a-react-based-single-page-application-to-amazon-s3-and-cloudfront.html)을 참고하세요.

## 사전 준비

1. AWS 계정에서 운영용 리전과 도메인을 결정합니다.
2. VPC에 퍼블릭 서브넷 2개(ALB), 프라이빗 애플리케이션 서브넷 2개(ECS), 프라이빗 DB 서브넷 2개(RDS)를 서로 다른 가용 영역에 만듭니다.
3. 보안 그룹을 아래처럼 제한합니다.
   - ALB: 인터넷에서 443만 허용
   - ECS: ALB 보안 그룹에서 애플리케이션 포트만 허용
   - RDS: ECS 보안 그룹에서 PostgreSQL 5432만 허용
4. RDS PostgreSQL을 생성하고 자동 백업, Multi-AZ(가용성 요구 시), 삭제 방지, 암호화(KMS)를 활성화합니다.
5. DB 관리자 비밀번호는 RDS가 Secrets Manager에서 관리하도록 설정하는 편이 안전합니다. RDS는 이 방식으로 자격 증명을 생성·저장·순환할 수 있습니다. [RDS와 Secrets Manager 공식 문서](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/rds-secrets-manager.html)를 참고하세요.

## 환경 변수와 비밀값

백엔드 ECS 태스크 정의에 다음 값을 넣습니다. `DB_PASSWORD`, `JWT_SECRET`은 Secrets Manager 참조로 주입하고, 저장소·Docker 이미지·브라우저 빌드 변수에는 절대 넣지 않습니다.

| 변수 | 예시/설명 |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT` | 컨테이너가 수신할 포트(예: `3000`) |
| `DB_HOST` | RDS 엔드포인트 |
| `DB_PORT` | `5432` |
| `DB_NAME` | 애플리케이션 DB 이름 |
| `DB_USER` | 애플리케이션 전용 DB 사용자 |
| `DB_PASSWORD` | Secrets Manager에서 주입 |
| `JWT_SECRET` | 32자 이상 랜덤 값, Secrets Manager에서 주입 |
| `CORS_ALLOWED_ORIGINS` | `https://app.example.com`처럼 실제 프런트엔드 출처만 쉼표로 구분 |

프런트엔드 빌드 시에는 비밀값 없이 `REACT_APP_API_BASE_URL=https://api.example.com/api`만 제공합니다. 이 값은 최종 JavaScript에 노출되므로 비밀값을 넣으면 안 됩니다.

## 첫 배포 절차

1. **검증**: CI와 동일하게 `npm ci`, `npm run typecheck`, `npm run build`, `npm run test`를 통과시킵니다.
2. **이미지 빌드**: 백엔드에서 `npm ci`, `npm run build`를 수행하는 Docker 이미지를 만들고 ECR에 태그와 함께 푸시합니다. 운영 이미지는 고정된 Git commit SHA 태그를 사용합니다.
3. **데이터베이스 전환**: 새 이미지 배포 전에 같은 VPC·보안 그룹·비밀값을 쓰는 일회성 ECS 태스크로 `npm run migrate`를 한 번 실행합니다. 웹 서비스 시작 시 자동 마이그레이션은 하지 않습니다.
4. **API 배포**: ECS Fargate 서비스에 새 태스크 정의를 반영합니다. ALB 대상 그룹의 `/health` 검사 성공 후 롤링 배포가 끝나는지 확인합니다.
5. **프런트엔드 배포**: `frontend`에서 API 주소를 주입해 빌드하고 `frontend/build` 결과만 S3에 업로드합니다. CloudFront 무효화는 변경된 경로 또는 `/*`로 수행합니다.
6. **도메인 연결**: `app`은 CloudFront, `api`는 ALB로 Route 53 별칭 레코드를 연결합니다. ACM 인증서는 CloudFront용(보통 `us-east-1`)과 ALB 리전용을 각각 준비합니다.
7. **스모크 테스트**: HTTPS 로그인, 일정 생성, 세션 지원, 관리자 승인, 강사 알림 읽음 처리, 로그아웃을 실제 도메인에서 점검합니다.

## CI/CD와 권한

GitHub Actions에는 장기 AWS access key를 저장하지 말고 OIDC 역할을 사용합니다. IAM 신뢰 정책의 `token.actions.githubusercontent.com:sub` 조건을 특정 저장소와 `main` 브랜치 또는 보호된 환경으로 제한하세요. AWS도 GitHub OIDC 역할을 사용할 때 저장소·브랜치 범위 제한을 권장합니다. [IAM 공식 안내](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_create_for-idp_oidc.html)

배포 역할은 ECR 푸시, ECS 태스크 정의/서비스 갱신, 필요한 S3·CloudFront 무효화만 허용합니다. RDS 삭제·Secrets Manager 전체 읽기·IAM 관리자 권한은 주지 않습니다. 운영 배포는 GitHub Environment 승인 규칙을 걸어 `main` 직접 푸시만으로 즉시 운영 반영되지 않게 합니다.

## 운영 점검과 복구

- RDS 자동 백업 보존 기간과 복구 리허설 일정을 정합니다. RDS는 보존 기간 안의 특정 시점으로 새 DB 인스턴스를 복원할 수 있습니다. [RDS 시점 복구 안내](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/USER_PIT.html)
- 배포 전 수동 스냅샷을 남기고, 장애 시에는 이전 ECS 태스크 정의로 되돌린 뒤 데이터 변경 여부를 확인합니다.
- CloudWatch에서 ALB 5xx, ECS 태스크 재시작, RDS 연결 수·저장 공간·CPU를 알람으로 연결합니다.
- JWT 비밀값 교체는 모든 기존 로그인 세션을 무효화하므로 공지와 함께 계획합니다. DB 비밀번호 교체는 RDS/Secrets Manager 순환 절차로 수행합니다.
- 최소 월 1회 의존성 취약점, 백업 복구, 권한 범위, CORS 출처를 점검합니다.

## 배포 전 최종 체크리스트

- [ ] 운영용 RDS가 인터넷에 공개되지 않았고 ECS에서만 접근 가능하다.
- [ ] `CORS_ALLOWED_ORIGINS`에 localhost·와일드카드가 없다.
- [ ] DB 비밀번호와 JWT 비밀값이 Secrets Manager에만 있다.
- [ ] 마이그레이션을 일회성 태스크에서 성공시킨 뒤 API를 배포했다.
- [ ] CloudFront S3 원본이 OAC로만 접근 가능하고 SPA fallback이 설정됐다.
- [ ] HTTPS, 로그, 알람, 백업 보존과 복구 리허설이 준비됐다.
- [ ] 운영 도메인에서 관리자 승인과 강사 확정 알림까지 스모크 테스트했다.
