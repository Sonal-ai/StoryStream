import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFollowers, followUser, unfollowUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users } from 'lucide-react';
import toast from 'react-hot-toast';

const FollowersPage = () => {
  const { username }  = useParams();
  const { user }      = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState('');

  useEffect(() => {
    getFollowers(username)
      .then((res) => setFollowers(res.data?.data?.followers ?? []))
      .catch(() => setError('Failed to load followers.'))
      .finally(() => setLoading(false));
  }, [username]);

  const handleToggleFollow = async (follower) => {
    const isFollowing = follower._following;
    try {
      if (isFollowing) {
        await unfollowUser(follower.username);
        toast.success(`Unfollowed @${follower.username}`);
      } else {
        await followUser(follower.username);
        toast.success(`Following @${follower.username}`);
      }
      setFollowers((prev) =>
        prev.map((f) =>
          f.id === follower.id ? { ...f, _following: !isFollowing } : f
        )
      );
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

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
          {followers.map((f) => (
            <li key={f.id} className="user-search-item">
              <div className="user-search-link">
                <Link to={`/profile/${f.username}`} style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, textDecoration: 'none' }}>
                  <img
                    src={f.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${f.username}`}
                    alt={f.username}
                    className="user-search-avatar"
                  />
                  <div className="user-search-info">
                    <span className="user-search-name">@{f.username}</span>
                    {f.bio && <span className="user-search-bio">{f.bio}</span>}
                  </div>
                </Link>

                {/* Show Follow Back / Unfollow only for logged-in users, not own profile */}
                {user && user.username !== f.username && (
                  <button
                    className={`follow-btn ${f._following ? 'unfollow' : 'follow'}`}
                    style={{ flexShrink: 0, marginLeft: 'auto', padding: '7px 16px', fontSize: '13px' }}
                    onClick={() => handleToggleFollow(f)}
                  >
                    {f._following ? 'Unfollow' : 'Follow Back'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default FollowersPage;
