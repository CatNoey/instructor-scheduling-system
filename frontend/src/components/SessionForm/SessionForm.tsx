import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '../../store';
import { addSession, updateSession } from '../../store/sessionSlice';
import { Session, SessionInput, TrainingType } from '../../types';
import { localTimeToIso, isoToLocalTime } from '../../utils/dateTime';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { trainingTypeLabel } from '../../utils/presentation';
import styles from './SessionForm.module.css';

interface SessionFormProps { session?: Session; scheduleId: number; scheduleDate: string; scheduleName: string; onClose: () => void; }
interface FormData { startTime: string; endTime: string; instructor: string; notes: string; trainingType: TrainingType; }
const emptyForm: FormData = { startTime: '', endTime: '', instructor: '', notes: '', trainingType: 'class' };

const fromSession = (session?: Session): FormData => session ? {
  startTime: isoToLocalTime(session.startTime), endTime: isoToLocalTime(session.endTime), instructor: session.instructor,
  notes: session.notes || '', trainingType: session.trainingType,
} : emptyForm;

const SessionForm: React.FC<SessionFormProps> = ({ session, scheduleId, scheduleDate, scheduleName, onClose }) => {
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
      if (new Date(endTime) <= new Date(startTime)) throw new Error('종료 시각은 시작 시각보다 늦어야 합니다.');
      setIsSubmitting(true);
      const payload: SessionInput = { ...formData, notes: formData.notes || null, scheduleId, startTime, endTime };
      if (session) await dispatch(updateSession({ ...payload, id: session.id })).unwrap();
      else await dispatch(addSession(payload)).unwrap();
      showSuccessNotification(session ? '세션을 수정했습니다.' : '세션을 등록했습니다.');
      onClose();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '세션을 저장하지 못했습니다.';
      setError(message);
      showErrorNotification(message);
    } finally { setIsSubmitting(false); }
  };
  return <form onSubmit={handleSubmit} className={styles.sessionForm}>
    <div className={styles.formHeader}><div><p className={styles.eyebrow}>세션 정보</p><h2 id="session-form-title">{session ? '세션 수정' : '새 세션 등록'}</h2><p>{scheduleName} · {scheduleDate}</p></div><button type="button" onClick={onClose} className={styles.closeButton} aria-label="세션 등록 창 닫기">×</button></div>
    <p className={styles.timezoneNotice}>시각은 현재 브라우저의 현지 시간대를 기준으로 저장됩니다.</p>
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.timeGrid}><div className={styles.formGroup}><label htmlFor="startTime">시작 시각</label><input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={change} required /></div><div className={styles.formGroup}><label htmlFor="endTime">종료 시각</label><input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={change} required /></div></div>
    <div className={styles.formGroup}><label htmlFor="instructor">세션명 또는 모집 담당자</label><input type="text" id="instructor" name="instructor" placeholder="예: 오전 학급 교육 / 김운영" value={formData.instructor} onChange={change} required /><p className={styles.helpText}>강사 지원자가 세션을 구분할 수 있는 이름을 입력해 주세요.</p></div>
    <div className={styles.formGroup}><label htmlFor="trainingType">교육 유형</label><select id="trainingType" name="trainingType" value={formData.trainingType} onChange={change} required>{(['class', 'teacher', 'all_staff', 'remote', 'other'] as const).map((type) => <option key={type} value={type}>{trainingTypeLabel(type)}</option>)}</select></div>
    <div className={styles.formGroup}><label htmlFor="notes">운영 메모 <span className={styles.optional}>(선택)</span></label><textarea id="notes" name="notes" placeholder="준비물, 특이사항 등 운영에 필요한 내용을 적어 주세요." value={formData.notes} onChange={change} /></div>
    <div className={styles.formActions}><button type="submit" disabled={isSubmitting}>{isSubmitting ? '저장 중…' : session ? '수정 저장' : '세션 등록'}</button><button type="button" onClick={onClose} disabled={isSubmitting}>취소</button></div>
  </form>;
};
export default SessionForm;
