import { useState } from 'react';
import { createPost } from '../api';
import { useAuth } from '../context/AuthContext';
import { Image, Send } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Compose box for creating new posts with character count and hashtag hint.
 * @param {Function} onPost - Callback that receives the new post object
 */
const CreatePost = ({ onPost }) => {
  const { user }           = useAuth();
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [showImg, setShowImg] = useState(false);
  const [loading, setLoading] = useState(false);

  const MAX = 280;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await createPost({ content: content.trim(), image_url: imageUrl.trim() || undefined });
      toast.success('Post published!');
      setContent('');
      setImageUrl('');
      setShowImg(false);
      onPost?.(res.data.data.post);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <form className="create-post-card" onSubmit={handleSubmit}>
      <div className="create-post-top">
        <img
          src={user.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
          alt={user.username}
          className="create-post-avatar"
        />
        <div className="create-post-inputs">
          <textarea
            placeholder="What's your story today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={MAX}
            rows={3}
          />
          {showImg && (
            <input
              type="url"
              placeholder="Image URL (optional)"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="image-url-input"
            />
          )}
        </div>
      </div>
      <div className="create-post-footer">
        <div className="create-post-actions">
          <button type="button" className="icon-action-btn" onClick={() => setShowImg((v) => !v)}>
            <Image size={18} />
          </button>
          <span className={`char-count ${content.length > MAX * 0.9 ? 'warn' : ''}`}>
            {MAX - content.length}
          </span>
        </div>
        <button type="submit" className="submit-post-btn" disabled={!content.trim() || loading}>
          <Send size={16} />
          {loading ? 'Publishing...' : 'Post'}
        </button>
      </div>
    </form>
  );
};

export default CreatePost;
