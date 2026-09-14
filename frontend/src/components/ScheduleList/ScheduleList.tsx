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
  selectedScheduleId: number | null;
  onEdit: (schedule: Schedule) => void;
  onOpenDetails: (schedule: Schedule) => void;
  onAddSchedule: () => void;
  renderDetails: (schedule: Schedule) => React.ReactNode;
  permissions: { editSchedules: boolean; deleteSchedules: boolean; viewSessions: boolean };
}

const ScheduleList: React.FC<ScheduleListProps> = ({ schedules, selectedScheduleId, onEdit, onOpenDetails, onAddSchedule, renderDetails, permissions }) => {
  const dispatch: AppDispatch = useDispatch();
  const { isDeleting } = useSelector((state: RootState) => state.schedules);
  const handleDelete = async (scheduleId: number) => {
    if (!window.confirm('이 일정과 연결된 세션과 지원 내역을 삭제할까요? 이 작업은 되돌릴 수 없습니다.')) return;
    try { await dispatch(deleteSchedule(scheduleId)).unwrap(); }
    catch (error) { showErrorNotification(error instanceof Error ? error.message : '일정을 삭제하지 못했습니다.'); }
  };

  if (!schedules.length) return <div className={styles.emptyState}>
    <strong>선택한 날짜에 일정이 없습니다.</strong><p>이 날짜에 일정을 등록하면 세션과 강사 지원을 바로 이어서 관리할 수 있습니다.</p>
    {permissions.editSchedules && <button type="button" onClick={onAddSchedule}>이 날짜에 일정 등록</button>}
  </div>;

  return <div className={styles.scheduleList} aria-label="선택 날짜 일정 목록">
    <div className={styles.listHeader} aria-hidden="true"><span>기관 / 지역</span><span>교육 유형</span><span>모집 정원</span><span>모집 상태</span><span /></div>
    {schedules.map((schedule) => <React.Fragment key={schedule.id}>
      <article className={`${styles.scheduleRow} ${selectedScheduleId === schedule.id ? styles.selected : ''}`}>
        <button type="button" onClick={() => onOpenDetails(schedule)} className={styles.rowMain} aria-expanded={selectedScheduleId === schedule.id} aria-label={`${schedule.institutionName} 일정 상세 ${selectedScheduleId === schedule.id ? '닫기' : '열기'}`}>
          <span className={styles.rowTitle}><strong>{schedule.institutionName}</strong><small>{schedule.region}</small></span>
          <span className={styles.type}>{trainingTypeLabel(schedule.trainingType)}</span>
          <span className={styles.capacity}>{schedule.capacity}명</span>
          <span className={`${styles.status} ${styles[`status_${schedule.status}`]}`}><i aria-hidden="true" />{scheduleStatusLabel(schedule.status)}</span>
          <span className={styles.arrow} aria-hidden="true">{selectedScheduleId === schedule.id ? '⌄' : '›'}</span>
        </button>
        <div className={styles.rowActions} aria-label={`${schedule.institutionName} 관리`}>
          {permissions.editSchedules && <button type="button" onClick={() => onEdit(schedule)}>수정</button>}
          {permissions.deleteSchedules && <button type="button" onClick={() => void handleDelete(schedule.id)} disabled={isDeleting} className={styles.deleteAction}>{isDeleting ? '삭제 중…' : '삭제'}</button>}
        </div>
      </article>
      {selectedScheduleId === schedule.id && renderDetails(schedule)}
    </React.Fragment>)}
  </div>;
};

export default ScheduleList;
