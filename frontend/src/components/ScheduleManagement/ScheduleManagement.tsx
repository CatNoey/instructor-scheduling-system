import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../../store';
import { fetchSchedules } from '../../store/scheduleSlice';
import { logout } from '../../store/authSlice';
import { showErrorNotification } from '../../utils/notifications';
import Calendar from '../Calendar/Calendar';
import ScheduleForm from '../ScheduleForm/ScheduleForm';
import SessionManagement from '../SessionManagement/SessionManagement';
import ScheduleList from '../ScheduleList/ScheduleList';
import { Schedule, ScheduleStatus, TrainingType } from '../../types';
import { businessDateToLocalDate } from '../../utils/dateTime';
import { formatBusinessDate, scheduleStatusLabel, trainingTypeLabel } from '../../utils/presentation';
import Notifications from '../Notification/Notification';
import styles from './ScheduleManagement.module.css';

const today = () => new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

const ScheduleManagement: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();
  const { items: schedules, status, error } = useSelector((state: RootState) => state.schedules);
  const { user, permissions } = useSelector((state: RootState) => state.auth);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [trainingType, setTrainingType] = useState<'all' | TrainingType>('all');
  const [scheduleStatus, setScheduleStatus] = useState<'all' | ScheduleStatus>('all');

  useEffect(() => { void dispatch(fetchSchedules()); }, [dispatch]);
  useEffect(() => {
    if (selectedSchedule && !schedules.some((schedule) => schedule.id === selectedSchedule.id)) setSelectedSchedule(null);
  }, [schedules, selectedSchedule]);
  useEffect(() => {
    if (!isFormOpen) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setIsFormOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [isFormOpen]);

  const handleDateSelect = useCallback((date: Date) => { setSelectedDate(date); setSelectedSchedule(null); }, []);
  const handleAddSchedule = useCallback(() => {
    if (!permissions?.editSchedules) return showErrorNotification('일정을 등록할 권한이 없습니다.');
    setEditingSchedule(undefined); setIsFormOpen(true);
  }, [permissions]);
  const handleEditSchedule = useCallback((schedule: Schedule) => {
    if (!permissions?.editSchedules) return showErrorNotification('일정을 수정할 권한이 없습니다.');
    setEditingSchedule(schedule); setIsFormOpen(true);
  }, [permissions]);
  const handleCloseForm = useCallback(() => { setIsFormOpen(false); setEditingSchedule(undefined); }, []);
  const handleScheduleSaved = useCallback((schedule: Schedule) => {
    setSearchTerm(''); setTrainingType('all'); setScheduleStatus('all'); setSelectedDate(businessDateToLocalDate(schedule.date));
  }, []);
  const handleScheduleSelect = useCallback((schedule: Schedule) => {
    if (permissions?.viewSessions) setSelectedSchedule(schedule);
    else showErrorNotification('세션을 조회할 권한이 없습니다.');
  }, [permissions]);
  const handleLogout = useCallback(() => { dispatch(logout()); navigate('/login'); }, [dispatch, navigate]);
  const clearFilters = useCallback(() => { setSearchTerm(''); setTrainingType('all'); setScheduleStatus('all'); }, []);

  const selectedDaySchedules = useMemo(() => schedules.filter((schedule) =>
    businessDateToLocalDate(schedule.date).toDateString() === selectedDate.toDateString(),
  ), [schedules, selectedDate]);
  const visibleSchedules = useMemo(() => selectedDaySchedules.filter((schedule) => {
    const query = searchTerm.trim().toLowerCase();
    return (!query || schedule.institutionName.toLowerCase().includes(query) || schedule.region.toLowerCase().includes(query))
      && (trainingType === 'all' || schedule.trainingType === trainingType)
      && (scheduleStatus === 'all' || schedule.status === scheduleStatus);
  }), [selectedDaySchedules, searchTerm, trainingType, scheduleStatus]);
  const selectedScheduleCurrent = selectedSchedule ? schedules.find((schedule) => schedule.id === selectedSchedule.id) ?? null : null;
  const openCount = selectedDaySchedules.filter((schedule) => schedule.status === 'open').length;
  const capacity = selectedDaySchedules.reduce((total, schedule) => total + schedule.capacity, 0);

  if (!user || !permissions) return <div className={styles.loadingPage}>로그인이 필요합니다.</div>;

  return <main className={styles.scheduleManagement}>
    <header className={styles.pageHeader}>
      <div><p className={styles.eyebrow}>운영 콘솔</p><h1>일정 운영</h1><p className={styles.pageDescription}>일정, 세션, 강사 지원을 하나의 흐름으로 관리하세요.</p></div>
      <div className={styles.accountArea}><span className={styles.accountName}>{user.username} <small>관리자</small></span><Notifications /><button onClick={handleLogout} className={styles.logoutButton}>로그아웃</button></div>
    </header>

    {status === 'loading' && <p className={styles.loading}>일정을 불러오는 중…</p>}
    {status === 'failed' && <p className={styles.error} role="alert">일정을 불러오지 못했습니다. {error}</p>}

    <div className={styles.workspace}>
      <aside className={styles.calendarPanel} aria-label="월간 일정 탐색">
        <div className={styles.panelHeading}><div><p className={styles.sectionLabel}>날짜 탐색</p><h2>월간 일정</h2></div><span>{schedules.length}건</span></div>
        <Calendar schedules={schedules} selectedDate={selectedDate} onDateSelect={handleDateSelect} userRole={user.role} />
      </aside>

      <section className={styles.agendaPanel} aria-labelledby="agenda-title">
        <div className={styles.agendaHeading}>
          <div><p className={styles.sectionLabel}>선택한 날짜</p><h2 id="agenda-title">{formatBusinessDate(`${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`)}</h2></div>
          {permissions.editSchedules && <button type="button" onClick={handleAddSchedule} className={styles.addButton}>+ 새 일정 등록</button>}
        </div>
        <div className={styles.summary} aria-label="선택 날짜 요약">
          <div><span>일정</span><strong>{selectedDaySchedules.length}건</strong></div>
          <div><span>모집 중</span><strong>{openCount}건</strong></div>
          <div><span>필요 배정</span><strong>{capacity}명</strong></div>
        </div>
        <div className={styles.filterBar} aria-label="일정 필터">
          <input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="기관명 또는 지역 검색" aria-label="기관명 또는 지역 검색" />
          <select value={trainingType} onChange={(event) => setTrainingType(event.target.value as 'all' | TrainingType)} aria-label="교육 유형 필터">
            <option value="all">전체 교육 유형</option>{(['class', 'teacher', 'all_staff', 'remote', 'other'] as const).map((type) => <option key={type} value={type}>{trainingTypeLabel(type)}</option>)}
          </select>
          <select value={scheduleStatus} onChange={(event) => setScheduleStatus(event.target.value as 'all' | ScheduleStatus)} aria-label="모집 상태 필터">
            <option value="all">전체 상태</option>{(['open', 'closed', 'adjusted'] as const).map((value) => <option key={value} value={value}>{scheduleStatusLabel(value)}</option>)}
          </select>
          {(searchTerm || trainingType !== 'all' || scheduleStatus !== 'all') && <button type="button" onClick={clearFilters} className={styles.clearButton}>초기화</button>}
        </div>
        <div className={styles.listMeta}><span>{visibleSchedules.length}개 일정</span>{visibleSchedules.length !== selectedDaySchedules.length && <span>필터 적용됨</span>}</div>
        <ScheduleList schedules={visibleSchedules} onEdit={handleEditSchedule} onOpenDetails={handleScheduleSelect} onAddSchedule={handleAddSchedule} permissions={{ editSchedules: !!permissions.editSchedules, deleteSchedules: !!permissions.deleteSchedules, viewSessions: !!permissions.viewSessions }} />
      </section>
    </div>

    {selectedScheduleCurrent && <section className={styles.detailPanel} aria-labelledby="detail-title">
      <div className={styles.detailHeading}>
        <div><p className={styles.sectionLabel}>일정 상세</p><h2 id="detail-title">{selectedScheduleCurrent.institutionName}</h2><p>{formatBusinessDate(selectedScheduleCurrent.date)} · {selectedScheduleCurrent.region}</p></div>
        {permissions.editSchedules && <button type="button" onClick={() => handleEditSchedule(selectedScheduleCurrent)} className={styles.detailEdit}>일정 수정</button>}
      </div>
      <dl className={styles.detailMeta}>
        <div><dt>교육 유형</dt><dd>{trainingTypeLabel(selectedScheduleCurrent.trainingType)}</dd></div>
        <div><dt>모집 상태</dt><dd>{scheduleStatusLabel(selectedScheduleCurrent.status)}</dd></div>
        <div><dt>필요 배정 인원</dt><dd>{selectedScheduleCurrent.capacity}명</dd></div>
      </dl>
      <SessionManagement scheduleId={selectedScheduleCurrent.id} scheduleDate={selectedScheduleCurrent.date} scheduleName={selectedScheduleCurrent.institutionName} canEdit={!!permissions.editSessions} canDelete={!!permissions.deleteSessions} capacity={selectedScheduleCurrent.capacity} />
    </section>}

    {isFormOpen && <div className={styles.dialogBackdrop} onMouseDown={handleCloseForm}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="schedule-form-title" onMouseDown={(event) => event.stopPropagation()}>
        <ScheduleForm schedule={editingSchedule} onClose={handleCloseForm} onSaved={handleScheduleSaved} />
      </div>
    </div>}
  </main>;
};

export default ScheduleManagement;
