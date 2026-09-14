// src/components/Calendar/Calendar.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Schedule } from '../../types';
import styles from './Calendar.module.css';

interface CalendarProps {
  schedules: Schedule[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  userRole: 'admin' | 'instructor';
}

const Calendar: React.FC<CalendarProps> = ({ schedules, selectedDate, onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    setCurrentDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
  }, [selectedDate]);

  const currentMonthSchedules = useMemo(() => {
    return schedules;
  }, [schedules]);

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month + 1, 0).getDate();
  }, [currentDate]);

  const firstDayOfMonth = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return new Date(year, month, 1).getDay();
  }, [currentDate]);

  const getDayClass = (day: number) => {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = date.toDateString() === selectedDate.toDateString();
    const hasSchedule = currentMonthSchedules.some(schedule => {
      const [year, month, day] = schedule.date.split('-').map(Number);
      const scheduleDate = new Date(year, month - 1, day);
      return scheduleDate.toDateString() === date.toDateString();
    });
  
    let classNames = [styles.calendarDay];
    if (isToday) classNames.push(styles.today);
    if (isSelected) classNames.push(styles.selected);
    if (hasSchedule) classNames.push(styles.hasSchedule);
    return classNames.join(' ');
  };

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={`${styles.calendarDay} ${styles.empty}`} aria-hidden="true"></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const daySchedules = currentMonthSchedules.filter(schedule => {
        const [year, month, day] = schedule.date.split('-').map(Number);
        const scheduleDate = new Date(year, month - 1, day);
        return scheduleDate.toDateString() === date.toDateString();
      });
  
      days.push(
        <button
          type="button"
          key={day}
          className={getDayClass(day)}
          onClick={() => onDateSelect(date)}
          aria-label={`${date.toLocaleDateString('ko-KR', { dateStyle: 'full' })}${daySchedules.length ? `, 일정 ${daySchedules.length}건` : ''}`}
        >
          <span className={styles.dayNumber}>{day}</span>
          {daySchedules.length > 0 && <span className={styles.scheduleCount}>{daySchedules.length}</span>}
        </button>
      );
    }
    return days;
  };

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    const nextDate = new Date();
    setCurrentDate(new Date(nextDate.getFullYear(), nextDate.getMonth(), 1));
    onDateSelect(nextDate);
  };

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button type="button" onClick={goToPreviousMonth} aria-label="이전 달">‹</button>
        <h2>{currentDate.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' })}</h2>
        <div className={styles.calendarControls}>
          <button type="button" onClick={goToToday} className={styles.todayButton}>오늘</button>
          <button type="button" onClick={goToNextMonth} aria-label="다음 달">›</button>
        </div>
      </div>
      <div className={styles.calendarGrid}>
        {['일', '월', '화', '수', '목', '금', '토'].map((weekday) => <div key={weekday} className={styles.calendarDayHeader}>{weekday}</div>)}
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar;
