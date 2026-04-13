import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getFollowers, followUser, unfollowUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft, Users } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import toast from 'react-hot-toast';

const FollowersPage = () => {
  const { username }  = useParams();
  const { user }      = useAuth();
  const [followers, setFollowers] = useState([]);
  const [loading, setLoading]    = useState(true);
  const [error, setError]        = useState('');
  const [confirmTarget, setConfirmTarget] = useState(null); // follower to unfollow

  // Only show Follow Back buttons on the logged-in user's OWN followers list
  const isOwnProfile = user?.username === username;

  useEffect(() => {
    getFollowers(username)
      .then((res) => {
        const list = res.data?.data?.followers ?? [];
        setFollowers(list.map((f) => ({ ...f, _following: Boolean(f.is_followed_back) })));
      })
      .catch(() => setError('Failed to load followers.'))
      .finally(() => setLoading(false));
  }, [username]);

  const handleFollow = async (follower) => {
    try {
      await followUser(follower.username);
      setFollowers((prev) => prev.map((f) => f.id === follower.id ? { ...f, _following: true } : f));
      toast.success(`Following @${follower.username}!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleUnfollow = async () => {
    if (!confirmTarget) return;
    try {
      await unfollowUser(confirmTarget.username);
      setFollowers((prev) => prev.map((f) => f.id === confirmTarget.id ? { ...f, _following: false } : f));
      toast.success(`Unfollowed @${confirmTarget.username}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setConfirmTarget(null);
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

                {/* Only show Follow Back on own profile's followers list */}
                {isOwnProfile && user.username !== f.username && (
                  <button
                    className={`follow-btn ${f._following ? 'unfollow' : 'follow'}`}
                    style={{ flexShrink: 0, padding: '7px 16px', fontSize: '13px' }}
                    onClick={() => f._following ? setConfirmTarget(f) : handleFollow(f)}
                  >
                    {f._following ? 'Unfollow' : 'Follow Back'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </main>

      <ConfirmModal
        isOpen={!!confirmTarget}
        title="Unfollow user?"
        message={`Are you sure you want to unfollow @${confirmTarget?.username}?`}
        confirmLabel="Unfollow"
        onConfirm={handleUnfollow}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
};

export default FollowersPage;
