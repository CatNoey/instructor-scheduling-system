// src/components/SessionManagement/SessionManagement.tsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { fetchSessions, deleteSession } from '../../store/sessionSlice';
import { Session } from '../../types';
import SessionForm from '../SessionForm/SessionForm';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import styles from './SessionManagement.module.css';

export interface SessionManagementProps {
  scheduleId: string;
  canEdit: boolean;
  canDelete: boolean;
  canApply: boolean;
}

const SessionManagement: React.FC<SessionManagementProps> = ({ scheduleId, canEdit, canDelete, canApply }) => {
  const dispatch: AppDispatch = useDispatch();
  const { items: sessions, status, error } = useSelector((state: RootState) => state.sessions);
  const [selectedSession, setSelectedSession] = useState<Session | undefined>(undefined);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchSessions(scheduleId));
  }, [dispatch, scheduleId]);

  const handleAddSession = () => {
    setSelectedSession(undefined);
    setIsFormOpen(true);
  };

  const handleEditSession = (session: Session) => {
    setSelectedSession(session);
    setIsFormOpen(true);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await dispatch(deleteSession({ scheduleId, sessionId })).unwrap();
        showSuccessNotification('Session deleted successfully');
      } catch (error) {
        showErrorNotification('Failed to delete session');
      }
    }
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedSession(undefined);
  };

  if (status === 'loading') {
    return <div>Loading sessions...</div>;
  }

  if (status === 'failed') {
    return <div>Error loading sessions: {error}</div>;
  }

  return (
    <div className={styles.sessionManagement}>
      <h3>Sessions</h3>
      {canEdit && <button onClick={handleAddSession} className={styles.addButton}>Add Session</button>}
      {sessions.length === 0 ? (
        <p>No sessions available for this schedule.</p>
      ) : (
        <table className={styles.sessionTable}>
          <thead>
            <tr>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Instructor</th>
              <th>Notes</th>
              {(canEdit || canDelete) && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td>{session.startTime}</td>
                <td>{session.endTime}</td>
                <td>{session.instructor}</td>
                <td>{session.notes}</td>
                {(canEdit || canDelete) && (
                  <td>
                    {canEdit && (
                      <button onClick={() => handleEditSession(session)} className={styles.editButton}>
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button onClick={() => handleDeleteSession(session.id)} className={styles.deleteButton}>
                        Delete
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {isFormOpen && (
        <SessionForm
          session={selectedSession}
          scheduleId={scheduleId}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
};

export default SessionManagement;