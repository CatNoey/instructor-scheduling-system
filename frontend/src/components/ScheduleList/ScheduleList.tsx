// src/components/ScheduleList/ScheduleList.tsx

import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { deleteSchedule } from '../../store/scheduleSlice';
import { Schedule } from '../../types';
import { businessDateToLocalDate } from '../../utils/dateTime';
import { showErrorNotification } from '../../utils/notifications';
import styles from './ScheduleList.module.css';

interface ScheduleListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onViewSessions: (schedule: Schedule) => void;
  permissions: {
    editSchedules: boolean;
    deleteSchedules: boolean;
    viewSessions: boolean;
  };
}

const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  onEdit,
  onViewSessions,
  permissions,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const { isDeleting } = useSelector((state: RootState) => state.schedules);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterRegion, setFilterRegion] = useState('');

  const filteredSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const matchesSearch = 
        schedule.institutionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        schedule.region.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === '' || schedule.trainingType === filterType;
      const matchesDate = filterDate === '' || schedule.date.includes(filterDate);
      const matchesRegion = filterRegion === '' || schedule.region.toLowerCase().includes(filterRegion.toLowerCase());
      return matchesSearch && matchesFilter && matchesDate && matchesRegion;
    });
  }, [schedules, searchTerm, filterType, filterDate, filterRegion]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = event.target;
    switch (name) {
      case 'type':
        setFilterType(value);
        break;
      case 'date':
        setFilterDate(value);
        break;
      case 'region':
        setFilterRegion(value);
        break;
    }
  };

  const handleDelete = async (scheduleId: number) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      try {
        await dispatch(deleteSchedule(scheduleId)).unwrap();
      } catch (error) {
        showErrorNotification(error instanceof Error ? error.message : 'Unable to delete the schedule');
      }
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterDate('');
    setFilterRegion('');
  };

  return (
    <div className={styles.scheduleList}>
      <div className={styles.filterContainer}>
        <input
          type="text"
          placeholder="Search by institution or region"
          value={searchTerm}
          onChange={handleSearchChange}
          className={styles.searchInput}
        />
        <select
          name="type"
          value={filterType}
          onChange={handleFilterChange}
          className={styles.filterSelect}
        >
          <option value="">All Types</option>
          <option value="class">Class</option>
          <option value="teacher">Teacher</option>
          <option value="all_staff">All Staff</option>
          <option value="remote">Remote</option>
          <option value="other">Other</option>
        </select>
        <input
          type="date"
          name="date"
          value={filterDate}
          onChange={handleFilterChange}
          className={styles.filterInput}
        />
        <input
          type="text"
          name="region"
          placeholder="Filter by region"
          value={filterRegion}
          onChange={handleFilterChange}
          className={styles.filterInput}
        />
        <button onClick={handleClearFilters} className={styles.clearFiltersButton}>
          Clear Filters
        </button>
      </div>

      {filteredSchedules.map((schedule) => (
        <div key={schedule.id} className={styles.scheduleItem}>
          <h3>{businessDateToLocalDate(schedule.date).toLocaleDateString()}</h3>
          <p>Institution: {schedule.institutionName}</p>
          <p>Region: {schedule.region}</p>
          <p>Capacity: {schedule.capacity}</p>
          <p>Type: {schedule.trainingType}</p>
          <p>Status: {schedule.status}</p>
          <div className={styles.buttonContainer}>
            {permissions.editSchedules && (
              <button onClick={() => onEdit(schedule)} className={styles.editButton}>Edit</button>
            )}
            {permissions.deleteSchedules && (
              <button 
                onClick={() => handleDelete(schedule.id)} 
                disabled={isDeleting}
                className={styles.deleteButton}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            )}
            {permissions.viewSessions && (
              <button onClick={() => onViewSessions(schedule)} className={styles.viewSessionsButton}>
                View Sessions
              </button>
            )}
          </div>
        </div>
      ))}
      
      {filteredSchedules.length === 0 && (
        <p className={styles.noResults}>No schedules found matching your criteria.</p>
      )}
    </div>
  );
};

export default ScheduleList;
