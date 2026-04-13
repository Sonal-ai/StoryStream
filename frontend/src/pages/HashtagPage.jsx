import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostsByHashtag } from '../api';
import { Hash } from 'lucide-react';
import PostCard from '../components/PostCard';

const HashtagPage = () => {
  const { tag } = useParams();
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    getPostsByHashtag(tag)
      .then((res) => setPosts(res.data?.data?.posts ?? []))
      .catch(() => setError('Failed to load posts for this hashtag.'))
      .finally(() => setLoading(false));
  }, [tag]);

  const handleDelete = (id) => setPosts((prev) => prev.filter((p) => p.id !== id));

  return (
    <div className="page-layout">
      <main className="feed-main">
        <div className="follow-list-header" style={{ marginBottom: '8px' }}>
          <Link to="/" className="back-link">← Home</Link>
          <h2 className="page-title">
            <Hash size={18} style={{ verticalAlign: 'middle' }} />
            {tag}
          </h2>
          {!loading && <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{posts.length} post{posts.length !== 1 ? 's' : ''}</span>}
        </div>

        {loading && <div className="loading-posts"><div className="spinner" /></div>}
        {error   && <p className="error-text">{error}</p>}

        {!loading && !error && posts.length === 0 && (
          <div className="empty-state">
            <p>No posts found for <strong>#{tag}</strong></p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={handleDelete} />
        ))}
      </main>
    </div>
  );
};

export default HashtagPage;
