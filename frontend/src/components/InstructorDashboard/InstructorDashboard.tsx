// src/components/InstructorDashboard/InstructorDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { fetchAvailableSessions, applyForSession, cancelApplication, fetchInstructorApplications } from '../../store/sessionSlice';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { Session, InstructorApplication } from '../../types';
import styles from './InstructorDashboard.module.css';

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
      } catch (error) {
        showErrorNotification('Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dispatch, user]);

  const handleApply = async (sessionId: number) => {
    try {
      await dispatch(applyForSession(sessionId)).unwrap();
      showSuccessNotification('Application submitted successfully');
      await Promise.all([dispatch(fetchAvailableSessions()).unwrap(), dispatch(fetchInstructorApplications()).unwrap()]);
    } catch (caught) {
      showErrorNotification(caught instanceof Error ? caught.message : 'Failed to submit application');
    }
  };

  const handleCancelApplication = async (applicationId: number) => {
    try {
      await dispatch(cancelApplication(applicationId)).unwrap();
      showSuccessNotification('Application cancelled successfully');
      await Promise.all([dispatch(fetchAvailableSessions()).unwrap(), dispatch(fetchInstructorApplications()).unwrap()]);
    } catch (caught) {
      showErrorNotification(caught instanceof Error ? caught.message : 'Failed to cancel application');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
  };

  if (!user) {
    return <div>You must be logged in to view this page.</div>;
  }

  if (user.role !== 'instructor') {
    return <div>You do not have permission to view this page. Your role is: {user.role}</div>;
  }

  return (
    <div className={styles.instructorDashboard}>
      <h1>Instructor Dashboard</h1>
      <div className={styles.userInfo}>
        <p>Welcome, {user.username}!</p>
        <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
      </div>

      <h2>Available Sessions</h2>
      {loading && <p>Loading available work...</p>}
      {error && <p role="alert">{error}</p>}
      {availableSessions.length === 0 ? (
        <p>No available sessions at the moment.</p>
      ) : (
        <ul className={styles.sessionList}>
          {availableSessions.map((session: Session) => (
            <li key={session.id} className={styles.sessionItem}>
              <div className={styles.sessionInfo}>
                <h3>{session.instructor || `Session #${session.id}`}</h3>
                <p>Date: {new Date(session.startTime).toLocaleDateString()}</p>
                <p>Time: {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}</p>
                <p>Type: {session.trainingType}</p>
              </div>
              <button
                onClick={() => handleApply(session.id)}
                className={styles.applyButton}
                disabled={applyingSessionIds.includes(session.id) || instructorApplications.some((application) => application.sessionId === session.id)}
              >
                {applyingSessionIds.includes(session.id) ? 'Applying...' : 'Apply'}
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>My Applications</h2>
      {instructorApplications.length === 0 ? (
        <p>You haven't applied for any sessions yet.</p>
      ) : (
        <ul className={styles.applicationList}>
          {instructorApplications.map((application: InstructorApplication) => (
            <li key={application.id} className={styles.applicationItem}>
              <div className={styles.applicationInfo}>
                <h3>{application.session.instructor || `Session #${application.session.id}`}</h3>
                <p>Date: {new Date(application.session.startTime).toLocaleDateString()}</p>
                <p>Time: {new Date(application.session.startTime).toLocaleTimeString()} - {new Date(application.session.endTime).toLocaleTimeString()}</p>
                <p>Status: {application.status}</p>
              </div>
              {application.status === 'pending' && (
                <button
                  onClick={() => handleCancelApplication(application.id)}
                  className={styles.cancelButton}
                  disabled={cancellingApplicationIds.includes(application.id)}
                >
                  {cancellingApplicationIds.includes(application.id) ? 'Cancelling...' : 'Cancel'}
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
