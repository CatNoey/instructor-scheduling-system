import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchSessions, deleteSession } from '../../store/sessionSlice';
import { InstructorApplication, Session } from '../../types';
import SessionForm from '../SessionForm/SessionForm';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { applicationStatusLabel, formatTime, trainingTypeLabel } from '../../utils/presentation';
import { getScheduleApplications, reviewApplication } from '../../services/api';
import styles from './SessionManagement.module.css';

export interface SessionManagementProps { scheduleId: number; scheduleDate: string; scheduleName: string; canEdit: boolean; canDelete: boolean; capacity: number; }

const SessionManagement: React.FC<SessionManagementProps> = ({ scheduleId, scheduleDate, scheduleName, canEdit, canDelete, capacity }) => {
  const dispatch: AppDispatch = useDispatch();
  const { items: sessions, status, error } = useSelector((state: RootState) => state.sessions);
  const [selectedSession, setSelectedSession] = useState<Session>();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  const loadApplications = async () => {
    try { setApplicationError(null); setApplications(await getScheduleApplications(scheduleId)); }
    catch (caught) { setApplicationError(caught instanceof Error ? caught.message : '지원 목록을 불러오지 못했습니다.'); }
  };
  useEffect(() => { void dispatch(fetchSessions(scheduleId)); void loadApplications(); }, [dispatch, scheduleId]);
  useEffect(() => {
    if (!isFormOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsFormOpen(false); };
    window.addEventListener('keydown', closeOnEscape); return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isFormOpen]);

  const handleReview = async (applicationId: number, nextStatus: InstructorApplication['status']) => {
    try {
      setReviewingId(applicationId); await reviewApplication(applicationId, nextStatus); await loadApplications();
      showSuccessNotification(nextStatus === 'approved' ? '강사를 최종 배정했습니다. 해당 강사에게 확정 알림을 보냈습니다.' : nextStatus === 'rejected' ? '지원을 반려했습니다.' : '지원 상태를 검토 대기로 변경했습니다.');
    } catch (caught) { showErrorNotification(caught instanceof Error ? caught.message : '지원 상태를 변경하지 못했습니다.'); }
    finally { setReviewingId(null); }
  };
  const openNewSession = () => { setSelectedSession(undefined); setIsFormOpen(true); };
  const openEditSession = (session: Session) => { setSelectedSession(session); setIsFormOpen(true); };
  const handleDeleteSession = async (sessionId: number) => {
    if (!window.confirm('이 세션과 연결된 지원 내역도 함께 삭제됩니다. 계속할까요?')) return;
    try { await dispatch(deleteSession({ scheduleId, sessionId })).unwrap(); showSuccessNotification('세션을 삭제했습니다.'); await loadApplications(); }
    catch { showErrorNotification('세션을 삭제하지 못했습니다.'); }
  };
  const approvedCount = applications.filter((application) => application.status === 'approved').length;

  return <section className={styles.sessionManagement} aria-labelledby="session-heading">
    <div className={styles.sectionHeading}><div><p className={styles.sectionLabel}>세션 운영</p><h3 id="session-heading">시간대와 지원자 관리</h3><p>세션을 만들고 접수 순서대로 강사를 검토·최종 배정합니다.</p></div>{canEdit && <button type="button" onClick={openNewSession} className={styles.addButton}>+ 새 세션 등록</button>}</div>
    {status === 'loading' && <p className={styles.loading}>세션을 불러오는 중…</p>}
    {status === 'failed' && <p className={styles.error} role="alert">세션을 불러오지 못했습니다. {error}</p>}
    {status !== 'loading' && sessions.length === 0 && <div className={styles.emptyState}><strong>아직 등록된 세션이 없습니다.</strong><p>먼저 세션 시간과 세션 표시명을 등록해 강사 지원을 받을 수 있습니다.</p>{canEdit && <button type="button" onClick={openNewSession}>첫 세션 등록</button>}</div>}
    <div className={styles.sessionCards}>{sessions.map((session) => <article key={session.id} className={styles.sessionCard}>
      <div className={styles.timeBlock}><span>운영 시간</span><strong>{formatTime(session.startTime)}–{formatTime(session.endTime)}</strong></div>
      <div className={styles.sessionBody}><h4>{session.instructor}</h4><p>{trainingTypeLabel(session.trainingType)}{session.notes ? ` · ${session.notes}` : ' · 메모 없음'}</p></div>
      {(canEdit || canDelete) && <div className={styles.sessionActions}>{canEdit && <button type="button" onClick={() => openEditSession(session)}>수정</button>}{canDelete && <button type="button" onClick={() => void handleDeleteSession(session.id)} className={styles.deleteButton}>삭제</button>}</div>}
    </article>)}</div>

    <section className={styles.applicationManagement} aria-labelledby="application-heading">
      <div className={styles.applicationHeading}><div><p className={styles.sectionLabel}>강사 지원</p><h3 id="application-heading">접수 순서 검토</h3><p>승인된 강사는 일정 전체의 필요 배정 인원을 넘을 수 없습니다.</p></div><strong className={styles.capacity}><span>최종 배정</span>{approvedCount} / {capacity}명</strong></div>
      {applicationError && <p className={styles.error} role="alert">{applicationError}</p>}
      {!applicationError && applications.length === 0 && <p className={styles.applicationEmpty}>아직 접수된 지원이 없습니다.</p>}
      <div className={styles.applicationCards}>{applications.map((application, index) => <article key={application.id} className={styles.applicationCard}>
        <div className={styles.queueNumber}>{index + 1}</div><div className={styles.applicationInfo}><h4>{application.instructor?.username ?? `강사 #${application.instructorId}`}</h4><p>{formatTime(application.session.startTime)}–{formatTime(application.session.endTime)} · {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(application.createdAt))}</p></div><span className={`${styles.applicationStatus} ${styles[`application_${application.status}`]}`}>{applicationStatusLabel(application.status)}</span>
        <div className={styles.applicationActions}>{application.status === 'pending' && <><button type="button" onClick={() => void handleReview(application.id, 'approved')} disabled={reviewingId === application.id} className={styles.approveButton}>배정</button><button type="button" onClick={() => void handleReview(application.id, 'rejected')} disabled={reviewingId === application.id} className={styles.rejectButton}>반려</button></>}{application.status === 'approved' && <button type="button" onClick={() => void handleReview(application.id, 'pending')} disabled={reviewingId === application.id}>배정 해제</button>}{application.status === 'rejected' && <button type="button" onClick={() => void handleReview(application.id, 'pending')} disabled={reviewingId === application.id}>재검토</button>}</div>
      </article>)}</div>
    </section>
    {isFormOpen && <div className={styles.dialogBackdrop} onMouseDown={() => setIsFormOpen(false)}><div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="session-form-title" onMouseDown={(event) => event.stopPropagation()}><SessionForm session={selectedSession} scheduleId={scheduleId} scheduleDate={scheduleDate} scheduleName={scheduleName} onClose={() => setIsFormOpen(false)} /></div></div>}
  </section>;
};

export default SessionManagement;
