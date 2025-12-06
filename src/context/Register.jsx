import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./register.css";

const PRESET_AVATARS = [
  "👨‍💻", "👩‍💻", "🧑‍🎨", "👨‍🎓", "👩‍🎓",
  "🧑‍💼", "👨‍🚀", "👩‍🚀", "🧑‍🏫", "👨‍⚕️",
];

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    location: "",
    avatar: null,
  });

  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPresetAvatars, setShowPresetAvatars] = useState(false);
  const fileInputRef = useRef();

  // ------------------------ INPUT CHANGE ------------------------
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  // ------------------------ FILE UPLOAD ------------------------
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please upload a valid image file");
      return;
    }

    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        avatar: reader.result,
      }));
      setUploading(false);
      setShowPresetAvatars(false);
    };
    reader.onerror = () => {
      setError("Failed to read file");
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  // ------------------------ SELECT PRESET AVATAR ------------------------
  const selectPresetAvatar = (emoji) => {
    setFormData((prev) => ({
      ...prev,
      avatar: emoji,
    }));
    setShowPresetAvatars(false);
  };

  // ------------------------ VALIDATE FORM ------------------------
  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Username is required");
      return false;
    }
    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    if (!formData.confirmPassword) {
      setError("Please confirm your password");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return false;
    }
    if (!formData.location.trim()) {
      setError("Location is required");
      return false;
    }
    if (!formData.avatar) {
      setError("Please select or upload a profile photo");
      return false;
    }
    return true;
  };

  // ------------------------ SUBMIT ------------------------
const handleSubmit = async (e) => {
  e.preventDefault();
  setError("");
  setSuccess("");
  console.log("📝 Form submission started");

  if (!validateForm()) {
    console.error("❌ Form validation failed");
    return;
  }

  setLoading(true);

  await new Promise((resolve) => setTimeout(resolve, 1500));

  try {
    const { username, email, password, location, avatar } = formData;

    console.log("📤 Sending registration data for:", username);

    const response = await register(username, email, password, location);

    if (!response.success) {
      console.error("❌ Registration failed:", response.error);
      setError(response.error);
      setLoading(false);
      return;
    }

    console.log("✓ Registration successful");

    if (avatar) {
      try {
        const currentUser = JSON.parse(localStorage.getItem("threadx_user"));
        if (currentUser) {
          const updatedUser = { ...currentUser, avatar };
          localStorage.setItem("threadx_user", JSON.stringify(updatedUser));

          const allUsers = JSON.parse(localStorage.getItem("threadx_users") || "[]");
          const updatedUsers = allUsers.map((u) =>
            u.id === updatedUser.id ? updatedUser : u
          );
          localStorage.setItem("threadx_users", JSON.stringify(updatedUsers));
        }
      } catch (avatarErr) {
        console.error("❌ Avatar update error:", avatarErr);
      }
    }

    setLoading(false); 
    setSuccess("Account created successfully! Redirecting to login...");

    setFormData({
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      location: "",
      avatar: null,
    });

    setTimeout(() => {
      console.log("🔄 Redirecting to login");
      navigate("/login");
    }, 2000);

  } catch (err) {
    console.error("❌ Registration error:", err);
    setError("Registration failed. Please try again.");
    setLoading(false);
  }
};


  return (
    <div className="register-container">
      <motion.div
        className="register-box"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* HEADER */}
        <div className="register-header">
          <h1 className="register-title">ThreadX</h1>
          <p className="register-subtitle">Create your account</p>
        </div>

        {/* ERROR MESSAGE */}
        <AnimatePresence>
          {error && (
            <motion.div
              className="error-box"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <span className="error-icon">⚠️</span>
              <p>{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* SUCCESS MESSAGE */}
        <AnimatePresence>
          {success && (
            <motion.div
              className="success-box"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              <span className="success-icon">✓</span>
              <p>{success}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="register-form">
          {/* Username */}
          <div className="input-group">
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Choose your username"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Email */}
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="your@email.com"
              value={formData.email}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div className="input-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Confirm Password */}
          <div className="input-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Location */}
          <div className="input-group">
            <label htmlFor="location">Location</label>
            <input
              type="text"
              id="location"
              name="location"
              placeholder="Your city or region"
              value={formData.location}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Avatar Section */}
          <div className="input-group">
            <label>Profile Photo</label>

            {/* Avatar Preview */}
            <AnimatePresence>
              {formData.avatar && (
                <motion.div
                  className="avatar-preview-container"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="avatar-display">
                    {typeof formData.avatar === "string" &&
                    formData.avatar.length < 5 ? (
                      <span className="avatar-emoji">{formData.avatar}</span>
                    ) : (
                      <img
                        src={formData.avatar}
                        alt="profile"
                        className="avatar-image"
                      />
                    )}
                  </div>
                  <button
                    type="button"
                    className="remove-avatar-btn"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, avatar: null }))
                    }
                    disabled={loading}
                  >
                    Change
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Avatar Options */}
            <AnimatePresence>
              {!formData.avatar && (
                <motion.div
                  className="avatar-options"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <button
                    type="button"
                    className="avatar-option-btn upload-btn"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading || loading}
                  >
                    {uploading ? (
                      <>
                        <motion.span
                          className="spinner-mini"
                          animate={{ rotate: 360 }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                        />
                        Uploading...
                      </>
                    ) : (
                      <>📸 Upload Photo</>
                    )}
                  </button>

                  <button
                    type="button"
                    className="avatar-option-btn emoji-btn"
                    onClick={() => setShowPresetAvatars(!showPresetAvatars)}
                    disabled={loading}
                  >
                    😊 Choose Emoji
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preset Avatars */}
            <AnimatePresence>
              {showPresetAvatars && !formData.avatar && (
                <motion.div
                  className="preset-avatars-grid"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  {PRESET_AVATARS.map((emoji, idx) => (
                    <motion.button
                      key={idx}
                      type="button"
                      className="preset-avatar"
                      onClick={() => selectPresetAvatar(emoji)}
                      disabled={loading}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {emoji}
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>

            {/* File Input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: "none" }}
              disabled={loading}
            />
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="register-btn"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
          >
            {loading ? (
              <>
                <motion.span
                  className="spinner-mini"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
                Creating Account...
              </>
            ) : (
              "Create Account"
            )}
          </motion.button>
        </form>

        {/* Login Redirect */}
        <div className="login-redirect">
          <p>
            Already have an account?{" "}
            <motion.button
              type="button"
              className="login-link-btn"
              onClick={() => navigate("/login")}
              disabled={loading}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Login here
            </motion.button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}