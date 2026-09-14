/* src/components/Login/Login.tsx */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login, clearError } from '../../store/authSlice';
import { AppDispatch, RootState } from '../../store';
import styles from './Login.module.css';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await dispatch(login({ username, password })).unwrap();
    } catch {
      // The slice stores the normalized API message for the form to display.
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <p className={styles.eyebrow}>강사 일정 관리</p>
        <h1 className={styles.loginTitle}>로그인</h1>
        <p className={styles.description}>계정 정보를 입력해 주세요.</p>
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          {error && <div className={styles.errorMessage} role="alert">{error}</div>}
          <div className={styles.formGroup}>
            <input
              type="text"
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              placeholder="아이디"
              aria-label="아이디"
            />
          </div>
          <div className={styles.formGroup}>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="비밀번호"
              aria-label="비밀번호"
            />
          </div>
          <button type="submit" disabled={loading} className={styles.loginButton}>
        {loading ? '로그인 중…' : '로그인'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
