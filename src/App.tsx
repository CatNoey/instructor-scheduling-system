// src/App.tsx

import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import type { RootState, AppDispatch } from './store';
import Notifications from './components/Notification/Notification';
import Login from './components/Login/Login';
import ScheduleManagement from './components/ScheduleManagement/ScheduleManagement';
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute';
import { login } from './store/authSlice';
import authService from './services/authService';
import './App.css';
import './styles/global.css';

const App: React.FC = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = authService.getAuthToken();
    if (user && token && !isAuthenticated) {
      dispatch(login({ username: user.username, password: '' }));
    }
  }, [dispatch, isAuthenticated]);

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Notifications />}
        <Routes>
          <Route path="/login" element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          } />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<ScheduleManagement />} />
            {/* Add other protected routes here */}
          </Route>
        </Routes>
        <ToastContainer position="top-right" autoClose={3000} />
      </div>
    </Router>
  );
};

export default App;