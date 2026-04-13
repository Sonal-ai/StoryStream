import { useState } from 'react';
import { followUser, unfollowUser } from '../api';
import { useAuth } from '../context/AuthContext';
import { UserPlus, UserMinus } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import toast from 'react-hot-toast';

const FollowButton = ({ username, initialFollow = false, onToggle }) => {
  const { user }                    = useAuth();
  const [following, setFollowing]   = useState(initialFollow);
  const [loading, setLoading]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!user || user.username === username) return null;

  const handleFollow = async () => {
    setLoading(true);
    try {
      const res = await followUser(username);
      setFollowing(true);
      toast.success(`Following @${username}!`);
      onToggle?.(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async () => {
    setShowConfirm(false);
    setLoading(true);
    try {
      const res = await unfollowUser(username);
      setFollowing(false);
      toast.success(`Unfollowed @${username}`);
      onToggle?.(res.data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={`follow-btn ${following ? 'unfollow' : 'follow'}`}
        onClick={following ? () => setShowConfirm(true) : handleFollow}
        disabled={loading}
      >
        {following
          ? <><UserMinus size={15} /> Unfollow</>
          : <><UserPlus  size={15} /> Follow</>}
      </button>

      <ConfirmModal
        isOpen={showConfirm}
        title="Unfollow user?"
        message={`Are you sure you want to unfollow @${username}? You'll stop seeing their posts in your feed.`}
        confirmLabel="Unfollow"
        onConfirm={handleUnfollow}
        onCancel={() => setShowConfirm(false)}
      />
    </>
  );
};

export default FollowButton;
