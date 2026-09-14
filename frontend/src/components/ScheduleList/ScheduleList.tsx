// src/components/ScheduleList/ScheduleList.tsx

import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { deleteSchedule } from '../../store/scheduleSlice';
import { Schedule } from '../../types';
import { showErrorNotification } from '../../utils/notifications';
import { formatBusinessDate, scheduleStatusLabel, trainingTypeLabel } from '../../utils/presentation';
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
    if (window.confirm('이 일정과 연결된 세션을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        await dispatch(deleteSchedule(scheduleId)).unwrap();
      } catch (error) {
        showErrorNotification(error instanceof Error ? error.message : '일정을 삭제하지 못했습니다.');
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
          placeholder="기관명 또는 지역 검색"
          aria-label="기관명 또는 지역 검색"
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
          <option value="">전체 교육 유형</option>
          {(['class', 'teacher', 'all_staff', 'remote', 'other'] as const).map((type) => <option key={type} value={type}>{trainingTypeLabel(type)}</option>)}
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
          placeholder="지역으로 필터"
          aria-label="지역으로 필터"
          value={filterRegion}
          onChange={handleFilterChange}
          className={styles.filterInput}
        />
        <button onClick={handleClearFilters} className={styles.clearFiltersButton}>
          필터 초기화
        </button>
      </div>

      {filteredSchedules.map((schedule) => (
        <div key={schedule.id} className={styles.scheduleItem}>
          <h3>{formatBusinessDate(schedule.date)}</h3>
          <p><span>기관</span>{schedule.institutionName}</p>
          <p><span>지역</span>{schedule.region}</p>
          <p><span>입력 정원</span>{schedule.capacity}명</p>
          <p><span>교육 유형</span>{trainingTypeLabel(schedule.trainingType)}</p>
          <p><span>상태</span>{scheduleStatusLabel(schedule.status)}</p>
          <div className={styles.buttonContainer}>
            {permissions.editSchedules && (
              <button onClick={() => onEdit(schedule)} className={styles.editButton}>수정</button>
            )}
            {permissions.deleteSchedules && (
              <button 
                onClick={() => handleDelete(schedule.id)} 
                disabled={isDeleting}
                className={styles.deleteButton}
              >
                {isDeleting ? '삭제 중…' : '삭제'}
              </button>
            )}
            {permissions.viewSessions && (
              <button onClick={() => onViewSessions(schedule)} className={styles.viewSessionsButton}>
                세션 보기
              </button>
            )}
          </div>
        </div>
      ))}
      
      {filteredSchedules.length === 0 && (
        <p className={styles.noResults}>조건에 맞는 일정이 없습니다.</p>
      )}
    </div>
  );
};

export default ScheduleList;
