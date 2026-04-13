import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFollowing } from '../api';
import { ArrowLeft, Users } from 'lucide-react';

const FollowingPage = () => {
  const { username } = useParams();
  const [following, setFollowing] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  useEffect(() => {
    getFollowing(username)
      .then((res) => {
        // Backend: { success, data: { following: [] }, pagination: {} }
        setFollowing(res.data?.data?.following ?? []);
      })
      .catch(() => setError('Failed to load following.'))
      .finally(() => setLoading(false));
  }, [username]);

  return (
    <div className="page-layout">
      <main className="feed-main">
        <div className="follow-list-header">
          <Link to={`/profile/${username}`} className="back-link">
            <ArrowLeft size={18} /> @{username}
          </Link>
          <h2 className="page-title">Following</h2>
        </div>

        {loading && <div className="loading-posts"><div className="spinner" /></div>}
        {error   && <p className="error-text">{error}</p>}

        {!loading && !error && following.length === 0 && (
          <div className="empty-state">
            <Users size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>Not following anyone yet.</p>
          </div>
        )}

        <ul className="user-search-list">
          {following.map((u) => (
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

export default FollowingPage;
