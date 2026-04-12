import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserProfile, getUserPosts, updateProfile } from '../api';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import FollowButton from '../components/FollowButton';
import { Calendar, Edit2, Save, X } from 'lucide-react';
import toast from 'react-hot-toast';

const ProfilePage = () => {
  const { username }    = useParams();
  const { user, updateUser } = useAuth();

  const [profile, setProfile]   = useState(null);
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);
  const [editForm, setEditForm] = useState({ bio: '', profile_picture: '' });
  const [saving, setSaving]     = useState(false);

  const isOwner = user?.username === username;

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [profileRes, postsRes] = await Promise.all([
        getUserProfile(username),
        getUserPosts(username, { limit: 20 }),
      ]);
      setProfile(profileRes.data.data.user);
      setPosts(postsRes.data.data.posts);
      setEditForm({
        bio: profileRes.data.data.user.bio || '',
        profile_picture: profileRes.data.data.user.profile_picture || '',
      });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await updateProfile(editForm);
      const updated = res.data.data.user;
      setProfile((prev) => ({ ...prev, ...updated }));
      if (isOwner) updateUser(updated);
      setEditing(false);
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleFollowToggle = (data) => {
    setProfile((prev) => ({
      ...prev,
      followers_count: data.followers_count,
      isFollowing: data.following,
    }));
  };

  const handleDeletePost = (id) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setProfile((prev) => ({ ...prev, posts_count: prev.posts_count - 1 }));
  };

  const joinedDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!profile) return <div className="error-screen"><p>User not found.</p></div>;

  return (
    <div className="page-layout">
      <main className="profile-main">
        {/* Profile Header */}
        <div className="profile-card">
          <div className="profile-top">
            <img
              src={profile.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`}
              alt={profile.username}
              className="profile-avatar-lg"
            />
            <div className="profile-info">
              <h1 className="profile-username">@{profile.username}</h1>

              {editing ? (
                <div className="edit-form">
                  <input
                    type="text"
                    placeholder="Bio"
                    value={editForm.bio}
                    onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                    maxLength={200}
                  />
                  <input
                    type="url"
                    placeholder="Profile picture URL"
                    value={editForm.profile_picture}
                    onChange={(e) => setEditForm({ ...editForm, profile_picture: e.target.value })}
                  />
                  <div className="edit-actions">
                    <button className="btn-primary" onClick={handleSave} disabled={saving}>
                      <Save size={15} /> {saving ? 'Saving...' : 'Save'}
                    </button>
                    <button className="btn-secondary" onClick={() => setEditing(false)}>
                      <X size={15} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="profile-bio">{profile.bio || 'No bio yet.'}</p>
                  <p className="profile-joined">
                    <Calendar size={13} /> Joined {joinedDate(profile.created_at)}
                  </p>
                </>
              )}
            </div>

            <div className="profile-actions">
              {isOwner && !editing && (
                <button className="btn-secondary" onClick={() => setEditing(true)}>
                  <Edit2 size={15} /> Edit Profile
                </button>
              )}
              {!isOwner && (
                <FollowButton
                  username={profile.username}
                  initialFollow={profile.isFollowing}
                  onToggle={handleFollowToggle}
                />
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="profile-stats">
            <div className="stat">
              <span className="stat-num">{profile.posts_count || 0}</span>
              <span className="stat-label">Posts</span>
            </div>
            <Link to={`/profile/${username}/followers`} className="stat">
              <span className="stat-num">{profile.followers_count || 0}</span>
              <span className="stat-label">Followers</span>
            </Link>
            <Link to={`/profile/${username}/following`} className="stat">
              <span className="stat-num">{profile.following_count || 0}</span>
              <span className="stat-label">Following</span>
            </Link>
          </div>
        </div>

        {/* Posts */}
        <h2 className="section-heading">Posts</h2>
        {posts.length === 0 && <div className="empty-state"><p>No posts yet.</p></div>}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={handleDeletePost} />
        ))}
      </main>
    </div>
  );
};

export default ProfilePage;
