import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getPostById } from '../api';
import PostCard from '../components/PostCard';
import CommentSection from '../components/CommentSection';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const PostDetailPage = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPostById(id)
      .then((res) => setPost(res.data.data.post))
      .catch(() => toast.error('Post not found'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="loading-screen"><div className="spinner" /></div>;
  if (!post)   return <div className="error-screen"><p>Post not found.</p><button onClick={() => navigate(-1)}>Go back</button></div>;

  return (
    <div className="page-layout">
      <main className="post-detail-main">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} /> Back
        </button>
        <PostCard post={post} onDelete={() => navigate('/')} />
        <CommentSection postId={post.id} />
      </main>
    </div>
  );
};

export default PostDetailPage;
