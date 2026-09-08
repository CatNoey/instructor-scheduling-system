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
      <button className={styles.toggleButton} onClick={handleToggle}>
        Notifications {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>
      {isOpen && (
        <div className={styles.notificationsList}>
          {notifications.length === 0 ? (
            <p className={styles.noNotifications}>No notifications</p>
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
                    Mark as read
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