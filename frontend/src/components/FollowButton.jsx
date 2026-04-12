import { useState } from 'react';
import { followUser, unfollowUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * Follow/Unfollow button with optimistic UI updates.
 * @param {string}  username      - Target user's username
 * @param {boolean} initialFollow - Initial follow state
 * @param {Function} onToggle     - Callback with { following, followers_count }
 */
const FollowButton = ({ username, initialFollow = false, onToggle }) => {
  const { user }       = useAuth();
  const [following, setFollowing] = useState(initialFollow);
  const [loading, setLoading]     = useState(false);

  // Don't render on own profile
  if (!user || user.username === username) return null;

  const handleToggle = async () => {
    setLoading(true);
    // Optimistic update
    setFollowing((prev) => !prev);
    try {
      let res;
      if (following) {
        res = await unfollowUser(username);
        toast.success(`Unfollowed @${username}`);
      } else {
        res = await followUser(username);
        toast.success(`Following @${username}!`);
      }
      onToggle?.(res.data.data);
    } catch (err) {
      // Revert on error
      setFollowing((prev) => !prev);
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`follow-btn ${following ? 'unfollow' : 'follow'}`}
      onClick={handleToggle}
      disabled={loading}
    >
      {following
        ? <><UserMinus size={15} /> Unfollow</>
        : <><UserPlus  size={15} /> Follow</>}
    </button>
  );
};

export default FollowButton;
