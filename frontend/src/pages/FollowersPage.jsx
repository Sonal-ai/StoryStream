import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFollowers } from '../api';
import { ArrowLeft, Users } from 'lucide-react';

const FollowersPage = () => {
  const { username } = useParams();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState('');

  useEffect(() => {
    getFollowers(username)
      .then((res) => {
        // Backend: { success, data: { followers: [] }, pagination: {} }
        setFollowers(res.data?.data?.followers ?? []);
      })
      .catch(() => setError('Failed to load followers.'))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <div className="page-layout">
      <main className="feed-main">
        <div className="follow-list-header">
          <Link to={`/profile/${username}`} className="back-link">
            <ArrowLeft size={18} /> @{username}
          </Link>
          <h2 className="page-title">Followers</h2>
        </div>

        {loading && <div className="loading-posts"><div className="spinner" /></div>}
        {error   && <p className="error-text">{error}</p>}

        {!loading && !error && followers.length === 0 && (
          <div className="empty-state">
            <Users size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No followers yet.</p>
          </div>
        )}

        <ul className="user-search-list">
          {followers.map((u) => (
            <li key={u.id} className="user-search-item">
              <Link to={`/profile/${u.username}`} className="user-search-link">
                <img
                  src={u.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                  alt={u.username}
                  className="user-search-avatar"
                />
                <div className="user-search-info">
                  <span className="user-search-name">@{u.username}</span>
                  {u.bio && <span className="user-search-bio">{u.bio}</span>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default FollowersPage;
