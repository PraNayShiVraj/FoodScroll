import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, User, Plus } from 'lucide-react';
import './BottomNav.css';

const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const goToProfile = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user?._id) navigate(`/profile/${user._id}`);
    } catch {
      navigate('/Login');
    }
  };

  const isSearch = location.pathname === '/search';
  const isProfile = location.pathname.startsWith('/profile');

  // Hide BottomNav on auth pages
  const authPaths = ['/Login', '/Signup', '/verify-otp', '/password', '/profilepic'];
  if (authPaths.includes(location.pathname) || location.pathname === '/') {
    return null;
  }

  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <button
        id="nav-search"
        className={`nav-item ${isSearch ? 'nav-item--active' : ''}`}
        onClick={() => navigate('/search')}
        aria-label="Search"
      >
        <div className="nav-icon-wrapper">
          <Search size={22} strokeWidth={isSearch ? 2.5 : 1.8} />
          {isSearch && <span className="nav-dot" />}
        </div>
        <span className="nav-label">Search</span>
      </button>

      <div className="nav-middle-container">
        <button
          id="nav-upload-square"
          className="nav-search-square"
          onClick={() => navigate('/upload')}
          aria-label="Upload Content"
        >
          <Plus size={24} strokeWidth={3} />
        </button>
      </div>

      <button
        id="nav-profile"
        className={`nav-item ${isProfile ? 'nav-item--active' : ''}`}
        onClick={goToProfile}
        aria-label="My Profile"
      >
        <div className="nav-icon-wrapper">
          <User size={22} strokeWidth={isProfile ? 2.5 : 1.8} />
          {isProfile && <span className="nav-dot" />}
        </div>
        <span className="nav-label">Profile</span>
      </button>
    </nav>
  );
};

export default BottomNav;
