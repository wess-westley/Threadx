import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './search.css';

const Search = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('users');
  const [recentSearches, setRecentSearches] = useState([]);

  // Mock threads data structure (in real app, this would come from localStorage/API)
  const mockThreads = {
    'user1': [
      {
        id: 1,
        content: 'Just launched my new startup! 🚀 So excited to share this journey with everyone. #entrepreneurship #startup',
        timestamp: '2024-01-15T10:30:00Z',
        likes: 24,
        comments: 8,
        shares: 3
      },
      {
        id: 2,
        content: 'The future of AI is incredible. Just attended an amazing conference about machine learning advancements.',
        timestamp: '2024-01-12T14:20:00Z',
        likes: 45,
        comments: 12,
        shares: 5
      }
    ],
    'user2': [
      {
        id: 1,
        content: 'Beautiful sunset from my hike today! Nature always knows how to inspire. 🌄 #hiking #nature',
        timestamp: '2024-01-14T18:45:00Z',
        likes: 89,
        comments: 15,
        shares: 7
      }
    ],
    'user3': [
      {
        id: 1,
        content: 'Just finished reading an amazing book about productivity. Key takeaway: focus on systems, not goals!',
        timestamp: '2024-01-13T09:15:00Z',
        likes: 33,
        comments: 6,
        shares: 2
      },
      {
        id: 2,
        content: 'Working on a new photography project. Can\'t wait to share the results with you all! 📸',
        timestamp: '2024-01-10T16:30:00Z',
        likes: 67,
        comments: 9,
        shares: 4
      },
      {
        id: 3,
        content: 'Morning coffee and coding - the perfect combination! ☕️ #developerlife',
        timestamp: '2024-01-08T08:00:00Z',
        likes: 28,
        comments: 3,
        shares: 1
      }
    ]
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

  const pageVariants = {
    initial: { opacity: 0, x: -50 },
    in: { opacity: 1, x: 0 },
    out: { opacity: 0, x: 50 }
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const savedSearches = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(savedSearches);
  }, []);

  // Save search to recent searches
  const saveToRecentSearches = (user) => {
    const newSearch = {
      id: user.id,
      username: user.username,
      avatar: user.profileImage,
      timestamp: new Date().toISOString()
    };

    const updatedSearches = [
      newSearch,
      ...recentSearches.filter(search => search.id !== user.id)
    ].slice(0, 5); // Keep only 5 most recent

    setRecentSearches(updatedSearches);
    localStorage.setItem('recentSearches', JSON.stringify(updatedSearches));
  };

  // Search users in localStorage
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 800));

    try {
      const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');

      // Filter users based on search query (username or email)
      const results = users.filter(user => 
        user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      ).filter(user => user.email !== currentUser.email); // Exclude current user

      setSearchResults(results);
      setActiveTab('users');
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    }

    setIsLoading(false);
  };

  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    saveToRecentSearches(user);
  };

  // Get user threads (mock implementation)
  const getUserThreads = (userId) => {
    return mockThreads[userId] || [];
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  };

  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedUser(null);
  };

  return (
    <motion.div
      className="search-container"
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <motion.div
        className="search-header"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
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
            <motion.h1 variants={itemVariants}>Discover People</motion.h1>
            <motion.p variants={itemVariants}>
              Find and connect with amazing people on ThreadX
            </motion.p>
          </div>
        </div>
      </motion.div>

      {/* Search Bar */}
      <motion.div
        className="search-section"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <motion.input
              type="text"
              placeholder="Search by username or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              variants={itemVariants}
              whileFocus={{ scale: 1.02 }}
            />
            <motion.button
              type="submit"
              className="search-btn"
              variants={itemVariants}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isLoading || !searchQuery.trim()}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="loading-spinner"
                />
              ) : (
                '🔍'
              )}
            </motion.button>
            {searchQuery && (
              <motion.button
                type="button"
                className="clear-btn"
                onClick={clearSearch}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            )}
          </div>
        </form>

        {/* Search Tabs */}
        <motion.div className="search-tabs" variants={itemVariants}>
          <button
            className={`tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Users ({searchResults.length})
          </button>
          <button
            className={`tab ${activeTab === 'recent' ? 'active' : ''}`}
            onClick={() => setActiveTab('recent')}
          >
            Recent Searches
          </button>
        </motion.div>
      </motion.div>

      {/* Content Area */}
      <div className="search-content">
        <AnimatePresence mode="wait">
          {/* User Profile View */}
          {selectedUser ? (
            <motion.div
              key="user-profile"
              className="user-profile-view"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              {/* Profile Header */}
              <motion.div className="profile-header" variants={containerVariants}>
                <motion.button
                  className="back-btn"
                  onClick={() => setSelectedUser(null)}
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ← Back to Search
                </motion.button>

                <motion.div className="profile-info" variants={containerVariants}>
                  <motion.div
                    className="profile-avatar"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                  >
                    {selectedUser.profileImage ? (
                      selectedUser.profileImage.startsWith('data:') ? (
                        <img src={selectedUser.profileImage} alt={selectedUser.username} />
                      ) : (
                        <span className="avatar-emoji">{selectedUser.profileImage}</span>
                      )
                    ) : (
                      <div className="avatar-placeholder">👤</div>
                    )}
                  </motion.div>

                  <motion.div className="profile-details" variants={itemVariants}>
                    <h2>{selectedUser.username}</h2>
                    <p className="profile-email">{selectedUser.email}</p>
                    <p className="profile-joined">
                      Joined {new Date(selectedUser.registeredAt).toLocaleDateString()}
                    </p>
                  </motion.div>

                  <motion.button
                    className="follow-btn"
                    variants={itemVariants}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Follow
                  </motion.button>
                </motion.div>
              </motion.div>

              {/* User Threads */}
              <motion.div className="user-threads" variants={containerVariants}>
                <h3>Threads</h3>
                <div className="threads-list">
                  {getUserThreads(selectedUser.id).length > 0 ? (
                    getUserThreads(selectedUser.id).map((thread, index) => (
                      <motion.div
                        key={thread.id}
                        className="thread-card"
                        variants={itemVariants}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                      >
                        <div className="thread-content">
                          <p>{thread.content}</p>
                        </div>
                        <div className="thread-meta">
                          <div className="thread-stats">
                            <span>❤️ {thread.likes}</span>
                            <span>💬 {thread.comments}</span>
                            <span>🔄 {thread.shares}</span>
                          </div>
                          <span className="thread-time">
                            {formatTime(thread.timestamp)}
                          </span>
                        </div>
                      </motion.div>
                    ))
                  ) : (
                    <motion.div
                      className="empty-threads"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="empty-icon">📝</div>
                      <p>No threads yet</p>
                      <span>When {selectedUser.username} posts, their threads will appear here.</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          ) : (
            /* Search Results */
            <motion.div
              key="search-results"
              className="search-results-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <AnimatePresence>
                {/* Recent Searches */}
                {activeTab === 'recent' && recentSearches.length > 0 && (
                  <motion.div
                    className="recent-searches"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    <h3>Recent Searches</h3>
                    <div className="users-grid">
                      {recentSearches.map((search, index) => (
                        <motion.div
                          key={search.id}
                          className="user-card"
                          variants={itemVariants}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
                            const user = users.find(u => u.id === search.id);
                            if (user) handleUserSelect(user);
                          }}
                        >
                          <div className="user-avatar">
                            {search.avatar ? (
                              search.avatar.startsWith('data:') ? (
                                <img src={search.avatar} alt={search.username} />
                              ) : (
                                <span className="avatar-emoji">{search.avatar}</span>
                              )
                            ) : (
                              <div className="avatar-placeholder">👤</div>
                            )}
                          </div>
                          <div className="user-info">
                            <h4>{search.username}</h4>
                            <span className="recent-time">
                              {formatTime(search.timestamp)}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Search Results */}
                {activeTab === 'users' && searchResults.length > 0 && (
                  <motion.div
                    className="search-results"
                    initial="hidden"
                    animate="visible"
                    variants={containerVariants}
                  >
                    <h3>Search Results</h3>
                    <div className="users-grid">
                      {searchResults.map((user, index) => (
                        <motion.div
                          key={user.email}
                          className="user-card"
                          variants={itemVariants}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleUserSelect(user)}
                        >
                          <div className="user-avatar">
                            {user.profileImage ? (
                              user.profileImage.startsWith('data:') ? (
                                <img src={user.profileImage} alt={user.username} />
                              ) : (
                                <span className="avatar-emoji">{user.profileImage}</span>
                              )
                            ) : (
                              <div className="avatar-placeholder">👤</div>
                            )}
                          </div>
                          <div className="user-info">
                            <h4>{user.username}</h4>
                            <p>{user.email}</p>
                            <span className="user-joined">
                              Joined {new Date(user.registeredAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="user-actions">
                            <motion.button
                              className="view-profile-btn"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              View Profile
                            </motion.button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Empty States */}
                {activeTab === 'users' && searchQuery && searchResults.length === 0 && !isLoading && (
                  <motion.div
                    className="empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="empty-icon">🔍</div>
                    <h3>No users found</h3>
                    <p>Try searching with a different username or email</p>
                  </motion.div>
                )}

                {activeTab === 'recent' && recentSearches.length === 0 && (
                  <motion.div
                    className="empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="empty-icon">🕒</div>
                    <h3>No recent searches</h3>
                    <p>Your recent searches will appear here</p>
                  </motion.div>
                )}

                {!searchQuery && activeTab === 'users' && (
                  <motion.div
                    className="empty-state"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="empty-icon">👥</div>
                    <h3>Discover People</h3>
                    <p>Search for users by username or email to see their profiles and threads</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default Search;