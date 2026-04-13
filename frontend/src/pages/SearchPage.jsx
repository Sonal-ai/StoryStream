import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { searchUsers } from '../api';
import { UserRound, SearchX } from 'lucide-react';

const SearchPage = () => {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!q.trim()) return;
    setLoading(true);
    setError('');
    searchUsers(q)
      .then((res) => {
        // Backend: { success, data: { users: [] }, pagination: {} }
        setUsers(res.data?.data?.users ?? []);
      })
      .catch(() => setError('Failed to search users.'))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="page-layout">
      <main className="feed-main">
        <h2 className="page-title">
          Search results for &ldquo;<span style={{ color: 'var(--accent)' }}>{q}</span>&rdquo;
        </h2>

        {loading && <div className="loading-posts"><div className="spinner" /></div>}

        {error && <p className="error-text">{error}</p>}

        {!loading && !error && users.length === 0 && (
          <div className="empty-state">
            <SearchX size={40} style={{ marginBottom: '12px', opacity: 0.5 }} />
            <p>No users found for &ldquo;{q}&rdquo;</p>
          </div>
        )}

        <ul className="user-search-list">
          {users.map((user) => (
            <li key={user.id} className="user-search-item">
              <Link to={`/profile/${user.username}`} className="user-search-link">
                <img
                  src={
                    user.profile_picture ||
                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
                  }
                  alt={user.username}
                  className="user-search-avatar"
                />
                <div className="user-search-info">
                  <span className="user-search-name">@{user.username}</span>
                  {user.bio && <span className="user-search-bio">{user.bio}</span>}
                  <span className="user-search-followers">
                    <UserRound size={12} /> {user.followers_count ?? 0} followers
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </main>
    </div>
  );
};

export default SearchPage;
