// src/components/SessionForm/SessionForm.tsx

import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { addSession, updateSession } from '../../store/sessionSlice';
import { Session, TrainingType } from '../../types';
import { showSuccessNotification, showErrorNotification } from '../../utils/notifications';
import styles from './SessionForm.module.css';

interface SessionFormProps {
  session?: Session;
  scheduleId: string;
  onClose: () => void;
}

const initialFormState: Omit<Session, 'id'> = {
  scheduleId: '',
  startTime: '',
  endTime: '',
  instructor: '',
  notes: '',
  trainingType: 'class' as TrainingType, // Add this line
};

const SessionForm: React.FC<SessionFormProps> = ({ session, scheduleId, onClose }) => {
  const [formData, setFormData] = useState<Omit<Session, 'id'>>(
    session ? { ...session } : { ...initialFormState, scheduleId }
  );
  const [errors, setErrors] = useState<Partial<Record<keyof Session, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (session) {
      setFormData({ ...session });
    } else {
      setFormData(prev => ({ ...prev, scheduleId }));
    }
  }, [session, scheduleId]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof Session, string>> = {};
    if (!formData.startTime) newErrors.startTime = 'Start time is required';
    if (!formData.endTime) newErrors.endTime = 'End time is required';
    if (!formData.instructor) newErrors.instructor = 'Instructor is required';
    if (!formData.trainingType) newErrors.trainingType = 'Training type is required';
    
    // Check if end time is after start time
    if (formData.startTime && formData.endTime) {
      const start = new Date(`2000-01-01T${formData.startTime}`);
      const end = new Date(`2000-01-01T${formData.endTime}`);
      if (end <= start) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear the error for this field when the user starts typing
    setErrors(prev => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsSubmitting(true);
      try {
        if (session) {
          await dispatch(updateSession({ ...formData, id: session.id })).unwrap();
          showSuccessNotification('Session updated successfully');
        } else {
          await dispatch(addSession(formData)).unwrap();
          showSuccessNotification('Session added successfully');
        }
        onClose();
      } catch (error) {
        showErrorNotification(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.sessionForm}>
      <h2>{session ? 'Edit Session' : 'Add New Session'}</h2>
      
      <div className={styles.formGroup}>
        <label htmlFor="startTime">Start Time:</label>
        <input
          type="time"
          id="startTime"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          required
        />
        {errors.startTime && <span className={styles.error}>{errors.startTime}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="endTime">End Time:</label>
        <input
          type="time"
          id="endTime"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
          required
        />
        {errors.endTime && <span className={styles.error}>{errors.endTime}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="instructor">Instructor:</label>
        <input
          type="text"
          id="instructor"
          name="instructor"
          value={formData.instructor}
          onChange={handleChange}
          required
        />
        {errors.instructor && <span className={styles.error}>{errors.instructor}</span>}
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
        {errors.trainingType && <span className={styles.error}>{errors.trainingType}</span>}
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="notes">Notes:</label>
        <textarea
          id="notes"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      <div className={styles.formActions}>
        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : session ? 'Update Session' : 'Add Session'}
        </button>
        <button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button>
      </div>
    </form>
  );
};

export default SessionForm;