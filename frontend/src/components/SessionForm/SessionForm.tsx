import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { addSession, updateSession } from '../../store/sessionSlice';
import { Session, SessionInput, TrainingType } from '../../types';
import { localTimeToIso, isoToLocalTime } from '../../utils/dateTime';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import styles from './SessionForm.module.css';

interface SessionFormProps { session?: Session; scheduleId: number; scheduleDate: string; onClose: () => void; }
interface FormData { startTime: string; endTime: string; instructor: string; notes: string; trainingType: TrainingType; }
const emptyForm: FormData = { startTime: '', endTime: '', instructor: '', notes: '', trainingType: 'class' };

const fromSession = (session?: Session): FormData => session ? {
  startTime: isoToLocalTime(session.startTime), endTime: isoToLocalTime(session.endTime), instructor: session.instructor,
  notes: session.notes || '', trainingType: session.trainingType,
} : emptyForm;

const SessionForm: React.FC<SessionFormProps> = ({ session, scheduleId, scheduleDate, onClose }) => {
  const [formData, setFormData] = useState<FormData>(() => fromSession(session));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => setFormData(fromSession(session)), [session]);
  const change = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
    setError(null);
  };
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const startTime = localTimeToIso(scheduleDate, formData.startTime);
      const endTime = localTimeToIso(scheduleDate, formData.endTime);
      if (new Date(endTime) <= new Date(startTime)) throw new Error('End time must be after start time');
      setIsSubmitting(true);
      const payload: SessionInput = { ...formData, notes: formData.notes || null, scheduleId, startTime, endTime };
      if (session) await dispatch(updateSession({ ...payload, id: session.id })).unwrap();
      else await dispatch(addSession(payload)).unwrap();
      showSuccessNotification(session ? 'Session updated successfully' : 'Session added successfully');
      onClose();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to save the session';
      setError(message);
      showErrorNotification(message);
    } finally { setIsSubmitting(false); }
  };
  return <form onSubmit={handleSubmit} className={styles.sessionForm}>
    <h2>{session ? 'Edit Session' : 'Add New Session'}</h2>
    <p>Times use this browser's local timezone. A fixed business timezone has not yet been selected.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.formGroup}><label htmlFor="startTime">Start Time:</label><input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={change} required /></div>
    <div className={styles.formGroup}><label htmlFor="endTime">End Time:</label><input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={change} required /></div>
    <div className={styles.formGroup}><label htmlFor="instructor">Instructor:</label><input type="text" id="instructor" name="instructor" value={formData.instructor} onChange={change} required /></div>
    <div className={styles.formGroup}><label htmlFor="trainingType">Training Type:</label><select id="trainingType" name="trainingType" value={formData.trainingType} onChange={change} required><option value="class">Class</option><option value="teacher">Teacher</option><option value="all_staff">All Staff</option><option value="remote">Remote</option><option value="other">Other</option></select></div>
    <div className={styles.formGroup}><label htmlFor="notes">Notes:</label><textarea id="notes" name="notes" value={formData.notes} onChange={change} /></div>
    <div className={styles.formActions}><button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : session ? 'Update Session' : 'Add Session'}</button><button type="button" onClick={onClose} disabled={isSubmitting}>Cancel</button></div>
  </form>;
};
export default SessionForm;
