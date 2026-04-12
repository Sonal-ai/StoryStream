import { useState, useEffect } from 'react';
import { getComments, addComment, deleteComment } from '../api';
import { useAuth } from '../context/AuthContext';
import { Send, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Comment section for a specific post.
 * Handles fetching, adding, and soft-deleting comments.
 */
const CommentSection = ({ postId }) => {
  const { user }             = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await getComments(postId, { limit: 20 });
      setComments(res.data.data.comments);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSubmitting(true);
    try {
      const res = await addComment(postId, { content: text.trim() });
      setComments((prev) => [...prev, res.data.data.comment]);
      setText('');
      toast.success('Comment added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteComment(id);
      setComments((prev) => prev.filter((c) => c.id !== id));
      toast.success('Comment deleted');
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const timeAgo = (d) => {
    const m = Math.floor((Date.now() - new Date(d)) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m`;
    return `${Math.floor(m / 60)}h`;
  };

  return (
    <div className="comment-section">
      <h3 className="comment-heading">Comments ({comments.length})</h3>

      {loading ? (
        <p className="comment-loading">Loading...</p>
      ) : (
        <div className="comment-list">
          {comments.length === 0 && <p className="no-comments">No comments yet. Be first!</p>}
          {comments.map((c) => (
            <div key={c.id} className="comment-item">
              <img
                src={c.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.username}`}
                alt={c.username}
                className="comment-avatar"
              />
              <div className="comment-body">
                <div className="comment-meta">
                  <span className="comment-author">@{c.username}</span>
                  <span className="comment-time">{timeAgo(c.created_at)}</span>
                </div>
                <p className="comment-text">{c.content}</p>
              </div>
              {user?.id === c.author_id && (
                <button className="comment-delete" onClick={() => handleDelete(c.id)}>
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      {user && (
        <form className="comment-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Write a comment..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={500}
          />
          <button type="submit" disabled={submitting || !text.trim()}>
            <Send size={16} />
          </button>
        </form>
      )}

      {!user && <p className="login-prompt">Login to leave a comment.</p>}
    </div>
  );
};

export default CommentSection;
