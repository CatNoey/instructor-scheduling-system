// src/components/Notification/Notification.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { UserNotification } from '../../types';
import { getNotifications, markNotificationRead } from '../../services/api';
import styles from './Notification.module.css';

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter((notification) => !notification.readAt).length;

  const load = useCallback(async () => {
    try {
      setError(null);
      setNotifications(await getNotifications());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '알림을 불러오지 못했습니다.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleMarkAsRead = async (id: number) => {
    try {
      const updated = await markNotificationRead(id);
      setNotifications((current) => current.map((notification) => notification.id === id ? updated : notification));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '알림을 읽음 처리하지 못했습니다.');
    }
  };

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);
    if (nextOpen) void load();
  };

  return (
    <div className={styles.notificationsContainer}>
      <button className={styles.toggleButton} onClick={handleToggle} aria-expanded={isOpen} aria-controls="notification-list">
        알림 {unreadCount > 0 && <span className={styles.badge} aria-label={`읽지 않은 알림 ${unreadCount}개`}>{unreadCount}</span>}
      </button>
      {isOpen && (
        <div id="notification-list" className={styles.notificationsList} aria-label="알림 목록">
          {error ? <p className={styles.errorMessage} role="alert">{error}</p> : notifications.length === 0 ? (
            <p className={styles.noNotifications}>새 알림이 없습니다.</p>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`${styles.notificationItem} ${styles[notification.type]} ${notification.readAt ? styles.read : styles.unread}`}
              >
                <p>{notification.message}</p>
                <small>{new Intl.DateTimeFormat('ko-KR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(notification.createdAt))}</small>
                {!notification.readAt && (
                  <button 
                    className={styles.markAsReadButton}
                    onClick={() => void handleMarkAsRead(notification.id)}
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
