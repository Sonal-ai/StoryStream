import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import { Bell, Home, Search, LogOut, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const { user, logout }    = useAuth();
  const navigate            = useNavigate();
  const [search, setSearch] = useState('');

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/');
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
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
          <Link to="/feed"          className="nav-icon-btn" title="Feed"><Home size={20} /></Link>
          {user && (
             <Link to="/notifications" className="nav-icon-btn" title="Notifications"><Bell size={20} /></Link>
          )}

          {/* Animated Theme toggle */}
          <ThemeToggle />

          {user ? (
            <>
              <Link to={`/profile/${user.username}`} className="nav-icon-btn" title="Profile">
                <img
                  src={user.profile_picture || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt={user.username}
                  className="nav-avatar"
                />
              </Link>
              <button className="nav-icon-btn danger" onClick={handleLogout} title="Logout">
                <LogOut size={20} />
              </button>
            </>
          ) : (
            <Link to="/login" className="nav-btn-outline" style={{ fontSize: '13px', padding: '6px 12px', border: '1px solid var(--border)', borderRadius: '6px', marginLeft: '8px' }}>Log in</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
