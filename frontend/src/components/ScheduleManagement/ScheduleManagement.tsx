// src/components/ScheduleManagement/ScheduleManagement.tsx

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { fetchSchedules } from '../../store/scheduleSlice';
import { logout } from '../../store/authSlice';
import { showErrorNotification } from '../../utils/notifications';
import Calendar from '../Calendar/Calendar';
import ScheduleForm from '../ScheduleForm/ScheduleForm';
import SessionManagement from '../SessionManagement/SessionManagement';
import ScheduleList from '../ScheduleList/ScheduleList';
import { Schedule, TrainingType } from '../../types';
import { businessDateToLocalDate } from '../../utils/dateTime';
import { trainingTypeLabel } from '../../utils/presentation';
import styles from './ScheduleManagement.module.css';

const ScheduleManagement: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { items: schedules, status, error } = useSelector((state: RootState) => state.schedules);
  const { user, permissions } = useSelector((state: RootState) => state.auth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>(undefined);
  const [filters, setFilters] = useState<TrainingType[]>([]);

  const allFilters: TrainingType[] = ['class', 'teacher', 'all_staff', 'remote', 'other'];

  useEffect(() => {
    void dispatch(fetchSchedules());
  }, [dispatch]);

  useEffect(() => {
    if (selectedSchedule && !schedules.some((schedule) => schedule.id === selectedSchedule.id)) setSelectedSchedule(null);
  }, [schedules, selectedSchedule]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  }, []);

  const handleAddSchedule = useCallback(() => {
    if (permissions?.editSchedules) {
      setEditingSchedule(undefined);
      setIsFormOpen(true);
    } else {
      showErrorNotification('일정을 등록할 권한이 없습니다.');
    }
  }, [permissions]);

  const handleEditSchedule = useCallback((schedule: Schedule) => {
    if (permissions?.editSchedules) {
      setEditingSchedule(schedule);
      setIsFormOpen(true);
    } else {
      showErrorNotification('일정을 수정할 권한이 없습니다.');
    }
  }, [permissions]);

  const handleCloseForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingSchedule(undefined);
  }, []);

  const handleScheduleSelect = useCallback((schedule: Schedule) => {
    if (permissions?.viewSessions) {
      setSelectedSchedule(schedule);
    } else {
      showErrorNotification('세션을 조회할 권한이 없습니다.');
    }
  }, [permissions]);

  const handleLogout = useCallback(() => {
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const handleFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const { value, checked } = event.target;
    setFilters(prevFilters => 
      checked 
        ? [...prevFilters, value as TrainingType]
        : prevFilters.filter(filter => filter !== value)
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setFilters(prevFilters => 
      prevFilters.length === allFilters.length ? [] : [...allFilters]
    );
  }, []);

  const filteredSchedules = useMemo(() => 
    schedules.filter(schedule => 
      filters.length === 0 || filters.includes(schedule.trainingType)
    ),
    [schedules, filters]
  );

  const isAllSelected = filters.length === allFilters.length;

  if (!user || !permissions) {
    return <div>로그인이 필요합니다.</div>;
  }

  return (
    <div className={styles.scheduleManagement}>
      <h1>일정 관리</h1>
      <div className={styles.userInfo}>
        <p><strong>{user.username}</strong>님 · 관리자</p>
        <button onClick={handleLogout} className={styles.logoutButton}>로그아웃</button>
      </div>
      
      {permissions.editSchedules && (
        <button onClick={handleAddSchedule} className={styles.addButton}>
          새 일정 등록
        </button>
      )}
      {status === 'loading' && <p className={styles.loading}>일정을 불러오는 중…</p>}
      {status === 'failed' && <p className={styles.error} role="alert">일정을 불러오지 못했습니다. {error}</p>}
      
      {isFormOpen && permissions.editSchedules && (
        <ScheduleForm schedule={editingSchedule} onClose={handleCloseForm} />
      )}

      <div className={styles.filters}>
        <button 
          onClick={handleSelectAll} 
          className={`${styles.selectAllButton} ${isAllSelected ? styles.allSelected : ''}`}
          aria-pressed={isAllSelected}
        >
          {isAllSelected ? '전체 해제' : '전체 선택'}
        </button>
        {allFilters.map(filter => (
          <label key={filter} className={styles.filterLabel}>
            <input
              type="checkbox"
              value={filter}
              onChange={handleFilterChange}
              checked={filters.includes(filter)}
              aria-label={`${trainingTypeLabel(filter)} 일정만 보기`}
            />
            {trainingTypeLabel(filter)}
          </label>
        ))}
      </div>

      <div className={styles.calendarAndList}>
        <Calendar 
          schedules={filteredSchedules} 
          onDateSelect={handleDateSelect} 
          userRole={user.role}
        />
        {selectedDate && (
          <div className={styles.scheduleListContainer}>
            <h2>{selectedDate.toLocaleDateString('ko-KR', { dateStyle: 'full' })} 일정</h2>
            <ScheduleList
              schedules={filteredSchedules.filter(
                schedule => businessDateToLocalDate(schedule.date).toDateString() === selectedDate.toDateString()
              )}
              onEdit={handleEditSchedule}
              onViewSessions={handleScheduleSelect}
              permissions={{
                editSchedules: !!permissions.editSchedules,
                deleteSchedules: !!permissions.deleteSchedules,
                viewSessions: !!permissions.viewSessions,
              }}
            />
          </div>
        )}
      </div>

      {selectedSchedule && permissions.viewSessions && (
        <SessionManagement 
          scheduleId={selectedSchedule.id}
          scheduleDate={selectedSchedule.date}
          canEdit={permissions.editSessions}
          canDelete={permissions.deleteSessions}
          capacity={selectedSchedule.capacity}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;
