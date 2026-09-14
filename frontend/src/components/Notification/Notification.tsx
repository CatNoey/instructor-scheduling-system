// src/components/Notification/Notification.tsx

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../store';
import { markNotificationAsRead, Notification as NotificationType } from '../../store/notificationSlice';
import styles from './Notification.module.css';

const Notifications: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const notifications = useSelector((state: RootState) => state.notifications.notifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((n: NotificationType) => !n.isRead).length;

  useEffect(() => {
    if (unreadCount > 0) {
      setIsOpen(true);
    }
  }, [unreadCount]);

  const handleMarkAsRead = (id: string) => {
    dispatch(markNotificationAsRead(id));
  };

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.notificationsContainer}>
      <button className={styles.toggleButton} onClick={handleToggle} aria-expanded={isOpen} aria-controls="notification-list">
        알림 {unreadCount > 0 && <span className={styles.badge} aria-label={`읽지 않은 알림 ${unreadCount}개`}>{unreadCount}</span>}
      </button>
      {isOpen && (
        <div id="notification-list" className={styles.notificationsList} aria-label="알림 목록">
          {notifications.length === 0 ? (
            <p className={styles.noNotifications}>새 알림이 없습니다.</p>
          ) : (
            notifications.map((notification: NotificationType) => (
              <div 
                key={notification.id} 
                className={`${styles.notificationItem} ${styles[notification.type]} ${notification.isRead ? styles.read : styles.unread}`}
              >
                <p>{notification.message}</p>
                <small>{new Date(notification.createdAt).toLocaleString()}</small>
                {!notification.isRead && (
                  <button 
                    className={styles.markAsReadButton}
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    읽음으로 표시
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Notifications;
