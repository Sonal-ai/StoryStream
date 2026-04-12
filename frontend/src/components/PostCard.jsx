import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, MessageCircle, Trash2 } from 'lucide-react';
import { likePost, unlikePost, deletePost } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * Renders a single post card with like, comment count, hashtags, and delete.
 * @param {Object}   post       - Post data
 * @param {Function} onDelete   - Callback when post is deleted
 * @param {Function} onLikeToggle - Callback to update parent state
 */
const PostCard = ({ post, onDelete, onLikeToggle }) => {
  const { user }         = useAuth();
  const [likeCount, setLikeCount] = useState(Number(post.like_count) || 0);
  const [liked, setLiked]         = useState(Boolean(post.liked_by_me));
  const [loading, setLoading]     = useState(false);

  const handleLike = async () => {
    if (!user) return toast.error('Login to like posts');
    setLoading(true);
    try {
      if (liked) {
        const res = await unlikePost(post.id);
        setLiked(false);
        setLikeCount(res.data.data.like_count);
      } else {
        const res = await likePost(post.id);
        setLiked(true);
        setLikeCount(res.data.data.like_count);
      }
      onLikeToggle?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update like');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    try {
      await deletePost(post.id);
      toast.success('Post deleted');
      onDelete?.(post.id);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete post');
    }
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr);
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m`;
    if (m < 1440) return `${Math.floor(m / 60)}h`;
    return `${Math.floor(m / 1440)}d`;
  };

  return (
    <article className="post-card">
      {/* Author */}
      <div className="post-header">
        <Link to={`/profile/${post.username}`} className="post-author">
          <img
            src={post.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}`}
            alt={post.username}
            className="post-avatar"
          />
          <div>
            <span className="post-username">@{post.username}</span>
            <span className="post-time">{timeAgo(post.created_at)}</span>
          </div>
        </Link>
        {user?.id === post.author_id && (
          <button className="post-delete-btn" onClick={handleDelete} title="Delete post">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Content */}
      <p className="post-content">{post.content}</p>

      {/* Image */}
      {post.image_url && (
        <img src={post.image_url} alt="Post attachment" className="post-image" />
      )}

      {/* Hashtags */}
      {post.hashtags?.length > 0 && (
        <div className="post-hashtags">
          {post.hashtags.map((tag) => (
            <Link key={tag} to={`/hashtag/${tag}`} className="hashtag-chip">
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="post-actions">
        <button
          className={`action-btn like-btn ${liked ? 'liked' : ''}`}
          onClick={handleLike}
          disabled={loading}
        >
          <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
          <span>{likeCount}</span>
        </button>

        <Link to={`/post/${post.id}`} className="action-btn comment-btn">
          <MessageCircle size={17} />
          <span>{post.comment_count}</span>
        </Link>
      </div>
    </article>
  );
};

export default PostCard;
