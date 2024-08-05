// src/components/ScheduleForm/ScheduleForm.tsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { addSchedule, updateSchedule } from '../../store/scheduleSlice';
import { Schedule } from '../../types';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import styles from './ScheduleForm.module.css';

interface ScheduleFormProps {
  schedule?: Schedule;
  onClose: () => void;
}

const initialFormState: Omit<Schedule, 'id' | 'createdBy'> = {
  date: new Date().toISOString().split('T')[0], // Store as YYYY-MM-DD string
  institutionName: '',
  region: '',
  capacity: 0,
  trainingType: 'class',
  status: 'open',
};

const ScheduleForm: React.FC<ScheduleFormProps> = ({ schedule, onClose }) => {
  const [formData, setFormData] = useState<Omit<Schedule, 'id' | 'createdBy'>>(
    schedule ? { ...schedule } : initialFormState
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Schedule, string>>>({});
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (schedule) {
      setFormData({ ...schedule });
    }
  }, [schedule]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Schedule, string>> = {};
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.institutionName) newErrors.institutionName = 'Institution is required';
    if (!formData.region) newErrors.region = 'Region is required';
    if (formData.capacity <= 0) newErrors.capacity = 'Capacity must be greater than 0';
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
          await dispatch(updateSchedule({ ...formData, id: schedule.id, createdBy: schedule.createdBy })).unwrap();
          showSuccessNotification('Schedule updated successfully');
        } else {
          await dispatch(addSchedule(formData)).unwrap();
          showSuccessNotification('Schedule created successfully');
        }
        onClose();
      } catch (error) {
        console.error('Error submitting form:', error);
        showErrorNotification('An error occurred while saving the schedule');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.scheduleForm}>
      <h2>{schedule ? 'Edit Schedule' : 'Add New Schedule'}</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="date">Date:</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
        {errors.date && <span className="error">{errors.date}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="institutionName">Institution:</label>
        <input
          type="text"
          id="institutionName"
          name="institutionName"
          value={formData.institutionName}
          onChange={handleChange}
          required
        />
        {errors.institutionName && <span className="error">{errors.institutionName}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="region">Region:</label>
        <input
          type="text"
          id="region"
          name="region"
          value={formData.region}
          onChange={handleChange}
          required
        />
        {errors.region && <span className="error">{errors.region}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="capacity">Capacity:</label>
        <input
          type="number"
          id="capacity"
          name="capacity"
          value={formData.capacity}
          onChange={handleChange}
          required
          min="1"
        />
        {errors.capacity && <span className="error">{errors.capacity}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="trainingType">Training Type:</label>
        <select
          id="trainingType"
          name="trainingType"
          value={formData.trainingType}
          onChange={handleChange}
          required
        >
          <option value="class">Class</option>
          <option value="teacher">Teacher</option>
          <option value="all_staff">All Staff</option>
          <option value="remote">Remote</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="status">Status:</label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
        >
          <option value="open">Open</option>
          <option value="closed">Closed</option>
          <option value="adjusted">Adjusted</option>
        </select>
      </div>

      <div className={styles.formActions}>
        <button type="submit" disabled={isAdding || isUpdating}>
          {isAdding || isUpdating ? 'Saving...' : (schedule ? 'Update' : 'Create')} Schedule
        </button>
        <button type="button" onClick={onClose} disabled={isAdding || isUpdating}>Cancel</button>
      </div>
    </form>
  );
};

export default ScheduleForm;