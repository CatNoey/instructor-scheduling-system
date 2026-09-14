import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../store';
import { deleteSchedule } from '../../store/scheduleSlice';
import { Schedule } from '../../types';
import { showErrorNotification } from '../../utils/notifications';
import { scheduleStatusLabel, trainingTypeLabel } from '../../utils/presentation';
import styles from './ScheduleList.module.css';

interface ScheduleListProps {
  schedules: Schedule[];
  onEdit: (schedule: Schedule) => void;
  onOpenDetails: (schedule: Schedule) => void;
  onAddSchedule: () => void;
  permissions: { editSchedules: boolean; deleteSchedules: boolean; viewSessions: boolean };
}

const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, onEdit, onOpenDetails, onAddSchedule, permissions }) => {
  const dispatch: AppDispatch = useDispatch();
  const { isDeleting } = useSelector((state: RootState) => state.schedules);

  const handleDelete = async (scheduleId: number) => {
    if (!window.confirm('이 일정과 연결된 세션과 지원 내역을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
    try {
      await dispatch(deleteSchedule(scheduleId)).unwrap();
    } catch (error) {
      showErrorNotification(error instanceof Error ? error.message : '일정을 삭제하지 못했습니다.');
    }
  };

  if (schedules.length === 0) {
    return <div className={styles.emptyState}>
      <strong>선택한 날짜에 일정이 없습니다.</strong>
      <p>새 일정을 등록하면 이곳에서 세션과 강사 지원을 이어서 관리할 수 있습니다.</p>
      {permissions.editSchedules && <button type="button" onClick={onAddSchedule} className={styles.emptyAction}>새 일정 등록</button>}
    </div>;
  }

  return <div className={styles.scheduleList} aria-label="선택 날짜 일정 목록">
    {schedules.map((schedule) => <article key={schedule.id} className={styles.scheduleCard}>
      <div className={styles.cardHeader}>
        <div>
          <h3>{schedule.institutionName}</h3>
          <p className={styles.region}>{schedule.region}</p>
        </div>
        <div className={styles.badges}>
          <span className={`${styles.statusBadge} ${styles[`status_${schedule.status}`]}`}>{scheduleStatusLabel(schedule.status)}</span>
          <span className={styles.typeBadge}>{trainingTypeLabel(schedule.trainingType)}</span>
        </div>
      </div>
      <dl className={styles.meta}>
        <div><dt>필요 배정</dt><dd>{schedule.capacity}명</dd></div>
        <div><dt>운영 상태</dt><dd>{scheduleStatusLabel(schedule.status)}</dd></div>
      </dl>
      <div className={styles.cardActions}>
        {permissions.viewSessions && <button type="button" onClick={() => onOpenDetails(schedule)} className={styles.primaryAction}>상세 및 세션 관리</button>}
        {permissions.editSchedules && <button type="button" onClick={() => onEdit(schedule)} className={styles.secondaryAction}>수정</button>}
        {permissions.deleteSchedules && <button type="button" onClick={() => void handleDelete(schedule.id)} disabled={isDeleting} className={styles.deleteAction}>{isDeleting ? '삭제 중…' : '삭제'}</button>}
      </div>
    </article>)}
  </div>;
};

export default ScheduleList;
