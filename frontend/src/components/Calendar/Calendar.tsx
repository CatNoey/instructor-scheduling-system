// src/components/Calendar/Calendar.tsx

import React, { useState, useMemo, useEffect } from 'react';
import { Schedule } from '../../types';
import { UserRole } from '../../utils/permissions';
import styles from './Calendar.module.css';

interface CalendarProps {
  schedules: Schedule[];
  onDateSelect: (date: Date) => void;
  userRole: UserRole;
  canViewTeamLeaderSchedules: boolean;
}

const Calendar: React.FC<CalendarProps> = ({ schedules, onDateSelect, userRole, canViewTeamLeaderSchedules }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  useEffect(() => {
    console.log('Schedules received in Calendar:', schedules);
    console.log('Number of schedules:', schedules.length);
    if (schedules.length > 0) {
      console.log('First schedule:', schedules[0]);
      console.log('Last schedule:', schedules[schedules.length - 1]);
    }
  }, [schedules]);
  
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
    const hasSchedule = currentMonthSchedules.some(schedule => {
      const scheduleDate = new Date(schedule.date);
      return scheduleDate.toDateString() === date.toDateString();
    });
  
    let classNames = [styles.calendarDay];
    if (isToday) classNames.push(styles.today);
    if (hasSchedule) classNames.push(styles.hasSchedule);
    return classNames.join(' ');
  };

  const renderCalendarDays = () => {
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className={`${styles.calendarDay} ${styles.empty}`}></div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const daySchedules = currentMonthSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.date);
        return scheduleDate.toDateString() === date.toDateString();
      });
  
      days.push(
        <div
          key={day}
          className={getDayClass(day)}
          onClick={() => onDateSelect(date)}
        >
          <span className={styles.dayNumber}>{day}</span>
          {daySchedules.map(schedule => (
            <div
              key={schedule.id}
              className={`${styles.scheduleIndicator} ${
                userRole === 'team_leader' || new Date() > new Date(new Date(schedule.date).getTime() + 24 * 60 * 60 * 1000) 
                  ? '' 
                  : styles.teamLeaderOnly
              }`}
              title={`${schedule.institutionName} - ${schedule.trainingType}`}
            ></div>
          ))}
        </div>
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

  return (
    <div className={styles.calendar}>
      <div className={styles.calendarHeader}>
        <button onClick={goToPreviousMonth}>&lt;</button>
        <h2>{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={goToNextMonth}>&gt;</button>
      </div>
      <div className={styles.calendarGrid}>
        <div className={styles.calendarDayHeader}>Sun</div>
        <div className={styles.calendarDayHeader}>Mon</div>
        <div className={styles.calendarDayHeader}>Tue</div>
        <div className={styles.calendarDayHeader}>Wed</div>
        <div className={styles.calendarDayHeader}>Thu</div>
        <div className={styles.calendarDayHeader}>Fri</div>
        <div className={styles.calendarDayHeader}>Sat</div>
        {renderCalendarDays()}
      </div>
    </div>
  );
};

export default Calendar;