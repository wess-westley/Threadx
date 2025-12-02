// src/components/Header/Timeline/Timeline.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import ThreadCard from './ThreadCard';
import './Timeline.css';

const Timeline = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [threads, setThreads] = useState([]);
  const [filteredThreads, setFilteredThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Load threads when authenticated
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      loadThreads();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  // Filter threads whenever threads, filter, searchQuery, or user changes
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      filterThreads();
    }
  }, [threads, filter, searchQuery, user?.id, isAuthenticated]);

  // Load threads from localStorage or generate sample threads
  const loadThreads = async () => {
    if (!isAuthenticated || !user?.id) return;

    setLoading(true);
    await new Promise(r => setTimeout(r, 800));

    try {
      const storedThreads = JSON.parse(localStorage.getItem('threadx_threads') || '[]');

      if (storedThreads.length === 0) {
        const sampleThreads = generateSampleThreads(user);
        setThreads(sampleThreads);
        localStorage.setItem('threadx_threads', JSON.stringify(sampleThreads));
      } else {
        setThreads(storedThreads);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading threads:', error);
      setLoading(false);
    }
  };

  // Generate sample threads
  const generateSampleThreads = (currentUser) => {
    const allUsers = JSON.parse(localStorage.getItem('threadx_users') || '[]');
    const sampleUsers = allUsers.length > 0 
      ? allUsers.slice(0, 3) 
      : [
          { id: 1, username: 'sarah_dev', email: 'sarah@threadx.com', profileImage: '👩‍💻', bio: 'Dev enthusiast' },
          { id: 2, username: 'mike_chen', email: 'mike@threadx.com', profileImage: '👨‍💼', bio: 'Product manager' },
          { id: 3, username: 'alex_rivera', email: 'alex@threadx.com', profileImage: '👨‍🎨', bio: 'Designer' }
        ];

    const sampleContent = [
      "Just launched my new React project! So excited to share it with everyone. 🚀 #coding #webdev",
      "Beautiful day for coding! Working on some new features. What are you building today? 💻",
      "The future of web development is looking brighter every day. Amazing tools to explore! 🌟",
      "Just hit a major milestone on my project! 🎉 Thank you to everyone who supported!",
      "AI is changing how we think about development. What are your thoughts? 🤖"
    ];

    return sampleUsers.map((sampleUser, index) => ({
      id: `thread-${Date.now()}-${index}`,
      userId: sampleUser.id,
      username: sampleUser.username,
      email: sampleUser.email,
      profileImage: sampleUser.profileImage || sampleUser.avatar,
      bio: sampleUser.bio || '',
      content: sampleContent[index % sampleContent.length],
      timestamp: new Date(Date.now() - (index * 3600000)).toISOString(),
      likes: Math.floor(Math.random() * 50) + 10,
      liked: false,
      reposts: Math.floor(Math.random() * 20) + 1,
      reposted: false,
      comments: [],
      isOwner: currentUser?.id === sampleUser.id,
      engagement: Math.floor(Math.random() * 100) + 20,
      relevance: Math.random() * 100
    }));
  };

  // Filter threads based on search, category, relevance, and timestamp
  const filterThreads = () => {
    if (!isAuthenticated || !threads.length) {
      setFilteredThreads([]);
      return;
    }

    let filtered = [...threads];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t =>
          t.content.toLowerCase().includes(q) ||
          t.username.toLowerCase().includes(q) ||
          (t.email && t.email.toLowerCase().includes(q))
      );
    }

    // Category filter
    switch (filter) {
      case 'my':
        filtered = filtered.filter(thread => thread.userId === user?.id);
        break;
      case 'following':
        const following = getFollowingUsers();
        filtered = filtered.filter(thread => following.includes(thread.userId));
        break;
      case 'trending':
        filtered = filtered.filter(thread => thread.likes > 25)
                          .sort((a, b) => b.likes - a.likes);
        break;
      default:
        break;
    }

    // Sort by relevance first, then by newest timestamp
    filtered.sort((a, b) => {
      if (b.relevance !== a.relevance) return b.relevance - a.relevance;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

    setFilteredThreads(filtered);
  };

  // Get following users from localStorage
  const getFollowingUsers = () => {
    try {
      if (!user?.id) return [];
      const following = JSON.parse(localStorage.getItem(`following_${user.id}`) || '[]');
      return following || [];
    } catch {
      return [];
    }
  };

  // Refresh timeline
  const handleRefresh = async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    await loadThreads();
    setRefreshing(false);
  };

  // Navigate to new thread
  const handleNewThread = () => navigate('/new');

  // Like / unlike thread
  const handleLikeThread = (threadId) => {
    const updated = threads.map(thread =>
      thread.id === threadId
        ? { ...thread, liked: !thread.liked, likes: thread.liked ? thread.likes - 1 : thread.likes + 1 }
        : thread
    );
    setThreads(updated);
    localStorage.setItem('threadx_threads', JSON.stringify(updated));
  };

  // Repost / undo repost
  const handleRepostThread = (threadId) => {
    const updated = threads.map(thread =>
      thread.id === threadId
        ? { ...thread, reposted: !thread.reposted, reposts: thread.reposted ? thread.reposts - 1 : thread.reposts + 1 }
        : thread
    );
    setThreads(updated);
    localStorage.setItem('threadx_threads', JSON.stringify(updated));
  };

  // Delete thread
  const handleDeleteThread = (threadId) => {
    const updated = threads.filter(thread => thread.id !== threadId);
    setThreads(updated);
    localStorage.setItem('threadx_threads', JSON.stringify(updated));
  };

  // --- Render ---

  // Unauthenticated view
  if (!isAuthenticated) {
    return (
      <div className="timeline-container">
        <div className="auth-required">
          <motion.div
            className="auth-message"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="auth-clickable" onClick={() => navigate('/login')} style={{ cursor: 'pointer' }}>
              <h2>Welcome to ThreadX</h2>
              <p>Share your thoughts, connect with others, and explore ideas</p>
            </div>

            <motion.div
              className="community-section"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <p className="community-text">
                🚀 Join our vibrant community to share ideas, interact with others, and spark meaningful conversations.
              </p>
              <div className="auth-button-group">
                <button className="join-btn primary" onClick={() => navigate('/register')}>
                  Create Account
                </button>
                <button className="join-btn secondary" onClick={() => navigate('/login')}>
                  Sign In
                </button>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    );
  }

  // Loading view
  if (loading) {
    return (
      <div className="timeline-container">
        <div className="timeline-loading">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          >
            ⏳
          </motion.div>
          <p>Loading your timeline...</p>
        </div>
      </div>
    );
  }

  // Authenticated timeline view
  return (
    <div className="timeline-container">
      {/* Header */}
      <motion.header
        className="timeline-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="header-content">
          <div className="header-main">
            <div className="header-title">
              <h1>Your Timeline</h1>
              <p>Latest conversations from your network</p>
            </div>
            <div className="header-actions">
              <motion.button
                className="refresh-btn"
                onClick={handleRefresh}
                disabled={refreshing}
                whileHover={{ scale: 1.05, rotate: refreshing ? 0 : 180 }}
                whileTap={{ scale: 0.95 }}
              >
                {refreshing ? '🔄' : '↻'}
              </motion.button>
            </div>
          </div>

          {/* Search */}
          <div className="search-container">
            <div className="search-bar">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Search threads and users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <motion.button
                  className="search-clear"
                  onClick={() => setSearchQuery('')}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="filter-tabs">
            {[
              { key: 'all', label: 'All', icon: '🌐' },
              { key: 'following', label: 'Following', icon: '👥' },
              { key: 'my', label: 'My Threads', icon: '👤' },
              { key: 'trending', label: 'Trending', icon: '🔥' }
            ].map(tab => (
              <motion.button
                key={tab.key}
                className={`filter-tab ${filter === tab.key ? 'active' : ''}`}
                onClick={() => setFilter(tab.key)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                layout
              >
                <span className="tab-icon">{tab.icon}</span>
                <span className="tab-label">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.header>

      {/* Threads */}
      <main className="timeline-content">
        <div className="threads-container">
          <AnimatePresence mode="popLayout">
            {filteredThreads.length === 0 ? (
              <motion.div
                className="empty-state"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="empty-icon">{searchQuery ? '🔍' : '📝'}</div>
                <h3>{searchQuery ? 'No threads found' : 'No threads yet'}</h3>
                <p>
                  {searchQuery
                    ? `No results found for "${searchQuery}". Try a different search.`
                    : 'Be the first to share your thoughts! Click the + button to create a thread.'}
                </p>
              </motion.div>
            ) : (
              filteredThreads.map((thread, idx) => (
                <ThreadCard
                  key={thread.id}
                  thread={thread}
                  index={idx}
                  onLike={handleLikeThread}
                  onRepost={handleRepostThread}
                  onDelete={handleDeleteThread}
                  currentUser={user}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Action Button */}
      <motion.button
        className="fab"
        onClick={handleNewThread}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        title="Create a new thread"
      >
        ✏️
      </motion.button>
    </div>
  );
};

export default Timeline;