import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { RootState } from './store';
import Login from './components/Login/Login';
import ScheduleManagement from './components/ScheduleManagement/ScheduleManagement';
import InstructorDashboard from './components/InstructorDashboard/InstructorDashboard';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { AppDispatch } from './store';
import { expireSession } from './store/authSlice';
import { resetSchedules } from './store/scheduleSlice';
import { resetSessions } from './store/sessionSlice';
import { clearAllNotifications } from './store/notificationSlice';
import authService from './services/authService';
import { UNAUTHORIZED_EVENT } from './services/api';
import './App.css';
import './styles/global.css';

const App: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    const resetUserData = () => {
      dispatch(resetSchedules());
      dispatch(resetSessions());
      dispatch(clearAllNotifications());
    };
    const handleUnauthorized = () => {
      void authService.logout();
      resetUserData();
      dispatch(expireSession());
    };
    window.addEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
    if (!isAuthenticated) resetUserData();
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, handleUnauthorized);
  }, [dispatch, isAuthenticated]);
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={
              user?.role === 'instructor' ? <InstructorDashboard /> : <ScheduleManagement />
            } />
            {/* Add other protected routes here */}
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
};

export default App;
