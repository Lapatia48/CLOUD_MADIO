import { useState, useEffect } from 'react';
import './NotificationBell.css';

type Notification = {
  id: number;
  description: string;
  signalementId?: number;
  dateNotif: string;
  isRead: boolean;
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserId(user.id || user.userId);
      } catch { }
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
      return () => clearInterval(interval);
    }
  }, [userId]);

  const fetchNotifications = async () => {
    if (!userId) return;
    try {
      const response = await fetch(`http://localhost:8080/api/notifications/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
        setUnreadCount(data.filter((n: Notification) => !n.isRead).length);
      }
    } catch (error) {
      console.error('Erreur fetch notifications:', error);
    }
  };

  const markAsRead = async (id: number) => {
    try {
      await fetch(`http://localhost:8080/api/notifications/${id}/read`, { method: 'PUT' });
      fetchNotifications();
    } catch (error) {
      console.error('Erreur mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;
    try {
      await fetch(`http://localhost:8080/api/notifications/user/${userId}/read-all`, { method: 'PUT' });
      fetchNotifications();
    } catch (error) {
      console.error('Erreur mark all as read:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR');
  };

  if (!userId) return null;

  return (
    <div className="notification-bell">
      <button 
        className="bell-button" 
        onClick={() => setShowDropdown(!showDropdown)}
      >
        🔔
        {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <div className="notification-dropdown">
          <div className="dropdown-header">
            <h4>Notifications</h4>
            {unreadCount > 0 && (
              <button className="mark-all-read" onClick={markAllAsRead}>
                Tout marquer comme lu
              </button>
            )}
          </div>
          
          <div className="notification-list">
            {notifications.length === 0 ? (
              <p className="no-notifications">Aucune notification</p>
            ) : (
              notifications.slice(0, 10).map((notif) => (
                <div 
                  key={notif.id} 
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <p className="notif-description">{notif.description}</p>
                  <span className="notif-date">{formatDate(notif.dateNotif)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
