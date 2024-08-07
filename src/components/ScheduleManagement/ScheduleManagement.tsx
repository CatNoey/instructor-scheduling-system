// src/components/ScheduleManagement/ScheduleManagement.tsx

import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { fetchSchedules } from '../../store/scheduleSlice';
import { logout } from '../../store/authSlice';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import Calendar from '../Calendar/Calendar';
import ScheduleForm from '../ScheduleForm/ScheduleForm';
import SessionManagement from '../SessionManagement/SessionManagement';
import ScheduleList from '../ScheduleList/ScheduleList';
import { Schedule } from '../../types';
import styles from './ScheduleManagement.module.css';

const ScheduleManagement: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { items: schedules, status } = useSelector((state: RootState) => state.schedules);
  const { user, permissions } = useSelector((state: RootState) => state.auth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>(undefined);
  const [filters, setFilters] = useState<string[]>([]);

  const allFilters = ['class', 'teacher', 'all_staff', 'remote', 'other'];

  useEffect(() => {
    dispatch(fetchSchedules());
  }, [dispatch]);

  const handleDateSelect = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedSchedule(null);
  }, []);

  const handleAddSchedule = useCallback(() => {
    if (permissions?.editSchedules) {
      setEditingSchedule(undefined);
      setIsFormOpen(true);
    } else {
      showErrorNotification('You do not have permission to add schedules');
    }
  }, [permissions]);

  const handleEditSchedule = useCallback((schedule: Schedule) => {
    if (permissions?.editSchedules) {
      setEditingSchedule(schedule);
      setIsFormOpen(true);
    } else {
      showErrorNotification('You do not have permission to edit schedules');
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
      showErrorNotification('You do not have permission to view sessions');
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
        ? [...prevFilters, value]
        : prevFilters.filter(filter => filter !== value)
    );
  }, []);

  const handleSelectAll = useCallback(() => {
    setFilters(filters.length === allFilters.length ? [] : allFilters);
  }, [filters]);

  const filteredSchedules = schedules.filter(schedule => 
    filters.length === 0 || filters.includes(schedule.trainingType)
  );

  if (!user || !permissions) {
    return <div>You must be logged in to view this page.</div>;
  }

  if (status === 'loading') {
    return <div>Loading schedules...</div>;
  }

  return (
    <div className={styles.scheduleManagement}>
      <h1>Schedule Management</h1>
      <div className={styles.userInfo}>
        <p>Welcome, {user.username}! ({user.role})</p>
        <button onClick={handleLogout} className={styles.logoutButton}>Logout</button>
      </div>
      
      {permissions.editSchedules && (
        <button onClick={handleAddSchedule} className={styles.addButton}>
          Add New Schedule
        </button>
      )}
      
      {isFormOpen && permissions.editSchedules && (
        <ScheduleForm schedule={editingSchedule} onClose={handleCloseForm} />
      )}

      <div className={styles.filters}>
        <button onClick={handleSelectAll} className={styles.selectAllButton}>
          {filters.length === allFilters.length ? 'Deselect All' : 'Select All'}
        </button>
        {allFilters.map(filter => (
          <label key={filter}>
            <input
              type="checkbox"
              value={filter}
              onChange={handleFilterChange}
              checked={filters.includes(filter)}
            />
            {filter.charAt(0).toUpperCase() + filter.slice(1).replace('_', ' ')}
          </label>
        ))}
      </div>

      <div className={styles.calendarAndList}>
        <Calendar 
          schedules={filteredSchedules} 
          onDateSelect={handleDateSelect} 
          userRole={user.role}
          canViewTeamLeaderSchedules={permissions.viewTeamLeaderSchedules}
        />
        {selectedDate && (
          <div className={styles.scheduleListContainer}>
            <h2>Schedules for {selectedDate.toDateString()}</h2>
            <ScheduleList
              schedules={filteredSchedules.filter(
                schedule => new Date(schedule.date).toDateString() === selectedDate.toDateString()
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
          canEdit={permissions.editSessions}
          canDelete={permissions.deleteSessions}
          canApply={permissions.applyToSessions}
        />
      )}
    </div>
  );
};

export default ScheduleManagement;