import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './Alert.css';

const Alert = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [filter, setFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Alert types with icons and colors
  const alertTypes = {
    like: { icon: '❤️', color: '#FF6B6B', label: 'Likes' },
    unlike: { icon: '🤍', color: '#666666', label: 'Unlikes' },
    comment: { icon: '💬', color: '#4ECDC4', label: 'Comments' },
    repost: { icon: '🔄', color: '#45B7D1', label: 'Reposts' },
    quote_repost: { icon: '💬🔄', color: '#96CEB4', label: 'Quote Reposts' },
    follow: { icon: '👤', color: '#FFBE0B', label: 'Follows' },
    unfollow: { icon: '🚫', color: '#FF6B6B', label: 'Unfollows' },
    profile_view: { icon: '👁️', color: '#8338EC', label: 'Profile Views' },
    view: { icon: '👁️', color: '#3A86FF', label: 'Post Views' }
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5
      }
    }
  };

  const alertVariants = {
    hidden: { x: -50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 25
      }
    },
    exit: {
      x: 50,
      opacity: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  // Load current user and alerts
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    setCurrentUser(user);
    loadAlerts(user.id);
  }, []);

  // Load alerts from localStorage
  const loadAlerts = (userId) => {
    setLoading(true);
    
    // Simulate loading delay for better UX
    setTimeout(() => {
      const allAlerts = JSON.parse(localStorage.getItem('userAlerts') || '{}');
      const userAlerts = allAlerts[userId] || [];
      
      // Sort by timestamp (newest first)
      const sortedAlerts = userAlerts.sort((a, b) => 
        new Date(b.timestamp) - new Date(a.timestamp)
      );
      
      setAlerts(sortedAlerts);
      calculateUnreadCount(sortedAlerts);
      setLoading(false);
    }, 800);
  };

  // Calculate unread alerts count
  const calculateUnreadCount = (alertsList) => {
    const unread = alertsList.filter(alert => !alert.read).length;
    setUnreadCount(unread);
  };

  // Mark alert as read
  const markAsRead = (alertId) => {
    const updatedAlerts = alerts.map(alert => 
      alert.id === alertId ? { ...alert, read: true } : alert
    );
    
    setAlerts(updatedAlerts);
    calculateUnreadCount(updatedAlerts);
    
    // Update localStorage
    const allAlerts = JSON.parse(localStorage.getItem('userAlerts') || '{}');
    allAlerts[currentUser.id] = updatedAlerts;
    localStorage.setItem('userAlerts', JSON.stringify(allAlerts));
  };

  // Mark all as read
  const markAllAsRead = () => {
    const updatedAlerts = alerts.map(alert => ({ ...alert, read: true }));
    setAlerts(updatedAlerts);
    setUnreadCount(0);
    
    // Update localStorage
    const allAlerts = JSON.parse(localStorage.getItem('userAlerts') || '{}');
    allAlerts[currentUser.id] = updatedAlerts;
    localStorage.setItem('userAlerts', JSON.stringify(allAlerts));
  };

  // Filter alerts by type
  const filteredAlerts = filter === 'all' 
    ? alerts 
    : alerts.filter(alert => alert.type === filter);

  // Get alert message based on type
  const getAlertMessage = (alert) => {
    const baseMessages = {
      like: 'liked your thread',
      unlike: 'unliked your thread',
      comment: 'commented on your thread',
      repost: 'reposted your thread',
      quote_repost: 'quoted your thread',
      follow: 'started following you',
      unfollow: 'unfollowed you',
      profile_view: 'viewed your profile photo',
      view: 'viewed your thread'
    };

    const baseMessage = baseMessages[alert.type] || 'interacted with your content';
    
    if (alert.commentText) {
      return `${alert.fromUsername} commented: "${alert.commentText}"`;
    }
    
    if (alert.quoteText) {
      return `${alert.fromUsername} quoted: "${alert.quoteText}"`;
    }
    
    return `${alert.fromUsername} ${baseMessage}`;
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const now = new Date();
    const alertTime = new Date(timestamp);
    const diffInMinutes = Math.floor((now - alertTime) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}d ago`;
    
    return alertTime.toLocaleDateString();
  };

  // Clear all alerts
  const clearAllAlerts = () => {
    const allAlerts = JSON.parse(localStorage.getItem('userAlerts') || '{}');
    allAlerts[currentUser.id] = [];
    localStorage.setItem('userAlerts', JSON.stringify(allAlerts));
    setAlerts([]);
    setUnreadCount(0);
  };

  if (!currentUser) {
    return (
      <div className="alerts-container">
        <div className="loading-state">
          <div className="loading-spinner-large"></div>
          <p>Loading your alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="alerts-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div className="alerts-header" variants={itemVariants}>
        <div className="header-content">
          <motion.div
            className="logo-container"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="thread-logo">
              <div className="thread-line">
                {[...Array(3)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="thread-dot"
                    animate={{
                      scale: [1, 1.3, 1],
                      backgroundColor: ['#FF6B6B', '#1E1E2F', '#FF6B6B']
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
          <div className="header-text">
            <motion.h1 variants={itemVariants}>Notifications</motion.h1>
            <motion.p variants={itemVariants}>
              {unreadCount > 0 
                ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`
                : 'All caught up!'
              }
            </motion.p>
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div className="header-actions" variants={itemVariants}>
          {unreadCount > 0 && (
            <motion.button
              className="mark-all-read-btn"
              onClick={markAllAsRead}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Mark all read
            </motion.button>
          )}
          {alerts.length > 0 && (
            <motion.button
              className="clear-all-btn"
              onClick={clearAllAlerts}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear all
            </motion.button>
          )}
        </motion.div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div className="filter-tabs" variants={itemVariants}>
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        {Object.entries(alertTypes).map(([type, config]) => (
          <button
            key={type}
            className={`filter-tab ${filter === type ? 'active' : ''}`}
            onClick={() => setFilter(type)}
          >
            {config.icon} {config.label}
          </button>
        ))}
      </motion.div>

      {/* Alerts Content */}
      <motion.div className="alerts-content" variants={containerVariants}>
        {loading ? (
          <motion.div 
            className="loading-state"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="loading-spinner"></div>
            <p>Loading your notifications...</p>
          </motion.div>
        ) : filteredAlerts.length === 0 ? (
          <motion.div 
            className="empty-state"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="empty-icon">🔔</div>
            <h3>No notifications yet</h3>
            <p>
              {filter === 'all' 
                ? "When you get notifications, they'll appear here."
                : `No ${alertTypes[filter]?.label.toLowerCase()} notifications yet.`
              }
            </p>
          </motion.div>
        ) : (
          <motion.div className="alerts-list">
            <AnimatePresence>
              {filteredAlerts.map((alert) => (
                <motion.div
                  key={alert.id}
                  className={`alert-item ${alert.read ? 'read' : 'unread'}`}
                  variants={alertVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  layout
                  onClick={() => !alert.read && markAsRead(alert.id)}
                >
                  {/* Alert Icon */}
                  <div 
                    className="alert-icon"
                    style={{ backgroundColor: `${alertTypes[alert.type]?.color}20` }}
                  >
                    <span 
                      className="icon-emoji"
                      style={{ color: alertTypes[alert.type]?.color }}
                    >
                      {alertTypes[alert.type]?.icon}
                    </span>
                  </div>

                  {/* Alert Content */}
                  <div className="alert-content">
                    <p className="alert-message">
                      {getAlertMessage(alert)}
                    </p>
                    <span className="alert-time">
                      {formatTime(alert.timestamp)}
                    </span>
                    
                    {/* Additional Context */}
                    {(alert.commentText || alert.quoteText) && (
                      <div className="alert-context">
                        {alert.commentText && (
                          <p className="context-text">"{alert.commentText}"</p>
                        )}
                        {alert.quoteText && (
                          <p className="context-text">"{alert.quoteText}"</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Unread Indicator */}
                  {!alert.read && (
                    <motion.div
                      className="unread-indicator"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500 }}
                    />
                  )}

                  {/* Action Buttons */}
                  <div className="alert-actions">
                    {alert.threadId && (
                      <motion.button
                        className="view-thread-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to thread (implement navigation logic)
                          console.log('Navigate to thread:', alert.threadId);
                        }}
                      >
                        View
                      </motion.button>
                    )}
                    
                    {alert.fromUserId && (
                      <motion.button
                        className="view-profile-btn"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to user profile (implement navigation logic)
                          console.log('Navigate to profile:', alert.fromUserId);
                        }}
                      >
                        Profile
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Stats Summary */}
      {alerts.length > 0 && !loading && (
        <motion.div 
          className="alerts-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="stat-item">
            <span className="stat-number">{alerts.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{unreadCount}</span>
            <span className="stat-label">Unread</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {alerts.filter(a => a.type === 'like').length}
            </span>
            <span className="stat-label">Likes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {alerts.filter(a => a.type === 'comment').length}
            </span>
            <span className="stat-label">Comments</span>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Alert;