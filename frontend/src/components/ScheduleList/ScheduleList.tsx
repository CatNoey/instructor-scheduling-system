// src/components/ScheduleList/ScheduleList.tsx

import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { deleteSchedule } from '../../store/scheduleSlice';
import { Schedule } from '../../types';
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

const ITEMS_PER_PAGE = 10;

const ScheduleList: React.FC<ScheduleListProps> = ({
  schedules,
  onEdit,
  onViewSessions,
  permissions,
}) => {
  const dispatch: AppDispatch = useDispatch();
  const { isDeleting } = useSelector((state: RootState) => state.schedules);

  const [currentPage, setCurrentPage] = useState(1);
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

  const indexOfLastItem = currentPage * ITEMS_PER_PAGE;
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE;
  const currentItems = filteredSchedules.slice(indexOfFirstItem, indexOfLastItem);

  const totalPages = Math.ceil(filteredSchedules.length / ITEMS_PER_PAGE);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
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
    setCurrentPage(1);
  };

  const handleDelete = (scheduleId: string) => {
    if (window.confirm('Are you sure you want to delete this schedule?')) {
      dispatch(deleteSchedule(scheduleId));
    }
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterType('');
    setFilterDate('');
    setFilterRegion('');
    setCurrentPage(1);
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

      {currentItems.map((schedule) => (
        <div key={schedule.id} className={styles.scheduleItem}>
          <h3>{new Date(schedule.date).toLocaleDateString()}</h3>
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
      
      {currentItems.length === 0 && (
        <p className={styles.noResults}>No schedules found matching your criteria.</p>
      )}

      <div className={styles.pagination}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNumber) => (
          <button
            key={pageNumber}
            onClick={() => handlePageChange(pageNumber)}
            className={currentPage === pageNumber ? styles.activePage : ''}
          >
            {pageNumber}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ScheduleList;