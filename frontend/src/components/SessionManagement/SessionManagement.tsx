// src/components/SessionManagement/SessionManagement.tsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchSessions, deleteSession } from '../../store/sessionSlice';
import { Session } from '../../types';
import SessionForm from '../SessionForm/SessionForm';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { applicationStatusLabel, formatTime } from '../../utils/presentation';
import { getScheduleApplications, reviewApplication } from '../../services/api';
import { InstructorApplication } from '../../types';
import styles from './SessionManagement.module.css';

export interface SessionManagementProps {
  scheduleId: number;
  scheduleDate: string;
  canEdit: boolean;
  canDelete: boolean;
  capacity: number;
}

const SessionManagement: React.FC<SessionManagementProps> = ({ scheduleId, scheduleDate, canEdit, canDelete, capacity }) => {
  const dispatch: AppDispatch = useDispatch();
  const { items: sessions, status, error } = useSelector((state: RootState) => state.sessions);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [applications, setApplications] = useState<InstructorApplication[]>([]);
  const [applicationError, setApplicationError] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<number | null>(null);

  useEffect(() => {
    void dispatch(fetchSessions(scheduleId));
  }, [dispatch, scheduleId]);

  useEffect(() => {
    let isCurrent = true;
    const loadApplications = async () => {
      try {
        if (isCurrent) setApplicationError(null);
        const loaded = await getScheduleApplications(scheduleId);
        if (isCurrent) setApplications(loaded);
      } catch (caught) {
        if (isCurrent) setApplicationError(caught instanceof Error ? caught.message : '지원 목록을 불러오지 못했습니다.');
      }
    };
    void loadApplications();
    return () => { isCurrent = false; };
  }, [scheduleId]);

  const handleReview = async (applicationId: number, status: InstructorApplication['status']) => {
    try {
      setReviewingId(applicationId);
      const updated = await reviewApplication(applicationId, status);
      setApplications((current) => current.map((application) => application.id === applicationId ? updated : application));
      showSuccessNotification(status === 'approved' ? '강사를 배정했습니다.' : status === 'rejected' ? '지원을 반려했습니다.' : '지원 상태를 검토 대기로 변경했습니다.');
    } catch (caught) {
      showErrorNotification(caught instanceof Error ? caught.message : '지원 상태를 변경하지 못했습니다.');
    } finally {
      setReviewingId(null);
    }
  };

  const handleAddSession = () => {
    setSelectedSession(undefined);
    setIsFormOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setIsFormOpen(true);
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (window.confirm('이 세션과 연결된 지원 내역도 함께 삭제됩니다. 계속할까요?')) {
      try {
        await dispatch(deleteSession({ scheduleId, sessionId })).unwrap();
        showSuccessNotification('세션을 삭제했습니다.');
      } catch {
        showErrorNotification('세션을 삭제하지 못했습니다.');
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSession(undefined);
  };

  if (status === 'loading') {
    return <p className={styles.loading}>세션을 불러오는 중…</p>;
  }

  if (status === 'failed') {
    return <p className={styles.error} role="alert">세션을 불러오지 못했습니다. {error}</p>;
  }

  return (
    <div className={styles.sessionManagement}>
      <h3>세션</h3>
      {canEdit && <button onClick={handleAddSession} className={styles.addButton}>새 세션 등록</button>}
      {sessions.length === 0 ? (
        <p className={styles.emptyState}>등록된 세션이 없습니다.</p>
      ) : (
        <div className={styles.tableWrap}><table className={styles.sessionTable}>
          <thead>
            <tr>
              <th>시작</th>
              <th>종료</th>
              <th>모집 담당자</th>
              <th>메모</th>
              {(canEdit || canDelete) && <th>관리</th>}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session: Session) => (
              <tr key={session.id}>
                      <td>{formatTime(session.startTime)}</td>
                      <td>{formatTime(session.endTime)}</td>
                <td>{session.instructor}</td>
                <td>{session.notes}</td>
                {(canEdit || canDelete) && (
                  <td>
                    {canEdit && (
                      <button onClick={() => handleEditSession(session)} className={styles.editButton}>
                        수정
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDeleteSession(session.id)} className={styles.deleteButton}>
                        삭제
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table></div>
      )}
      <section className={styles.applicationManagement} aria-labelledby="application-heading">
        <div className={styles.applicationHeading}>
          <div>
            <h3 id="application-heading">강사 지원 관리</h3>
            <p>접수 순서대로 검토합니다. 승인된 강사는 일정 전체의 필요 배정 인원을 넘을 수 없습니다.</p>
          </div>
          <strong className={styles.capacity}>{applications.filter((application) => application.status === 'approved').length} / {capacity}명 배정</strong>
        </div>
        {applicationError && <p className={styles.error} role="alert">{applicationError}</p>}
        {!applicationError && applications.length === 0 && <p className={styles.emptyState}>접수된 지원이 없습니다.</p>}
        {applications.length > 0 && <div className={styles.tableWrap}><table className={styles.applicationTable}>
          <thead><tr><th>순서</th><th>지원자</th><th>세션</th><th>지원 시각</th><th>상태</th><th>관리</th></tr></thead>
          <tbody>{applications.map((application, index) => <tr key={application.id}>
            <td>{index + 1}</td>
            <td>{application.instructor?.username ?? `강사 #${application.instructorId}`}</td>
            <td>{formatTime(application.session.startTime)}–{formatTime(application.session.endTime)}</td>
            <td>{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(application.createdAt))}</td>
            <td>{applicationStatusLabel(application.status)}</td>
            <td className={styles.applicationActions}>
              {application.status === 'pending' && <><button type="button" onClick={() => void handleReview(application.id, 'approved')} disabled={reviewingId === application.id} className={styles.approveButton}>배정</button><button type="button" onClick={() => void handleReview(application.id, 'rejected')} disabled={reviewingId === application.id} className={styles.rejectButton}>반려</button></>}
              {application.status === 'approved' && <button type="button" onClick={() => void handleReview(application.id, 'pending')} disabled={reviewingId === application.id} className={styles.pendingButton}>배정 해제</button>}
              {application.status === 'rejected' && <button type="button" onClick={() => void handleReview(application.id, 'pending')} disabled={reviewingId === application.id} className={styles.pendingButton}>재검토</button>}
            </td>
          </tr>)}</tbody>
        </table></div>}
      </section>
      {isFormOpen && (
        <SessionForm
          session={selectedSession}
          scheduleId={scheduleId}
          scheduleDate={scheduleDate}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default SessionManagement;
