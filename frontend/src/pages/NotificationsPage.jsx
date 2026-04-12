import { useState, useEffect } from 'react';
import { getNotifications, markNotifRead, markAllNotifsRead } from '../api';
import { Bell, Heart, MessageCircle, UserPlus, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

const typeIcon = { like: Heart, comment: MessageCircle, follow: UserPlus };
const typeLabel = { like: 'liked your post', comment: 'commented on your post', follow: 'followed you' };

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]               = useState(0);
  const [loading, setLoading]             = useState(false);

  useEffect(() => { fetchNotifs(); }, []);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await getNotifications({ limit: 30 });
      setNotifications(res.data.data.notifications);
      setUnread(res.data.data.unread_count);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleRead = async (id) => {
    try {
      await markNotifRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
      setUnread((u) => Math.max(0, u - 1));
    } catch { /* silent */ }
  };

  const handleReadAll = async () => {
    try {
      await markAllNotifsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnread(0);
      toast.success('All marked as read');
    } catch {
      toast.error('Failed to mark all as read');
    }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    if (m < 1440) return `${Math.floor(m / 60)}h ago`;
    return `${Math.floor(m / 1440)}d ago`;
  };

  return (
    <div className="page-layout">
      <main className="notifications-main">
        <div className="notifications-header">
          <h1><Bell size={22} /> Notifications {unread > 0 && <span className="badge">{unread}</span>}</h1>
          {unread > 0 && (
            <button className="btn-secondary small" onClick={handleReadAll}>
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>

        {loading && <div className="loading-posts"><div className="spinner" /></div>}

        {!loading && notifications.length === 0 && (
          <div className="empty-state"><p>No notifications yet!</p></div>
        )}

        <div className="notif-list">
          {notifications.map((n) => {
            const Icon = typeIcon[n.type] || Bell;
            return (
              <div
                key={n.id}
                className={`notif-item ${!n.is_read ? 'unread' : ''}`}
                onClick={() => !n.is_read && handleRead(n.id)}
              >
                <div className={`notif-icon ${n.type}`}>
                  <Icon size={16} />
                </div>
                <div className="notif-body">
                  <p>
                    <Link to={`/profile/${n.actor_username}`} className="notif-actor">
                      @{n.actor_username}
                    </Link>{' '}
                    {typeLabel[n.type] || 'interacted with you'}
                  </p>
                  <span className="notif-time">{timeAgo(n.created_at)}</span>
                </div>
                {!n.is_read && <span className="unread-dot" />}
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};

export default NotificationsPage;
