//src/components/InstructorDashboard/InstructorDashboard.tsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { logout } from '../../store/authSlice';
import { fetchAvailableSessions, applyForSession, cancelApplication } from '../../store/sessionSlice';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { Session, InstructorApplication } from '../../types';
import styles from './InstructorDashboard.module.css';

const InstructorDashboard: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state: RootState) => state.auth);
  const { availableSessions, instructorApplications, status } = useSelector((state: RootState) => state.sessions);

  useEffect(() => {
    dispatch(fetchAvailableSessions());
  }, [dispatch]);

  const handleApply = async (sessionId: string) => {
    try {
      await dispatch(applyForSession(sessionId)).unwrap();
      showSuccessNotification('Application submitted successfully');
    } catch (error) {
      showErrorNotification('Failed to submit application');
    }
  };

  const handleCancelApplication = async (applicationId: string) => {
    try {
      await dispatch(cancelApplication(applicationId)).unwrap();
      showSuccessNotification('Application cancelled successfully');
    } catch (error) {
      showErrorNotification('Failed to cancel application');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!user) {
    return <div>You must be logged in to view this page.</div>;
  }

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className={styles.instructorDashboard}>
      <h1>Instructor Dashboard</h1>
      <div className={styles.userInfo}>
        <p>Welcome, {user.username}!</p>
        <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
      </div>

      <h2>Available Sessions</h2>
      <ul className={styles.sessionList}>
        {availableSessions.map(session => (
          <li key={session.id} className={styles.sessionItem}>
            <div className={styles.sessionInfo}>
              <h3>{session.testName}</h3>
              <p>Date: {new Date(session.startTime).toLocaleDateString()}</p>
              <p>Time: {new Date(session.startTime).toLocaleTimeString()} - {new Date(session.endTime).toLocaleTimeString()}</p>
              <p>Type: {session.trainingType}</p>
            </div>
            <button onClick={() => handleApply(session.id)} className={styles.applyButton}>Apply</button>
          </li>
        ))}
      </ul>

      <h2>My Applications</h2>
      <ul className={styles.applicationList}>
        {instructorApplications.map(application => (
          <li key={application.id} className={styles.applicationItem}>
            <div className={styles.applicationInfo}>
              <h3>{application.session.testName}</h3>
              <p>Date: {new Date(application.session.startTime).toLocaleDateString()}</p>
              <p>Status: {application.status}</p>
            </div>
            {application.status === 'pending' && (
              <button onClick={() => handleCancelApplication(application.id)} className={styles.cancelButton}>Cancel</button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InstructorDashboard;