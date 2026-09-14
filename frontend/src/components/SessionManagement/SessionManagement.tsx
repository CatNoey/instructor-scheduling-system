// src/components/SessionManagement/SessionManagement.tsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchSessions, deleteSession } from '../../store/sessionSlice';
import { Session } from '../../types';
import SessionForm from '../SessionForm/SessionForm';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { formatTime } from '../../utils/presentation';
import styles from './SessionManagement.module.css';

export interface SessionManagementProps {
  scheduleId: number;
  scheduleDate: string;
  canEdit: boolean;
  canDelete: boolean;
}

const SessionManagement: React.FC<SessionManagementProps> = ({ scheduleId, scheduleDate, canEdit, canDelete }) => {
  const dispatch: AppDispatch = useDispatch();
  const { items: sessions, status, error } = useSelector((state: RootState) => state.sessions);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    void dispatch(fetchSessions(scheduleId));
  }, [dispatch, scheduleId]);

  const handleAddSession = () => {
    setSelectedSession(undefined);
    setIsFormOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setIsFormOpen(true);
  };

  const handleDeleteSession = async (sessionId: number) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
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
              <th>담당 강사</th>
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
