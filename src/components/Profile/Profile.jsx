import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import "./Profile.css";

function Profile() {
  const { user: authUser, updateProfile } = useAuth();

  // ---------- LOCAL STORAGE HELPERS ----------
  const get = (key, fallback) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : fallback;
    } catch {
      return fallback;
    }
  };

  const set = (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  const loadUsers = () => get("threadx_users", []);

  // ---------- CURRENT USER ----------
  const currentUser = useMemo(() => {
    if (!authUser) return {};
    const localUsers = loadUsers();
    const found = localUsers.find((u) => u.id === authUser.id);
    return found || authUser;
  }, [authUser?.id]);

  // ---------- STATE ----------
  const [isEditing, setIsEditing] = useState(false);
  const [threads, setThreads] = useState([]);
  const [followers, setFollowers] = useState(get(`followers_${authUser?.id}`, []));
  const [following, setFollowing] = useState(get(`following_${authUser?.id}`, []));
  const [suggestions, setSuggestions] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [allLocalUsers, setAllLocalUsers] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    username: currentUser.username || "",
    bio: currentUser.bio || "",
    profileImage: currentUser.profileImage || currentUser.avatar || "",
    location: currentUser.location || "",
  });

  // Detect theme changes from other components
  useEffect(() => {
    const savedTheme = localStorage.getItem('threadx_theme') || 'light';
    setDarkMode(savedTheme === 'dark');

    const handleThemeChange = (e) => {
      setDarkMode(e.detail.darkMode);
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // Sync formData and follower/following state when currentUser changes
  useEffect(() => {
    setFormData({
      username: currentUser.username || "",
      bio: currentUser.bio || "",
      profileImage: currentUser.profileImage || currentUser.avatar || "",
      location: currentUser.location || "",
    });
    if (authUser?.id) {
      setFollowers(get(`followers_${authUser.id}`, []));
      setFollowing(get(`following_${authUser.id}`, []));
    }
    setAllLocalUsers(loadUsers().filter((u) => u.id !== authUser?.id));
  }, [currentUser.id, currentUser.username, currentUser.bio, currentUser.profileImage, currentUser.location, authUser?.id]);

  // ---------- LOAD THREADS ----------
  useEffect(() => {
    setLoading(true);
    
    if (!authUser?.id) {
      setThreads([]);
      setLoading(false);
      return;
    }

    try {
      // Load from threadx_threads (correct key used in Timeline and NewThread)
      const allThreads = get("threadx_threads", []);
      
      if (!Array.isArray(allThreads)) {
        console.error("Invalid threads data format");
        setThreads([]);
        setLoading(false);
        return;
      }

      // Filter threads by current user and sort by newest first
      const userThreads = allThreads
        .filter((t) => t && t.userId === authUser.id)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

      setThreads(userThreads);
    } catch (error) {
      console.error("Error loading threads:", error);
      setThreads([]);
    }

    setLoading(false);
  }, [authUser?.id]);

  // ---------- LISTEN FOR THREAD UPDATES ----------
  useEffect(() => {
    const handleStorageChange = () => {
      if (!authUser?.id) return;

      const allThreads = get("threadx_threads", []);
      const userThreads = allThreads
        .filter((t) => t && t.userId === authUser.id)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return dateB - dateA;
        });

      setThreads(userThreads);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [authUser?.id]);

  // ---------- FOLLOW / UNFOLLOW ----------
  const updateFollow = (targetId, follow) => {
    if (!authUser?.id) return;

    const curFollowing = get(`following_${authUser.id}`, []) || [];
    let newFollowing = [...curFollowing];
    
    if (follow && !newFollowing.includes(targetId)) {
      newFollowing.push(targetId);
    }
    if (!follow) {
      newFollowing = newFollowing.filter((id) => id !== targetId);
    }
    
    set(`following_${authUser.id}`, newFollowing);
    setFollowing(newFollowing);

    // Update target user's followers
    const targetFollowersKey = `followers_${targetId}`;
    const targetFollowers = get(targetFollowersKey, []) || [];
    let newTargetFollowers = [...targetFollowers];
    
    if (follow && !newTargetFollowers.includes(authUser.id)) {
      newTargetFollowers.push(authUser.id);
    }
    if (!follow) {
      newTargetFollowers = newTargetFollowers.filter((id) => id !== authUser.id);
    }
    
    set(targetFollowersKey, newTargetFollowers);

    // Update local state
    setFollowers(get(`followers_${authUser.id}`, []));
    setAllLocalUsers(loadUsers().filter((u) => u.id !== authUser.id));
    setSuggestions((prev) => prev.filter((u) => u.id !== targetId));
  };

  const toggleFollowBoolean = (targetId) => {
    const isFollowing = (get(`following_${authUser?.id}`, []) || []).includes(targetId);
    updateFollow(targetId, !isFollowing);
  };

  // ---------- SUGGESTIONS ----------
  useEffect(() => {
    if (!authUser?.id) return;

    const allUsers = loadUsers().filter((u) => u.id !== authUser.id);
    const curFollowing = get(`following_${authUser.id}`, []) || [];

    // Nearby users (same location)
    const nearby = allUsers.filter(
      (u) =>
        u.location &&
        formData.location &&
        u.location.trim().toLowerCase() === formData.location.trim().toLowerCase()
    );

    // Mutual connections
    const myFollowers = get(`followers_${authUser.id}`, []) || [];
    const mutualSourceIds = new Set();
    
    myFollowers.forEach((fid) => {
      const fFollowers = get(`followers_${fid}`, []) || [];
      fFollowers.forEach((mid) => mutualSourceIds.add(mid));
    });

    const mutuals = allUsers.filter((u) => mutualSourceIds.has(u.id));

    // Merge and deduplicate
    const merged = [...nearby, ...mutuals].filter(
      (u, idx, self) => 
        self.findIndex((x) => x.id === u.id) === idx && !curFollowing.includes(u.id)
    );

    const others = allUsers.filter(
      (u) => !merged.find((m) => m.id === u.id) && !curFollowing.includes(u.id)
    );

    const ranked = [
      ...merged.sort((a, b) => {
        const aNear = a.location?.trim().toLowerCase() === formData.location?.trim().toLowerCase();
        const bNear = b.location?.trim().toLowerCase() === formData.location?.trim().toLowerCase();
        if (aNear && !bNear) return -1;
        if (!aNear && bNear) return 1;
        
        const aMutual = mutualSourceIds.has(a.id);
        const bMutual = mutualSourceIds.has(b.id);
        if (aMutual && !bMutual) return -1;
        if (!aMutual && bMutual) return 1;
        
        return (a.username || "").localeCompare(b.username || "");
      }),
      ...others,
    ];

    setSuggestions(ranked.slice(0, 8));
  }, [following, followers, formData.location, authUser?.id]);

  // ---------- THREAD ACTIONS ----------
  const deleteThread = (id) => {
    if (!authUser?.id) return;
    
    try {
      const all = get("threadx_threads", []) || [];
      const updated = all.filter((t) => t && t.id !== id);
      set("threadx_threads", updated);
      
      const userThreads = updated
        .filter((t) => t && t.userId === authUser.id)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      setThreads(userThreads);
    } catch (error) {
      console.error("Error deleting thread:", error);
    }
  };

  const togglePrivacy = (id) => {
    if (!authUser?.id) return;
    
    try {
      const all = get("threadx_threads", []) || [];
      const updated = all.map((t) =>
        t && t.id === id
          ? { ...t, isPrivate: !t.isPrivate, updatedAt: new Date().toISOString() }
          : t
      );
      set("threadx_threads", updated);
      
      const userThreads = updated
        .filter((t) => t && t.userId === authUser.id)
        .sort((a, b) => {
          const dateA = new Date(a.timestamp || a.createdAt || 0).getTime();
          const dateB = new Date(b.timestamp || b.createdAt || 0).getTime();
          return dateB - dateA;
        });
      setThreads(userThreads);
    } catch (error) {
      console.error("Error toggling privacy:", error);
    }
  };

  // ---------- AVATAR UPLOAD ----------
  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profileImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // ---------- SAVE PROFILE ----------
  const saveProfile = () => {
    if (!authUser?.id) return;

    try {
      const updatedUser = {
        ...currentUser,
        username: formData.username,
        bio: formData.bio,
        profileImage: formData.profileImage,
        location: formData.location,
        updatedAt: new Date().toISOString(),
      };

      // Update AuthContext
      updateProfile(updatedUser);

      // Update threadx_users
      const users = loadUsers();
      const idx = users.findIndex((u) => u.id === authUser.id);
      if (idx >= 0) {
        users[idx] = updatedUser;
      } else {
        users.push(updatedUser);
      }
      set("threadx_users", users);

      setAllLocalUsers(loadUsers().filter((u) => u.id !== authUser.id));
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const openAddFollows = () => {
    setAllLocalUsers(loadUsers().filter((u) => u.id !== authUser?.id));
    setShowAddModal(true);
  };

  const closeAddFollows = () => setShowAddModal(false);

  // ---------- RENDER ----------
  if (!authUser) {
    return (
      <div className="profile-page">
        <motion.div
          className="loading-container"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ⏳
          </motion.div>
          <p>Loading profile...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      {/* Header */}
      <motion.div
        className="profile-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <h1>{currentUser.username || "Profile"}</h1>
      </motion.div>

      {/* Profile Card */}
      <motion.div
        className="profile-card"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="profile-avatar-section">
          <div className="profile-avatar-wrapper">
            {formData.profileImage ? (
              formData.profileImage.startsWith("data:") ? (
                <img src={formData.profileImage} className="profile-avatar" alt="Profile" />
              ) : (
                <span className="profile-avatar-emoji">{formData.profileImage}</span>
              )
            ) : (
              <span className="profile-avatar-placeholder">👤</span>
            )}
          </div>
          {isEditing && (
            <label className="change-avatar-btn">
              📁 Change Photo
              <input type="file" accept="image/*" hidden onChange={handleAvatarChange} />
            </label>
          )}
        </div>

        <div className="profile-info">
          {isEditing ? (
            <motion.div
              className="edit-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <div className="form-group">
                <label>Username</label>
                <input
                  className="form-input"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Bio</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label>Location</label>
                <input
                  className="form-input"
                  placeholder="e.g., Kerugoya, Kirinyaga"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                />
              </div>
              <div className="profile-actions">
                <motion.button
                  className="cancel-btn"
                  onClick={() => setIsEditing(false)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Cancel
                </motion.button>
                <motion.button
                  className="save-btn"
                  onClick={saveProfile}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              className="profile-details"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <h2>{currentUser.username}</h2>
              {currentUser.bio && <p className="profile-bio">{currentUser.bio}</p>}
              <p className="profile-location">
                {currentUser.location
                  ? `📍 ${currentUser.location}`
                  : "Add your location for better suggestions"}
              </p>
              <p className="profile-join-date">
                Joined{" "}
                {currentUser.joinDate
                  ? new Date(currentUser.joinDate).toLocaleDateString("en-US", {
                      month: "long",
                      year: "numeric",
                    })
                  : "recently"}
              </p>
              <motion.button
                className="edit-profile-btn"
                onClick={() => setIsEditing(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                ✎ Edit Profile
              </motion.button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div
        className="profile-stats"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <motion.div className="stat" whileHover={{ scale: 1.05 }}>
          <span className="stat-number">{threads.length}</span>
          <span className="stat-label">Threads</span>
        </motion.div>
        <motion.div className="stat" whileHover={{ scale: 1.05 }}>
          <span className="stat-number">{followers.length}</span>
          <span className="stat-label">Followers</span>
        </motion.div>
        <motion.div className="stat" whileHover={{ scale: 1.05 }}>
          <span className="stat-number">{following.length}</span>
          <span className="stat-label">Following</span>
        </motion.div>
      </motion.div>

      {/* User Threads */}
      <motion.div
        className="threads-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <h2>Your Threads</h2>
        {loading ? (
          <motion.div
            className="loading-spinner"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            ⏳
          </motion.div>
        ) : threads.length === 0 ? (
          <motion.p
            className="empty-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No threads yet. Create your first thread! 🚀
          </motion.p>
        ) : (
          <AnimatePresence mode="popLayout">
            {threads.map((thread, idx) => (
              <motion.div
                key={thread.id}
                className="thread-card"
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: idx * 0.05 }}
              >
                <div className="thread-header">
                  <span className="thread-time">
                    {new Date(thread.timestamp || thread.createdAt).toLocaleString("en-US", {
                      hour: "2-digit",
                      minute: "2-digit",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className={`privacy-badge ${thread.isPrivate ? "private" : "public"}`}>
                    {thread.isPrivate ? "🔒 Private" : "🌐 Public"}
                  </span>
                </div>

                <p className="thread-content">{thread.content}</p>

                <div className="thread-meta">
                  <span className="thread-engagement">
                    ❤️ {thread.likes || 0} • 💬 {thread.comments?.length || 0} • 🔄 {thread.reposts || 0}
                  </span>
                </div>

                <div className="thread-actions">
                  <motion.button
                    className="privacy-btn"
                    onClick={() => togglePrivacy(thread.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title={thread.isPrivate ? "Make public" : "Make private"}
                  >
                    {thread.isPrivate ? "🔓 Make Public" : "🔒 Make Private"}
                  </motion.button>
                  <motion.button
                    className="delete-btn"
                    onClick={() => deleteThread(thread.id)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    title="Delete thread"
                  >
                    🗑️ Delete
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Suggestions */}
      <motion.div
        className="suggestions-section"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="suggestions-header">
          <h2>Who to follow</h2>
          <motion.button
            className="add-follows-btn"
            onClick={openAddFollows}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            👥 Browse All
          </motion.button>
        </div>
        {suggestions.length === 0 ? (
          <motion.p
            className="empty-text"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            No suggestions yet. Add your location to discover nearby users.
          </motion.p>
        ) : (
          <AnimatePresence>
            {suggestions.map((u) => {
              const isFollowing = following.includes(u.id);
              return (
                <motion.div
                  key={u.id}
                  className="suggestion-card"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="suggestion-avatar-wrapper">
                    {u.profileImage ? (
                      u.profileImage.startsWith("data:") ? (
                        <img
                          src={u.profileImage}
                          className="suggestion-avatar"
                          alt={u.username}
                        />
                      ) : (
                        <span className="suggestion-avatar-emoji">{u.profileImage}</span>
                      )
                    ) : (
                      <span className="suggestion-avatar-placeholder">👤</span>
                    )}
                  </div>
                  <div className="suggestion-info">
                    <p className="suggestion-name">{u.username}</p>
                    {u.location && (
                      <p className="suggestion-location">📍 {u.location}</p>
                    )}
                  </div>
                  <div className="suggestion-actions">
                    <motion.button
                      className={isFollowing ? "unfollow-btn" : "follow-btn"}
                      onClick={() => updateFollow(u.id, !isFollowing)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isFollowing ? "− Unfollow" : "+ Follow"}
                    </motion.button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </motion.div>

      {/* Add Follows Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            className="modal-backdrop"
            onClick={closeAddFollows}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="modal"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <div className="modal-header">
                <h3>Browse All Users</h3>
                <motion.button
                  className="modal-close"
                  onClick={closeAddFollows}
                  whileHover={{ scale: 1.2, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                >
                  ✕
                </motion.button>
              </div>
              <div className="modal-body">
                {allLocalUsers.length === 0 ? (
                  <motion.p
                    className="empty-text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    No other users found. Invite friends to join ThreadX!
                  </motion.p>
                ) : (
                  <AnimatePresence>
                    {allLocalUsers.map((u) => {
                      const isFollowing = following.includes(u.id);
                      return (
                        <motion.div
                          key={u.id}
                          className="modal-user-card"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          whileHover={{ x: 5 }}
                        >
                          <div className="modal-user-avatar-wrapper">
                            {u.profileImage ? (
                              u.profileImage.startsWith("data:") ? (
                                <img
                                  src={u.profileImage}
                                  className="modal-user-avatar"
                                  alt={u.username}
                                />
                              ) : (
                                <span className="modal-user-avatar-emoji">{u.profileImage}</span>
                              )
                            ) : (
                              <span className="modal-user-avatar-placeholder">👤</span>
                            )}
                          </div>
                          <div className="modal-user-info">
                            <p className="modal-user-name">{u.username}</p>
                            {u.location && (
                              <p className="modal-user-location">📍 {u.location}</p>
                            )}
                          </div>
                          <motion.button
                            className={isFollowing ? "unfollow-btn" : "follow-btn"}
                            onClick={() => toggleFollowBoolean(u.id)}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {isFollowing ? "− Unfollow" : "+ Follow"}
                          </motion.button>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
              <div className="modal-footer">
                <motion.button
                  className="close-modal-main"
                  onClick={closeAddFollows}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Profile;