import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bell, Home, Search, LogOut, User, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout }  = useAuth();
  const navigate          = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <Sparkles size={22} />
          <span>StoryStream</span>
        </Link>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch}>
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </form>

        {/* Nav actions */}
        <div className="navbar-actions">
          <Link to="/"              className="nav-icon-btn" title="Home"><Home size={20} /></Link>
          <Link to="/notifications" className="nav-icon-btn" title="Notifications"><Bell size={20} /></Link>
          {user && (
            <Link to={`/profile/${user.username}`} className="nav-icon-btn" title="Profile">
              {user.profile_picture
                ? <img src={user.profile_picture} alt={user.username} className="nav-avatar" />
                : <User size={20} />}
            </Link>
          )}
          <button className="nav-icon-btn danger" onClick={handleLogout} title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
