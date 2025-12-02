import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showMenu, setShowMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());

  // Listen for theme changes
  useEffect(() => {
    const savedTheme = localStorage.getItem('threadx_theme') || 'light';
    setDarkMode(savedTheme === 'dark');

    const handleThemeChange = (e) => {
      setDarkMode(e.detail.darkMode);
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Get time-based greeting
  useEffect(() => {
    const updateGreeting = () => {
      const hour = new Date().getHours();
      let greetingText = '';
      let icon = '';

      if (hour >= 5 && hour < 12) {
        greetingText = 'Good Morning';
        icon = '🌅';
      } else if (hour >= 12 && hour < 17) {
        greetingText = 'Good Afternoon';
        icon = '☀️';
      } else if (hour >= 17 && hour < 21) {
        greetingText = 'Good Evening';
        icon = '🌆';
      } else {
        greetingText = 'Good Night';
        icon = '🌙';
      }

      setGreeting(`${icon} ${greetingText}`);
      setCurrentTime(new Date());
    };

    updateGreeting();

    // Update greeting every minute
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
    setShowMenu(false);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setShowMenu(false);
  };

  const getTimeFormatted = () => {
    return currentTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <motion.header
      className={`header ${scrolled ? 'scrolled' : ''} ${darkMode ? 'dark-mode' : ''}`}
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
    >
      <div className="header-container">
        {/* Logo - Left Section */}
        <motion.div
          className="header-logo"
          onClick={() => navigate('/')}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-icon">
            <span className="thread-dot">●</span>
            <span className="thread-dot">●</span>
            <span className="thread-dot">●</span>
          </div>
          <span className="logo-text">ThreadX</span>
        </motion.div>

        {/* Center - Marquee or Greeting */}
        {user ? (
          <motion.div
            className="header-greeting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="greeting-container">
              <motion.div
                className="greeting-text"
                animate={{ x: [0, -100, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <span className="greeting-icon">{greeting}</span>
                <span className="greeting-username">{user.username}!</span>
              </motion.div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            className="header-marquee"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="marquee-content">
              <span className="marquee-text">
                Welcome to ThreadX • Share Your Thoughts • Connect with Others • Explore Ideas
                <span className="marquee-separator">•</span>
                Welcome to ThreadX • Share Your Thoughts • Connect with Others • Explore Ideas
              </span>
            </div>
          </motion.div>
        )}

        {/* Right Section - User Info & Menu */}
        <div className="header-actions">
          {user ? (
            <>
              {/* User Time Display */}
              <div className="user-time">
                <span className="time-display">{getTimeFormatted()}</span>
              </div>

              {/* User Info */}
              <motion.div
                className="user-info"
                onClick={() => navigate('/profile')}
                whileHover={{ scale: 1.05 }}
                style={{ cursor: 'pointer' }}
              >
                <div className="user-avatar">
                  {user.profileImage ? (
                    user.profileImage.startsWith('data:') || user.profileImage.startsWith('http') ? (
                      <img src={user.profileImage} alt={user.username} />
                    ) : (
                      <span className="avatar-emoji">{user.profileImage}</span>
                    )
                  ) : (
                    <span className="avatar-emoji">{user.avatar?.substring(user.avatar.length - 2) || '👤'}</span>
                  )}
                </div>
                <div className="user-details">
                  <p className="user-name">{user.username}</p>
                  <p className="user-email">{user.email}</p>
                </div>
              </motion.div>

              {/* Menu Button */}
              <motion.button
                className="menu-toggle"
                onClick={() => setShowMenu(!showMenu)}
                whileHover={{ scale: 1.15, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                title="Menu"
              >
                ⋮
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {showMenu && (
                  <motion.div
                    className="dropdown-menu"
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  >
                    <motion.button
                      className="menu-item profile-item"
                      onClick={() => handleNavigation('/profile')}
                      whileHover={{ x: 5 }}
                    >
                      <span className="menu-icon">👤</span>
                      <span>View Profile</span>
                    </motion.button>

                    <motion.button
                      className="menu-item alerts-item"
                      onClick={() => handleNavigation('/alert')}
                      whileHover={{ x: 5 }}
                    >
                      <span className="menu-icon">🔔</span>
                      <span>Notifications</span>
                    </motion.button>

                    <motion.button
                      className="menu-item settings-item"
                      onClick={() => handleNavigation('/settings')}
                      whileHover={{ x: 5 }}
                    >
                      <span className="menu-icon">⚙️</span>
                      <span>Settings</span>
                    </motion.button>

                    <div className="menu-divider" />

                    <motion.button
                      className="menu-item logout-item"
                      onClick={handleLogout}
                      whileHover={{ x: 5 }}
                    >
                      <span className="menu-icon">🚪</span>
                      <span>Logout</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="auth-buttons">
              <motion.button
                className="auth-btn login-btn"
                onClick={() => navigate('/login')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                
              </motion.button>
              <motion.button
                className="auth-btn register-btn"
                onClick={() => navigate('/register')}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
              >
                
              </motion.button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  );
};

export default Header;