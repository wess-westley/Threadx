import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from "react-router-dom";

import './settings.css';

const Settings = () => {
  const { user: authUser, updateProfile, logout, changePassword, verifyPassword, isPasswordDifferent } = useAuth();
  const [activeSection, setActiveSection] = useState('profile');
  const [darkMode, setDarkMode] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Form states
  const [profileData, setProfileData] = useState({
    username: '',
    email: '',
    bio: '',
    location: '',
    profileImage: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  
  const [deleteData, setDeleteData] = useState({
    reason: '',
    confirmText: ''
  });

  // Visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Errors
  const [errors, setErrors] = useState({});

  // Avatar options
  const avatarOptions = [
    '👨‍💼', '👩‍💼', '👨‍🚀', '👩‍🚀', '👨‍🔬', '👩‍🔬', '🎨', '👾',
    '🐱', '🐶', '🦊', '🐼', '🦁', '🐯', '🐨', '🐻'
  ];

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

  const sectionVariants = {
    hidden: { x: 50, opacity: 0 },
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        duration: 0.4
      }
    }
  };

  // Initialize user data and theme
  useEffect(() => {
    if (authUser) {
      setProfileData({
        username: authUser.username || '',
        email: authUser.email || '',
        bio: authUser.bio || '',
        location: authUser.location || '',
        profileImage: authUser.profileImage || authUser.avatar || ''
      });
    }

    const savedTheme = localStorage.getItem('threadx_theme') || 'light';
    setDarkMode(savedTheme === 'dark');
  }, [authUser]);

  // Apply theme to document
  const applyTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.style.setProperty('--bg-primary', '#0F0F1A');
      root.style.setProperty('--bg-secondary', '#1A1A2E');
      root.style.setProperty('--text-primary', '#E4E4E6');
      root.style.setProperty('--text-secondary', '#A0A0A8');
      root.classList.add('dark-mode');
      root.classList.remove('light-mode');
    } else {
      root.style.setProperty('--bg-primary', '#F5F5F5');
      root.style.setProperty('--bg-secondary', '#FFFFFF');
      root.style.setProperty('--text-primary', '#333333');
      root.style.setProperty('--text-secondary', '#666666');
      root.classList.add('light-mode');
      root.classList.remove('dark-mode');
    }
    localStorage.setItem('threadx_theme', theme);
  };

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    applyTheme(newMode ? 'dark' : 'light');
    
    // Dispatch event so App.jsx listens
    window.dispatchEvent(new CustomEvent('themeChange', { detail: { darkMode: newMode } }));
  };

  // Handle profile updates
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setErrors({});

    // Validate
    if (!profileData.username || !profileData.email) {
      setErrors({ general: 'Username and email are required' });
      setIsLoading(false);
      return;
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update in AuthContext
    const updatedUser = {
      ...authUser,
      username: profileData.username,
      email: profileData.email,
      bio: profileData.bio,
      location: profileData.location,
      profileImage: profileData.profileImage || authUser.avatar,
      updatedAt: new Date().toISOString()
    };

    updateProfile(updatedUser);

    // Update in threadx_users list
    try {
      const users = JSON.parse(localStorage.getItem('threadx_users') || '[]');
      const updatedUsers = users.map(u =>
        u.id === authUser.id ? updatedUser : u
      );
      localStorage.setItem('threadx_users', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error updating users list:', error);
    }

    setIsLoading(false);
    showSuccessMessage('✅ Profile updated successfully!');
  };

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const newErrors = {};

    // 1. Verify current password is correct
    if (!verifyPassword(passwordData.currentPassword)) {
      newErrors.currentPassword = '❌ Current password is incorrect';
    }

    // 2. Check if new password is provided
    if (!passwordData.newPassword) {
      newErrors.newPassword = '❌ New password is required';
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = '❌ Password must be at least 6 characters';
    }

    // 3. Check if passwords match
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
      newErrors.confirmNewPassword = '❌ Passwords do not match';
    }

    // 4. Check if new password is different from current password
    if (passwordData.newPassword && !isPasswordDifferent(passwordData.newPassword)) {
      newErrors.newPassword = '❌ New password must be different from current password';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Change password
    const passwordChanged = changePassword(passwordData.newPassword);

    if (passwordChanged) {
      // Reset form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmNewPassword: ''
      });

      setIsLoading(false);
      showSuccessMessage('✅ Password updated successfully!');
        window.location.href = '/login';
    } 
    else {
      setIsLoading(false);
      setErrors({ general: '❌ Error updating password. Please try again.' });
    }
  };

  // Handle account deletion
  const handleAccountDelete = async (e) => {
    e.preventDefault();
    
    if (deleteData.confirmText !== 'DELETE MY ACCOUNT') {
      setErrors({ confirmText: 'Please type "DELETE MY ACCOUNT" to confirm' });
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const userId = authUser?.id;

      // 1. Remove user from threadx_users
      const users = JSON.parse(localStorage.getItem('threadx_users') || '[]');
      const filteredUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('threadx_users', JSON.stringify(filteredUsers));

      // 2. Remove all threads of this user
      const threads = JSON.parse(localStorage.getItem('threadx_threads') || '[]');
      const filteredThreads = threads.filter(t => t.userId !== userId);
      localStorage.setItem('threadx_threads', JSON.stringify(filteredThreads));

      // 3. Remove user's followers data
      localStorage.removeItem(`followers_${userId}`);

      // 4. Remove user's following data
      localStorage.removeItem(`following_${userId}`);

      // 5. Remove user's alerts
      localStorage.removeItem(`threadx_alerts_${userId}`);

      // 6. Remove password
      localStorage.removeItem(`password_${userId}`);

      // 7. Remove any other user-specific keys
      const keysToCheck = Object.keys(localStorage);
      keysToCheck.forEach(key => {
        if (key.includes(String(userId))) {
          localStorage.removeItem(key);
        }
      });

      // 8. Show success message
      setIsLoading(false);
      showSuccessMessage('🗑️ Account deleted successfully. Redirecting...');

      // 9. Logout from AuthContext
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, 2000);

    } catch (error) {
      console.error('Error deleting account:', error);
      setIsLoading(false);
      setErrors({ general: 'Error deleting account. Please try again.' });
    }
  };

  // Show success message
  const showSuccessMessage = (message) => {
    setShowSuccess(message);
    setTimeout(() => setShowSuccess(''), 3000);
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setProfileData(prev => ({ ...prev, profileImage: avatar }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setProfileData(prev => ({ ...prev, profileImage: event.target.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Navigation items
  const navItems = [
    { id: 'profile', label: 'Profile Settings', icon: '👤' },
    { id: 'security', label: 'Security', icon: '🔒' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'account', label: 'Account', icon: '⚙️' }
  ];

  if (!authUser) {
    return (
      <div className="settings-container">
        <motion.div
          className="loading-spinner-large"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          ⏳
        </motion.div>
      </div>
    );
  }

  return (
    <div className="settings-container">
      {/* Success Message */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            className="success-message"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
          >
            <span className="success-icon">{showSuccess}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        className="settings-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div className="settings-header" variants={containerVariants}>
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
              <motion.h1 variants={itemVariants}>Settings</motion.h1>
              <motion.p variants={itemVariants}>
                Manage your ThreadX account preferences
              </motion.p>
            </div>
          </div>
        </motion.div>

        <div className="settings-content">
          {/* Navigation */}
          <motion.nav className="settings-nav" variants={containerVariants}>
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                onClick={() => setActiveSection(item.id)}
                variants={itemVariants}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </motion.button>
            ))}
          </motion.nav>

          {/* Content Sections */}
          <motion.div
            className="settings-section"
            key={activeSection}
            variants={sectionVariants}
            initial="hidden"
            animate="visible"
          >
            {/* Profile Settings */}
            {activeSection === 'profile' && (
              <motion.form onSubmit={handleProfileUpdate} variants={containerVariants}>
                <h2>Profile Settings</h2>
                
                <motion.div variants={itemVariants} className="avatar-section">
                  <h3>Profile Picture</h3>
                  <div className="avatar-preview-container">
                    <motion.div 
                      className="avatar-preview"
                      whileHover={{ scale: 1.05 }}
                    >
                      {profileData.profileImage ? (
                        profileData.profileImage.startsWith('data:') ? (
                          <img src={profileData.profileImage} alt="Profile" />
                        ) : (
                          <span className="avatar-emoji">{profileData.profileImage}</span>
                        )
                      ) : (
                        <div className="avatar-placeholder">👤</div>
                      )}
                    </motion.div>
                  </div>

                  <div className="avatar-options">
                    <h4>Choose Avatar</h4>
                    <div className="avatar-grid">
                      {avatarOptions.map((avatar, index) => (
                        <motion.button
                          key={index}
                          type="button"
                          className={`avatar-option ${profileData.profileImage === avatar ? 'selected' : ''}`}
                          onClick={() => handleAvatarSelect(avatar)}
                          whileHover={{ scale: 1.1, rotate: 5 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          {avatar}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="upload-section">
                    <input
                      type="file"
                      id="avatar-upload"
                      onChange={handleFileUpload}
                      accept="image/*"
                      style={{ display: 'none' }}
                    />
                    <motion.label
                      htmlFor="avatar-upload"
                      className="upload-btn"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      📁 Upload Custom Image
                    </motion.label>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    className={errors.username ? 'error' : ''}
                    placeholder="Enter your username"
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </motion.div>

                <motion.div variants={itemVariants} className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                    className={errors.email ? 'error' : ''}
                    placeholder="Enter your email"
                  />
                  {errors.email && <span className="error-text">{errors.email}</span>}
                </motion.div>

                <motion.div variants={itemVariants} className="form-group">
                  <label>Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                    className={errors.bio ? 'error' : ''}
                    placeholder="Tell us about yourself"
                    rows="3"
                  />
                  {errors.bio && <span className="error-text">{errors.bio}</span>}
                </motion.div>

                <motion.div variants={itemVariants} className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={profileData.location}
                    onChange={(e) => setProfileData(prev => ({ ...prev, location: e.target.value }))}
                    className={errors.location ? 'error' : ''}
                    placeholder="e.g., Kerugoya, Kirinyaga"
                  />
                  {errors.location && <span className="error-text">{errors.location}</span>}
                </motion.div>

                {errors.general && <span className="error-text general-error">{errors.general}</span>}

                <motion.button
                  type="submit"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="save-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : '💾 Save Profile Changes'}
                </motion.button>
              </motion.form>
            )}

            {/* Security Settings */}
            {activeSection === 'security' && (
              <motion.form onSubmit={handlePasswordChange} variants={containerVariants}>
                <h2>Security Settings</h2>
                <motion.p variants={itemVariants} className="section-description">
                  Change your password to keep your account secure. Your new password must be different from your current password.
                </motion.p>

                <motion.div variants={itemVariants} className="form-group">
                  <label>Current Password</label>
                  <div className="password-input-container">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      className={errors.currentPassword ? 'error' : ''}
                      placeholder="Enter current password"
                    />
                    <motion.button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showCurrentPassword ? '🙈' : '👁️'}
                    </motion.button>
                  </div>
                  {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
                </motion.div>

                <motion.div variants={itemVariants} className="form-group">
                  <label>New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      className={errors.newPassword ? 'error' : ''}
                      placeholder="Enter new password (min 6 characters)"
                    />
                    <motion.button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showNewPassword ? '🙈' : '👁️'}
                    </motion.button>
                  </div>
                  {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                </motion.div>

                <motion.div variants={itemVariants} className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmNewPassword ? "text" : "password"}
                      value={passwordData.confirmNewPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmNewPassword: e.target.value }))}
                      className={errors.confirmNewPassword ? 'error' : ''}
                      placeholder="Confirm new password"
                    />
                    <motion.button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                    >
                      {showConfirmNewPassword ? '🙈' : '👁️'}
                    </motion.button>
                  </div>
                  {errors.confirmNewPassword && <span className="error-text">{errors.confirmNewPassword}</span>}
                </motion.div>

                {errors.general && <span className="error-text general-error">{errors.general}</span>}

                <motion.button
                  type="submit"
                  variants={itemVariants}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="save-btn"
                  disabled={isLoading}
                >
                  {isLoading ? 'Updating...' : '🔐 Update Password'}
                </motion.button>
              </motion.form>
            )}

            {/* Appearance Settings */}
            {activeSection === 'appearance' && (
              <motion.div variants={containerVariants}>
                <h2>Appearance Settings</h2>
                <motion.p variants={itemVariants} className="section-description">
                  Customize how ThreadX looks and feels
                </motion.p>

                <motion.div variants={itemVariants} className="theme-toggle-section">
                  <div className="theme-info">
                    <h3>Dark Mode</h3>
                    <p>Switch between light and dark themes</p>
                  </div>
                  <motion.button
                    type="button"
                    className={`theme-toggle ${darkMode ? 'dark' : 'light'}`}
                    onClick={toggleDarkMode}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <motion.div
                      className="toggle-handle"
                      animate={{ x: darkMode ? 24 : 0 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    />
                    <span className="toggle-icon">{darkMode ? '🌙' : '☀️'}</span>
                  </motion.button>
                </motion.div>

                <motion.div
                  className="theme-preview"
                  variants={itemVariants}
                  animate={{
                    backgroundColor: darkMode ? '#1A1A2E' : '#FFFFFF',
                    color: darkMode ? '#E4E4E6' : '#333333'
                  }}
                >
                  <div className="preview-header">
                    <div className="preview-logo">
                      <div className="preview-dots">
                        {[...Array(3)].map((_, i) => (
                          <div key={i} className="preview-dot" />
                        ))}
                      </div>
                    </div>
                    <span>ThreadX</span>
                  </div>
                  <div className="preview-content">
                    <div className="preview-post">
                      <div className="preview-avatar">👤</div>
                      <div className="preview-text">
                        <div className="preview-line short" />
                        <div className="preview-line medium" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Account Settings */}
            {activeSection === 'account' && (
              <motion.div variants={containerVariants}>
                <h2>Account Settings</h2>
                <motion.p variants={itemVariants} className="section-description">
                  Manage your account data and preferences
                </motion.p>

                <motion.div variants={itemVariants} className="account-info">
                  <div className="info-item">
                    <span className="info-label">Account Created:</span>
                    <span className="info-value">
                      {authUser.joinDate ? new Date(authUser.joinDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Email Verified:</span>
                    <span className="info-value verified">✓ Verified</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Last Updated:</span>
                    <span className="info-value">
                      {new Date().toLocaleDateString()}
                    </span>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="danger-zone">
                  <h3>Danger Zone</h3>
                  <p>Permanently delete your account and all associated data</p>
                  <motion.button
                    type="button"
                    className="delete-account-btn"
                    onClick={() => setShowDeleteModal(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    🗑️ Delete Account
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </motion.div>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              className="delete-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2>⚠️ Delete Your Account</h2>
              <p className="warning-text">This action <strong>CANNOT</strong> be undone. All your data will be permanently removed.</p>

              <form onSubmit={handleAccountDelete}>
                <div className="form-group">
                  <label>Reason for leaving (optional)</label>
                  <textarea
                    value={deleteData.reason}
                    onChange={(e) => setDeleteData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Help us improve by sharing your reason..."
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Type <strong>DELETE MY ACCOUNT</strong> to confirm
                  </label>
                  <input
                    type="text"
                    value={deleteData.confirmText}
                    onChange={(e) => setDeleteData(prev => ({ ...prev, confirmText: e.target.value.toUpperCase() }))}
                    className={errors.confirmText ? 'error' : ''}
                    placeholder="DELETE MY ACCOUNT"
                  />
                  {errors.confirmText && <span className="error-text">{errors.confirmText}</span>}
                  {errors.general && <span className="error-text">{errors.general}</span>}
                </div>

                <div className="modal-actions">
                  <motion.button
                    type="button"
                    className="cancel-btn"
                    onClick={() => {
                      setShowDeleteModal(false);
                      setDeleteData({ reason: '', confirmText: '' });
                      setErrors({});
                    }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Cancel
                  </motion.button>
                  <motion.button
                    type="submit"
                    className="confirm-delete-btn"
                    disabled={isLoading || deleteData.confirmText !== 'DELETE MY ACCOUNT'}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {isLoading ? 'Deleting...' : 'Permanently Delete Account'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;