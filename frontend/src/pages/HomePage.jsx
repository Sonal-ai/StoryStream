import { useState, useEffect, useCallback } from 'react';
import { getAllPosts, getFeed } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';
import { Newspaper, Users, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const HomePage = () => {
  const { user }      = useAuth();
  const [tab, setTab] = useState(user ? 'feed' : 'global');
  const [posts, setPosts]         = useState([]);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(1);
  const [hasMore, setHasMore]     = useState(true);
  const [refreshKey, setRefresh]  = useState(0);

  const fetchPosts = useCallback(async (reset = false) => {
    setLoading(true);
    const currentPage = reset ? 1 : page;
    try {
      const fetchFn = tab === 'feed' ? getFeed : getAllPosts;
      const res     = await fetchFn({ page: currentPage, limit: 10 });
      // Backend returns: { success, data: { posts: [] }, pagination: {} }
      const newPosts   = res.data?.data?.posts ?? [];
      const pagination = res.data?.pagination  ?? {};

      setPosts((prev) => reset ? newPosts : [...prev, ...newPosts]);
      setPage(currentPage + 1);
      setHasMore(pagination.hasNextPage ?? false);
    } catch (err) {
      if (err.response?.status === 401 && tab === 'feed') {
        setTab('global');
      } else {
        toast.error('Failed to load posts');
      }
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  // Reset and reload when tab or refreshKey changes
  useEffect(() => {
    setPage(1);
    setPosts([]);
    setHasMore(true);
    fetchPosts(true);
  }, [tab, refreshKey]);      // eslint-disable-line

  const handleNewPost = (post) => {
    setPosts((prev) => [post, ...prev]);
  };

  const handleDelete = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="page-layout">
      <main className="feed-main">
        {/* Compose */}
        {user && <CreatePost onPost={handleNewPost} />}

        {/* Tab switcher */}
        <div className="feed-tabs">
          {user && (
            <button
              className={`tab-btn ${tab === 'feed' ? 'active' : ''}`}
              onClick={() => setTab('feed')}
            >
              <Users size={16} /> For You
            </button>
          )}
          <button
            className={`tab-btn ${tab === 'global' ? 'active' : ''}`}
            onClick={() => setTab('global')}
          >
            <Newspaper size={16} /> Global
          </button>
          <button
            className="tab-btn refresh"
            onClick={() => setRefresh((k) => k + 1)}
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>

        {/* Posts list */}
        {posts.length === 0 && !loading && (
          <div className="empty-state">
            <p>No posts yet.{tab === 'feed' ? ' Follow some users!' : ''}</p>
          </div>
        )}

        {posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDelete={handleDelete}
          />
        ))}

        {loading && <div className="loading-posts"><div className="spinner" /></div>}

        {!loading && hasMore && posts.length > 0 && (
          <button className="load-more-btn" onClick={() => fetchPosts(false)}>
            Load more
          </button>
        )}

        {!hasMore && posts.length > 0 && (
          <p className="end-of-feed">You're all caught up! ✨</p>
        )}
      </main>
    </div>
  );
};

export default HomePage;
