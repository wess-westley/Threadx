import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('home');
  const [showAlerts, setShowAlerts] = useState(false);
  const [unreadAlerts, setUnreadAlerts] = useState(0);
  const [alerts, setAlerts] = useState([]);

  const isAuthenticated = !!user;

  // --------------------------
  // NAVIGATION MAPPING
  // --------------------------
  const routeMap = {
    home: '/',
    search: '/search',
    alerts: '/alert',
    settings: '/settings',
    profile: '/profile',
  };

  const navItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'search', label: 'Search', icon: '🔍' },
    { id: 'alerts', label: 'Alerts', icon: '🔔' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
    { id: 'profile', label: 'Profile', icon: '👤' },
  ];

  // Load alerts (from localStorage)
  useEffect(() => {
    if (!isAuthenticated) return;
    loadAlerts();
    window.addEventListener('alertsUpdated', loadAlerts);
    return () => window.removeEventListener('alertsUpdated', loadAlerts);
  }, [isAuthenticated]);

  const loadAlerts = () => {
    if (!user?.id) return;
    const allAlerts = JSON.parse(localStorage.getItem('userAlerts') || '{}');
    const userAlerts = allAlerts[user.id] || [];

    setUnreadAlerts(userAlerts.filter(a => !a.read).length);
    setAlerts(userAlerts.slice(0, 10));
  };

  const handleTabClick = (tabId) => {
    setActiveTab(tabId);

    // Show alerts panel
    if (tabId === 'alerts') {
      setShowAlerts(true);
      markAllAsRead();
    } else {
      setShowAlerts(false);
    }

    // Navigate to mapped route
    const targetRoute = routeMap[tabId];
    if (targetRoute) {
      navigate(targetRoute);
    }
  };

  const markAllAsRead = () => {
    if (!user?.id) return;

    const allAlerts = JSON.parse(localStorage.getItem('userAlerts') || '{}');
    const userAlerts = allAlerts[user.id] || [];
    const updatedAlerts = userAlerts.map(a => ({ ...a, read: true }));

    allAlerts[user.id] = updatedAlerts;
    localStorage.setItem('userAlerts', JSON.stringify(allAlerts));

    setUnreadAlerts(0);
    setAlerts(updatedAlerts.slice(0, 10));
  };

  const getAlertIcon = (type) => {
    const icons = {
      like: '❤️',
      unlike: '🤍',
      comment: '💬',
      repost: '🔄',
      quote_repost: '💬',
      follow: '👤',
      unfollow: '🚫',
      profile_view: '👁️',
      view: '👁️'
    };
    return icons[type] || '🔔';
  };

  if (!isAuthenticated) return null;

  return (
    <>
      {/* ALERTS PANEL */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            className="alerts-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowAlerts(false)}
          >
            <motion.div
              className="alerts-panel"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="alerts-header">
                <h3>Notifications</h3>
                <div className="alerts-actions">
                  {unreadAlerts > 0 && (
                    <button className="mark-read-btn" onClick={markAllAsRead}>
                      Mark all read
                    </button>
                  )}
                  <button className="close-alerts-btn" onClick={() => setShowAlerts(false)}>
                    ✕
                  </button>
                </div>
              </div>

              <div className="alerts-list">
                {alerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    className={`alert-item ${alert.read ? 'read' : 'unread'}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="alert-icon">{getAlertIcon(alert.type)}</div>
                    <div className="alert-content">
                      <p className="alert-message">{alert.message}</p>
                      <span className="alert-time">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {alerts.length === 0 && (
                <div className="empty-alerts">
                  <div className="empty-icon">🔔</div>
                  <p>No notifications yet</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BOTTOM NAVBAR */}
      <motion.nav
        className="bottom-navbar"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="nav-container">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`nav-item ${activeTab === item.id ? 'active' : ''}`}
              onClick={() => handleTabClick(item.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="nav-icon">
                {item.icon}
                {item.id === 'alerts' && unreadAlerts > 0 && (
                  <motion.span
                    className="alert-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                  >
                    {unreadAlerts}
                  </motion.span>
                )}
              </div>
              <span className="nav-label">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.nav>

      {/* Floating Create Button */}
      <motion.button
        className="floating-action-btn"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => navigate('/new')}
      >
        +
      </motion.button>
    </>
  );
};

export default Navbar;
