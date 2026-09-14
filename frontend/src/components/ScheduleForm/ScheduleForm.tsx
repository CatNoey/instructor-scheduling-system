// src/components/ScheduleForm/ScheduleForm.tsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addSchedule, updateSchedule } from '../../store/scheduleSlice';
import { Schedule, ScheduleInput } from '../../types';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import { scheduleStatusLabel, trainingTypeLabel } from '../../utils/presentation';
import styles from './ScheduleForm.module.css';

interface ScheduleFormProps {
  schedule?: Schedule;
  onClose: () => void;
}

const initialFormState: ScheduleInput = {
  date: (() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  })(),
  institutionName: '',
  region: '',
  capacity: 0,
  trainingType: 'class',
  status: 'open',
};
const inputFromSchedule = (schedule: Schedule): ScheduleInput => ({
  date: schedule.date,
  institutionName: schedule.institutionName,
  region: schedule.region,
  capacity: schedule.capacity,
  trainingType: schedule.trainingType,
  status: schedule.status,
});

const ScheduleForm: React.FC<ScheduleFormProps> = ({ schedule, onClose }) => {
  const [formData, setFormData] = useState<ScheduleInput>(
    schedule ? inputFromSchedule(schedule) : initialFormState
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Schedule, string>>>({});
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (schedule) {
      setFormData(inputFromSchedule(schedule));
    }
  }, [schedule]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Schedule, string>> = {};
    if (!formData.date) newErrors.date = '일정을 선택해 주세요.';
    if (!formData.institutionName) newErrors.institutionName = '기관명을 입력해 주세요.';
    if (!formData.region) newErrors.region = '지역을 입력해 주세요.';
    if (formData.capacity <= 0) newErrors.capacity = '필요 배정 인원은 1명 이상이어야 합니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'capacity' ? parseInt(value, 10) : value,
    }));
  };

  const { isAdding, isUpdating } = useSelector((state: RootState) => state.schedules);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        if (schedule) {
          await dispatch(updateSchedule({ ...formData, id: schedule.id })).unwrap();
          showSuccessNotification('일정을 수정했습니다.');
        } else {
          await dispatch(addSchedule(formData)).unwrap();
          showSuccessNotification('일정을 등록했습니다.');
        }
        onClose();
      } catch (error) {
        console.error('Error submitting form:', error);
        showErrorNotification('일정을 저장하지 못했습니다. 입력 내용을 확인해 주세요.');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.scheduleForm}>
      <h2>{schedule ? '일정 수정' : '새 일정 등록'}</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="date">업무 날짜</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        {errors.date && <span className={styles.error} role="alert">{errors.date}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="institutionName">기관명</label>
        <input
          type="text"
          id="institutionName"
          name="institutionName"
          value={formData.institutionName}
          onChange={handleChange}
          required
        />
        {errors.institutionName && <span className={styles.error} role="alert">{errors.institutionName}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="region">지역</label>
        <input
          type="text"
          id="region"
          name="region"
          value={formData.region}
          onChange={handleChange}
          required
        />
        {errors.region && <span className={styles.error} role="alert">{errors.region}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="capacity">필요 배정 인원</label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          value={formData.capacity}
          onChange={handleChange}
          required
          min="1"
        />
        {errors.capacity && <span className={styles.error} role="alert">{errors.capacity}</span>}
        <p className={styles.helpText}>이 일정에서 관리자가 최종 승인할 수 있는 강사 수입니다. 신청은 접수 순서대로 검토할 수 있습니다.</p>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="trainingType">교육 유형</label>
        <select
          id="trainingType"
          name="trainingType"
          value={formData.trainingType}
          onChange={handleChange}
          required
        >
          {(['class', 'teacher', 'all_staff', 'remote', 'other'] as const).map((type) => <option key={type} value={type}>{trainingTypeLabel(type)}</option>)}
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="status">상태</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
        >
          {(['open', 'closed', 'adjusted'] as const).map((status) => <option key={status} value={status}>{scheduleStatusLabel(status)}</option>)}
        </select>
      </div>

      <div className={styles.formActions}>
        <button type="submit" disabled={isAdding || isUpdating}>
          {isAdding || isUpdating ? '저장 중…' : schedule ? '수정 저장' : '일정 등록'}
        </button>
        <button type="button" onClick={onClose} disabled={isAdding || isUpdating}>취소</button>
      </div>
    </form>
  );
};

export default ScheduleForm;
