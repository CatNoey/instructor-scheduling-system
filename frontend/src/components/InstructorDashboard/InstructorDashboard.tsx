// src/components/InstructorDashboard/InstructorDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { fetchAvailableSessions, applyForSession, cancelApplication, fetchInstructorApplications } from '../../store/sessionSlice';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { Session, InstructorApplication } from '../../types';
import styles from './InstructorDashboard.module.css';
import { applicationStatusLabel, formatTime, trainingTypeLabel } from '../../utils/presentation';
import Notifications from '../Notification/Notification';

const InstructorDashboard: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { user } = useSelector((state: RootState) => state.auth);
  const { availableSessions, instructorApplications, applyingSessionIds, cancellingApplicationIds, error } = useSelector((state: RootState) => state.sessions);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          dispatch(fetchAvailableSessions()).unwrap(),
          dispatch(fetchInstructorApplications()).unwrap(),
        ]);
      } catch {
        showErrorNotification('업무 정보를 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, user]);

  const handleApply = async (sessionId: number) => {
    try {
      await dispatch(applyForSession(sessionId)).unwrap();
      showSuccessNotification('지원했습니다. 내 지원 내역에서 확인할 수 있습니다.');
      await Promise.all([dispatch(fetchAvailableSessions()).unwrap(), dispatch(fetchInstructorApplications()).unwrap()]);
    } catch (caught) {
      showErrorNotification(caught instanceof Error ? caught.message : '지원하지 못했습니다.');
    }
  };

  const handleCancelApplication = async (applicationId: number) => {
    try {
      await dispatch(cancelApplication(applicationId)).unwrap();
      showSuccessNotification('지원을 취소했습니다.');
      await Promise.all([dispatch(fetchAvailableSessions()).unwrap(), dispatch(fetchInstructorApplications()).unwrap()]);
    } catch (caught) {
      showErrorNotification(caught instanceof Error ? caught.message : '지원을 취소하지 못했습니다.');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!user) {
    return <div>로그인이 필요합니다.</div>;
  }

  if (user.role !== 'instructor') {
    return <div>강사 계정으로만 이 화면을 볼 수 있습니다.</div>;
  }

  return (
    <div className={styles.instructorDashboard}>
      <h1>강사 대시보드</h1>
      <div className={styles.userInfo}>
        <p><strong>{user.username}</strong>님, 반갑습니다.</p>
        <div className={styles.headerActions}><Notifications /><button onClick={handleLogout} className={styles.logoutButton}>로그아웃</button></div>
      </div>

      <h2>지원 가능한 세션</h2>
      {loading && <p className={styles.loading}>지원 가능한 세션을 불러오는 중…</p>}
      {error && <p role="alert">{error}</p>}
      {availableSessions.length === 0 ? (
        <p className={styles.emptyState}>현재 지원 가능한 세션이 없습니다.</p>
      ) : (
        <ul className={styles.sessionList}>
          {availableSessions.map((session: Session) => (
            <li key={session.id} className={styles.sessionItem}>
              <div className={styles.sessionInfo}>
                <h3>{session.instructor || `세션 #${session.id}`}</h3>
                {session.schedule && <p><span>근무지</span>{session.schedule.institutionName} · {session.schedule.region}</p>}
                <p><span>일시</span>{new Date(session.startTime).toLocaleDateString('ko-KR')} · {formatTime(session.startTime)}–{formatTime(session.endTime)}</p>
                <p><span>교육 유형</span>{trainingTypeLabel(session.trainingType)}</p>
              </div>
              <button
                onClick={() => handleApply(session.id)}
                className={styles.applyButton}
                disabled={applyingSessionIds.includes(session.id) || instructorApplications.some((application) => application.sessionId === session.id)}
              >
                {applyingSessionIds.includes(session.id) ? '지원 중…' : '지원하기'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>내 지원 내역</h2>
      {instructorApplications.length === 0 ? (
        <p className={styles.emptyState}>아직 지원한 세션이 없습니다.</p>
      ) : (
        <ul className={styles.applicationList}>
          {instructorApplications.map((application: InstructorApplication) => (
            <li key={application.id} className={styles.applicationItem}>
              <div className={styles.applicationInfo}>
                <h3>{application.session.instructor || `세션 #${application.session.id}`}</h3>
                {application.session.schedule && <p><span>근무지</span>{application.session.schedule.institutionName} · {application.session.schedule.region}</p>}
                <p><span>일시</span>{new Date(application.session.startTime).toLocaleDateString('ko-KR')} · {formatTime(application.session.startTime)}–{formatTime(application.session.endTime)}</p>
                <p><span>상태</span>{applicationStatusLabel(application.status)}</p>
              </div>
              {application.status === 'pending' && (
                <button
                  onClick={() => handleCancelApplication(application.id)}
                  className={styles.cancelButton}
                  disabled={cancellingApplicationIds.includes(application.id)}
                >
                  {cancellingApplicationIds.includes(application.id) ? '취소 중…' : '지원 취소'}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default InstructorDashboard;
