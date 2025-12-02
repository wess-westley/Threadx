// src/components/Header/NewThread/NewThread.jsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import './NewThread.css';

const NewThread = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [threadContent, setThreadContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [muteReplies, setMuteReplies] = useState(false);
  const [disableReposts, setDisableReposts] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [followers, setFollowers] = useState([]);
  const [showFollowersPreview, setShowFollowersPreview] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const MAX_CHARACTERS = 280;

  // Redirect if not authenticated and load followers
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (user?.id) {
      loadUserFollowers();
    }
  }, [isAuthenticated, navigate, user?.id]);

  const loadUserFollowers = () => {
    try {
      if (!user?.id) return;

      // Get followers from AuthContext storage
      const followerIds = JSON.parse(localStorage.getItem(`followers_${user.id}`) || '[]');
      
      // Get detailed follower info from threadx_users
      const allUsers = JSON.parse(localStorage.getItem('threadx_users') || '[]');
      const followerDetails = followerIds
        .map(followerId => allUsers.find(u => u.id === followerId))
        .filter(Boolean);
      
      setFollowers(followerDetails);
    } catch (error) {
      console.error('Error loading followers:', error);
      setFollowers([]);
    }
  };

  const handleContentChange = (e) => {
    const content = e.target.value;
    if (content.length <= MAX_CHARACTERS) {
      setThreadContent(content);
      setCharacterCount(content.length);
    }
  };

  const handleSubmit = async () => {
    if (!threadContent.trim() || isSubmitting || !user?.id) return;

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const newThread = {
        id: `thread-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage || user.avatar,
        bio: user.bio || '',
        content: threadContent,
        timestamp: new Date().toISOString(),
        likes: 0,
        liked: false,
        reposts: 0,
        reposted: false,
        comments: [],
        isOwner: true,
        engagement: 0,
        relevance: 100,
        // Privacy settings
        isPrivate,
        muteReplies,
        disableReposts,
        allowedViewers: isPrivate ? [user.id, ...followers.map(f => f.id)] : [],
        createdAt: new Date().toISOString()
      };

      // Save to threadx_threads (main timeline)
      const existingThreads = JSON.parse(localStorage.getItem('threadx_threads') || '[]');
      const updatedThreads = [newThread, ...existingThreads];
      localStorage.setItem('threadx_threads', JSON.stringify(updatedThreads));

      // Notify followers if not private
      if (!isPrivate) {
        notifyFollowers(newThread);
      }

      setIsSubmitting(false);
      setShowSuccess(true);

      // Navigate back after a brief delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('Error saving thread:', error);
      setIsSubmitting(false);
      alert('Error posting thread. Please try again.');
    }
  };

  const notifyFollowers = (thread) => {
    try {
      if (!user?.id) return;

      const followerIds = JSON.parse(localStorage.getItem(`followers_${user.id}`) || '[]');

      followerIds.forEach(followerId => {
        createFollowerAlert(followerId, thread);
      });
    } catch (error) {
      console.error('Error notifying followers:', error);
    }
  };

  const createFollowerAlert = (followerId, thread) => {
    try {
      const alert = {
        id: `alert-${Date.now()}-${followerId}`,
        type: 'new_thread',
        actor: user.username,
        actorImage: user.profileImage || user.avatar,
        content: 'posted a new thread',
        threadPreview: thread.content.substring(0, 100),
        timestamp: new Date().toISOString(),
        read: false,
        threadId: thread.id,
        relatedUserId: user.id
      };

      const allAlerts = JSON.parse(localStorage.getItem(`threadx_alerts_${followerId}`) || '[]');
      const updatedAlerts = [alert, ...allAlerts].slice(0, 50);
      localStorage.setItem(`threadx_alerts_${followerId}`, JSON.stringify(updatedAlerts));
    } catch (error) {
      console.error('Error creating follower alert:', error);
    }
  };

  const getPrivacyIcon = () => {
    if (isPrivate) return '🔒';
    if (muteReplies) return '🔇';
    if (disableReposts) return '🚫';
    return '🌐';
  };

  const getPrivacyDescription = () => {
    if (isPrivate) return `Only you and your ${followers.length} follower${followers.length !== 1 ? 's' : ''} can see this thread`;
    if (muteReplies) return 'Replies are disabled for this thread';
    if (disableReposts) return 'Reposts are disabled for this thread';
    return 'Everyone can see and interact with this thread';
  };

  const getPrivacySettingsSummary = () => {
    const settings = [];
    if (isPrivate) settings.push('Private');
    if (muteReplies) settings.push('Replies muted');
    if (disableReposts) settings.push('Reposts disabled');
    return settings.length > 0 ? settings.join(' • ') : 'Public';
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit();
    }
  };

  const handleCancel = () => {
    if (threadContent.trim().length > 0) {
      if (window.confirm('Discard this thread? Changes cannot be recovered.')) {
        navigate('/');
      }
    } else {
      navigate('/');
    }
  };

  const FollowerPreview = () => (
    <motion.div
      className="followers-preview"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <h4>Your Followers ({followers.length})</h4>
      {followers.length === 0 ? (
        <div className="no-followers">
          <p>👥 You don't have any followers yet.</p>
          <p>Your private threads will only be visible to you.</p>
        </div>
      ) : (
        <div className="followers-list">
          {followers.slice(0, 8).map(follower => (
            <motion.div
              key={follower.id}
              className="follower-preview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="follower-avatar">
                {follower.profileImage ? (
                  follower.profileImage.startsWith('data:') || follower.profileImage.startsWith('http') ? (
                    <img src={follower.profileImage} alt={follower.username} />
                  ) : (
                    <span className="avatar-emoji">{follower.profileImage}</span>
                  )
                ) : (
                  <span className="avatar-placeholder">👤</span>
                )}
              </div>
              <div className="follower-info">
                <span className="follower-name">{follower.username}</span>
                {follower.location && <span className="follower-location">📍 {follower.location}</span>}
              </div>
            </motion.div>
          ))}
          {followers.length > 8 && (
            <div className="more-followers">
              +{followers.length - 8} more follower{followers.length - 8 !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );

  if (!user) {
    return (
      <div className="new-thread-page">
        <div className="loading-container">
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ⏳
          </motion.div>
          <p>Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="new-thread-page">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="success-toast"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <span className="success-icon">✅</span>
            <span className="success-text">Thread posted successfully!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.header 
        className="new-thread-header"
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        <div className="header-content">
          <motion.button 
            className="back-button"
            onClick={handleCancel}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Back"
          >
            ←
          </motion.button>
          <div className="header-title">
            <h1>Compose Thread</h1>
            <p>Share your thoughts with everyone</p>
          </div>
          <motion.button
            className={`privacy-toggle ${showPrivacyOptions ? 'active' : ''}`}
            onClick={() => setShowPrivacyOptions(!showPrivacyOptions)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            title="Privacy settings"
          >
            {getPrivacyIcon()}
          </motion.button>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="new-thread-main">
        <div className="thread-composer">
          {/* User Info */}
          <motion.div 
            className="composer-header"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="user-avatar">
              {user.profileImage ? (
                user.profileImage.startsWith('data:') || user.profileImage.startsWith('http') ? (
                  <img src={user.profileImage} alt={user.username} />
                ) : (
                  <span className="avatar-emoji">{user.profileImage}</span>
                )
              ) : (
                <span className="avatar-emoji">{user.avatar?.substring(user.avatar?.length - 2) || '👤'}</span>
              )}
            </div>
            <div className="user-info">
              <span className="username">{user.username}</span>
              {user.email && <span className="user-email">{user.email}</span>}
              {user.bio && <span className="user-bio">{user.bio}</span>}
              <div className="user-stats">
                <span>📍 {user.location || 'Location not set'}</span>
                <span>•</span>
                <span>👥 {followers.length} follower{followers.length !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </motion.div>

          {/* Privacy Indicator */}
          <motion.div 
            className="privacy-indicator"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <span className="privacy-icon">{getPrivacyIcon()}</span>
            <span className="privacy-text">{getPrivacyDescription()}</span>
            {isPrivate && followers.length > 0 && (
              <motion.button
                className="view-followers-btn"
                onClick={() => setShowFollowersPreview(!showFollowersPreview)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                title="View followers"
              >
                👀
              </motion.button>
            )}
          </motion.div>

          {/* Followers Preview */}
          <AnimatePresence>
            {showFollowersPreview && isPrivate && <FollowerPreview />}
          </AnimatePresence>

          {/* Text Area */}
          <motion.div
            className="text-composer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <textarea
              value={threadContent}
              onChange={handleContentChange}
              onKeyPress={handleKeyPress}
              placeholder="What's on your mind? Share your thoughts, ideas, or questions..."
              className="thread-textarea"
              autoFocus
              maxLength={MAX_CHARACTERS}
            />
            
            {/* Character Counter */}
            <div className="character-counter">
              <motion.span
                className={`count ${characterCount > MAX_CHARACTERS * 0.8 ? 'warning' : ''} ${characterCount === MAX_CHARACTERS ? 'limit' : ''}`}
                animate={characterCount === MAX_CHARACTERS ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {characterCount}
              </motion.span>
              <span className="max-count">/ {MAX_CHARACTERS}</span>
            </div>
          </motion.div>

          {/* Privacy Options Panel */}
          <AnimatePresence>
            {showPrivacyOptions && (
              <motion.div
                className="privacy-options-panel"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                <h3>Privacy Settings</h3>
                
                <div className="privacy-options">
                  {/* Private Thread Option */}
                  <motion.div 
                    className={`privacy-option ${isPrivate ? 'active' : ''}`}
                    whileHover={{ x: 5 }}
                  >
                    <div className="option-header">
                      <div className="option-icon">🔒</div>
                      <div className="option-info">
                        <h4>Private Thread</h4>
                        <p>Only visible to you and your {followers.length} follower{followers.length !== 1 ? 's' : ''}</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => {
                          setIsPrivate(e.target.checked);
                          if (e.target.checked) {
                            setMuteReplies(false);
                            setDisableReposts(false);
                          }
                        }}
                      />
                      <span className="slider"></span>
                    </label>
                  </motion.div>

                  {/* Mute Replies Option */}
                  <motion.div 
                    className={`privacy-option ${muteReplies ? 'active' : ''}`}
                    whileHover={{ x: 5 }}
                  >
                    <div className="option-header">
                      <div className="option-icon">🔇</div>
                      <div className="option-info">
                        <h4>Mute Replies</h4>
                        <p>No one can comment on this thread</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={muteReplies}
                        onChange={(e) => {
                          setMuteReplies(e.target.checked);
                          if (e.target.checked) {
                            setIsPrivate(false);
                          }
                        }}
                        disabled={isPrivate}
                      />
                      <span className="slider"></span>
                    </label>
                  </motion.div>

                  {/* Disable Reposts Option */}
                  <motion.div 
                    className={`privacy-option ${disableReposts ? 'active' : ''}`}
                    whileHover={{ x: 5 }}
                  >
                    <div className="option-header">
                      <div className="option-icon">🚫</div>
                      <div className="option-info">
                        <h4>Disable Reposts</h4>
                        <p>No one can repost this thread</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={disableReposts}
                        onChange={(e) => setDisableReposts(e.target.checked)}
                        disabled={isPrivate}
                      />
                      <span className="slider"></span>
                    </label>
                  </motion.div>

                  {/* Public Option */}
                  <motion.div 
                    className={`privacy-option ${!isPrivate && !muteReplies && !disableReposts ? 'active' : ''}`}
                    whileHover={{ x: 5 }}
                  >
                    <div className="option-header">
                      <div className="option-icon">🌐</div>
                      <div className="option-info">
                        <h4>Public Thread</h4>
                        <p>Visible to everyone with full interactions</p>
                      </div>
                    </div>
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={!isPrivate && !muteReplies && !disableReposts}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setIsPrivate(false);
                            setMuteReplies(false);
                            setDisableReposts(false);
                          }
                        }}
                      />
                      <span className="slider"></span>
                    </label>
                  </motion.div>
                </div>

                <motion.div 
                  className="privacy-note"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <p>💡 <strong>Tip:</strong> Private threads are automatically hidden from non-followers.</p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <motion.div 
            className="composer-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="action-buttons">
              <motion.button
                className="cancel-btn"
                onClick={handleCancel}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ← Cancel
              </motion.button>
              
              <motion.button
                className={`submit-btn ${!threadContent.trim() || isSubmitting ? 'disabled' : ''}`}
                onClick={handleSubmit}
                disabled={!threadContent.trim() || isSubmitting}
                whileHover={!threadContent.trim() || isSubmitting ? {} : { scale: 1.05 }}
                whileTap={!threadContent.trim() || isSubmitting ? {} : { scale: 0.95 }}
              >
                {isSubmitting ? (
                  <>
                    <motion.span
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      ⏳
                    </motion.span>
                    Publishing...
                  </>
                ) : (
                  <>
                    Post {getPrivacyIcon()}
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Preview Section */}
        {threadContent.trim() && (
          <motion.div
            className="thread-preview-section"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <h3>Preview</h3>
            <motion.div className="preview-card">
              <div className="preview-header">
                <div className="preview-avatar">
                  {user.profileImage ? (
                    user.profileImage.startsWith('data:') || user.profileImage.startsWith('http') ? (
                      <img src={user.profileImage} alt={user.username} />
                    ) : (
                      <span className="avatar-emoji">{user.profileImage}</span>
                    )
                  ) : (
                    <span className="avatar-emoji">👤</span>
                  )}
                </div>
                <div className="preview-user">
                  <span className="preview-username">{user.username}</span>
                  <span className="preview-time">Just now</span>
                </div>
                <div className="preview-privacy">
                  {getPrivacyIcon()}
                </div>
              </div>
              <div className="preview-content">
                <p>{threadContent}</p>
              </div>
              <div className="preview-stats">
                <span className="privacy-badge">{getPrivacySettingsSummary()}</span>
                {isPrivate && followers.length > 0 && (
                  <span className="follower-preview-text">
                    👥 {followers.length} follower{followers.length !== 1 ? 's' : ''} will see this
                  </span>
                )}
              </div>
              <div className="preview-actions">
                <button disabled className="preview-action" title="Like">
                  {isPrivate ? '🔒' : '🤍'} {isPrivate ? 'Private' : '0'}
                </button>
                <button disabled className="preview-action" title="Reply">
                  💬 {muteReplies || isPrivate ? '🔇' : '0'}
                </button>
                <button disabled className="preview-action" title="Repost">
                  🔄 {disableReposts || isPrivate ? '🚫' : '0'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default NewThread;