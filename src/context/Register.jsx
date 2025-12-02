import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CryptoJS from 'crypto-js';
import './register.css';

const Register = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    otp: '',
    profileImage: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const fileInputRef = useRef(null);

  // Fixed OTP for development
  const FIXED_OTP = '123456';

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

  const stepVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  // Avatar options
  const avatarOptions = [
    '👨‍💼', '👩‍💼', '👨‍🚀', '👩‍🚀', '👨‍🔬', '👩‍🔬', '🎨', '👾',
    '🐱', '🐶', '🦊', '🐼', '🦁', '🐯', '🐨', '🐻'
  ];

  // Check if email or username already exists
  const checkExistingUser = (email, username) => {
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const emailExists = existingUsers.some(user => user.email.toLowerCase() === email.toLowerCase());
    const usernameExists = existingUsers.some(user => user.username.toLowerCase() === username.toLowerCase());
    
    return { emailExists, usernameExists };
  };

  // Hash password using CryptoJS
  const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString();
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

    // Check for existing email/username in real-time
    if (name === 'email' && value) {
      const { emailExists } = checkExistingUser(value, '');
      if (emailExists) {
        setErrors(prev => ({ ...prev, email: 'Email already registered' }));
      }
    }

    if (name === 'username' && value) {
      const { usernameExists } = checkExistingUser('', value);
      if (usernameExists) {
        setErrors(prev => ({ ...prev, username: 'Username already taken' }));
      }
    }
  };

  // Validate registration form
  const validateRegistration = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    } else {
      const { emailExists } = checkExistingUser(formData.email, '');
      if (emailExists) {
        newErrors.email = 'Email already registered';
      }
    }
    
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else {
      const { usernameExists } = checkExistingUser('', formData.username);
      if (usernameExists) {
        newErrors.username = 'Username already taken';
      }
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate OTP
  const validateOTP = () => {
    if (!formData.otp) {
      setErrors({ otp: 'OTP is required' });
      return false;
    }
    if (formData.otp !== FIXED_OTP) {
      setErrors({ otp: 'Invalid OTP' });
      return false;
    }
    return true;
  };

  // Handle registration submission
  const handleRegister = async (e) => {
    e.preventDefault();
    if (validateRegistration()) {
      setIsLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setCurrentStep(2);
      setIsLoading(false);
    }
  };

  // Handle OTP verification
  const handleOTPVerify = (e) => {
    e.preventDefault();
    if (validateOTP()) {
      setCurrentStep(3);
    }
  };

  // Handle avatar selection
  const handleAvatarSelect = (avatar) => {
    setFormData(prev => ({
      ...prev,
      profileImage: avatar
    }));
  };

  // Handle file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        setFormData(prev => ({
          ...prev,
          profileImage: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle profile setup completion
  const handleProfileComplete = () => {
    // Hash the password before storing
    const hashedPassword = hashPassword(formData.password);
    
    // Save user data to localStorage with profile image
    const userData = {
      email: formData.email,
      username: formData.username,
      password: hashedPassword,
      profileImage: formData.profileImage || '👤', // Default avatar if none selected
      avatar: formData.profileImage || '👤', // Also store as avatar for compatibility
      bio: '', // Can be updated later in profile settings
      isVerified: true,
      registeredAt: new Date().toISOString()
    };
    
    // Get existing users or initialize empty array
    const existingUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    
    // Double-check user doesn't exist (shouldn't happen, but safety check)
    const userExists = existingUsers.some(u => u.email === userData.email);
    
    if (!userExists) {
      // Add new user
      existingUsers.push(userData);
      localStorage.setItem('registeredUsers', JSON.stringify(existingUsers));
      
      // Also create user session for immediate login
      const userSession = {
        id: userData.email,
        username: userData.username,
        email: userData.email,
        avatar: userData.profileImage,
        profileImage: userData.profileImage,
        bio: userData.bio,
        joinDate: userData.registeredAt,
        isVerified: true
      };
      
      // Store session (optional - can auto-login or redirect to login)
      localStorage.setItem('threadx_user', JSON.stringify(userSession));
      localStorage.setItem('threadx_token', 'mock_jwt_token');
      
      // Show success message with animation
      const successEvent = new CustomEvent('registrationSuccess', { 
        detail: { message: 'Registration successful! Redirecting to login...' } 
      });
      window.dispatchEvent(successEvent);
      
      // Redirect to login page after delay
      setTimeout(() => {
        // For auto-login, redirect to home/dashboard
        // window.location.href = '/';
        
        // For manual login, redirect to login page
        window.location.href = '/login';
      }, 2000);
    } else {
      alert('User already exists! Please login instead.');
      window.location.href = '/login';
    }
  };

  // Toggle password visibility
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Toggle confirm password visibility
  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Handle login redirect
  const handleLoginRedirect = () => {
    setShowLoginPrompt(true);
    setTimeout(() => {
      window.location.href = '/login';
    }, 1000);
  };

  return (
    <div className="register-container">
      <motion.div
        className="register-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        <div className="floating-shapes">
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="floating-shape"
              animate={{
                y: [0, -30, 0],
                rotate: [0, 180, 360],
                scale: [1, 1.1, 1]
              }}
              transition={{
                duration: 4 + i * 0.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ))}
        </div>
        
        {/* Animated particles */}
        <div className="particles">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="particle"
              animate={{
                y: [0, -100, 0],
                x: [0, Math.random() * 50 - 25, 0],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        className="register-card"
        initial={{ scale: 0.8, opacity: 0, y: 50 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      >
        <motion.div
          className="progress-bar"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / 3) * 100}%` }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />

        <div className="register-header">
          <motion.div
            className="logo-container"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
          >
            <div className="app-logo">🚀</div>
          </motion.div>
          
          <motion.h1
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {currentStep === 1 && 'Join Our Community'}
            {currentStep === 2 && 'Verify Your Identity'}
            {currentStep === 3 && 'Complete Your Profile'}
          </motion.h1>
          
          <motion.p
            initial={{ y: -30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {currentStep === 1 && 'Create your account in seconds'}
            {currentStep === 2 && 'Enter the OTP sent to your email'}
            {currentStep === 3 && 'Make it yours with a profile picture'}
          </motion.p>
        </div>

        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.form
              key="step1"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              onSubmit={handleRegister}
              className="register-form"
            >
              <motion.div variants={itemVariants} className="form-group">
                <label>
                  <span>Email Address</span>
                  <motion.span 
                    className="unique-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                  >
                    Must be unique
                  </motion.span>
                </label>
                <div className="input-container">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={errors.email ? 'error' : ''}
                    placeholder="your@email.com"
                  />
                  {!errors.email && formData.email && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="check-icon"
                    >
                      ✓
                    </motion.div>
                  )}
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </motion.div>

              <motion.div variants={itemVariants} className="form-group">
                <label>
                  <span>Username</span>
                  <motion.span 
                    className="unique-badge"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Must be unique
                  </motion.span>
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className={errors.username ? 'error' : ''}
                    placeholder="Choose a unique username"
                  />
                  {!errors.username && formData.username && formData.username.length >= 3 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="check-icon"
                    >
                      ✓
                    </motion.div>
                  )}
                </div>
                {errors.username && <span className="error-text">{errors.username}</span>}
              </motion.div>

              <motion.div variants={itemVariants} className="form-group">
                <label>Password</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'error' : ''}
                    placeholder="Create a strong password"
                  />
                  <motion.button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </motion.button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </motion.div>

              <motion.div variants={itemVariants} className="form-group">
                <label>Confirm Password</label>
                <div className="password-input-container">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className={errors.confirmPassword ? 'error' : ''}
                    placeholder="Repeat your password"
                  />
                  <motion.button
                    type="button"
                    className="password-toggle"
                    onClick={toggleConfirmPasswordVisibility}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </motion.button>
                </div>
                {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
              </motion.div>

              <motion.button
                type="submit"
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 25px rgba(255, 107, 107, 0.3)"
                }}
                whileTap={{ scale: 0.98 }}
                className="register-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="loading-spinner"
                  />
                ) : (
                  <span>Continue to Verification ✨</span>
                )}
              </motion.button>
            </motion.form>
          )}

          {currentStep === 2 && (
            <motion.form
              key="step2"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              onSubmit={handleOTPVerify}
              className="otp-form"
            >
              <motion.div variants={itemVariants} className="form-group">
                <div className="otp-header">
                  <div className="email-icon">📧</div>
                  <h3>Check Your Email</h3>
                </div>
                <p>
                  We've sent a 6-digit OTP to: <strong>{formData.email}</strong>
                </p>
                <div className="otp-note">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    💡 <strong>Development Note:</strong> Use OTP: <span className="otp-code">123456</span>
                  </motion.div>
                </div>
                
                <div className="otp-input-container">
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    className={errors.otp ? 'error' : ''}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                  />
                </div>
                {errors.otp && <span className="error-text">{errors.otp}</span>}
              </motion.div>

              <motion.button
                type="submit"
                variants={itemVariants}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 10px 25px rgba(255, 107, 107, 0.3)"
                }}
                whileTap={{ scale: 0.98 }}
                className="verify-btn"
              >
                Verify & Continue 🚀
              </motion.button>
            </motion.form>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              variants={stepVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4 }}
              className="profile-setup"
            >
              <motion.h3 variants={itemVariants}>Personalize Your Profile</motion.h3>
              <motion.p variants={itemVariants}>
                Choose an avatar or upload your own photo (Optional)
              </motion.p>

              <motion.div variants={itemVariants} className="current-avatar">
                <motion.div 
                  className="avatar-preview"
                  whileHover={{ scale: 1.05 }}
                  animate={{ 
                    borderColor: formData.profileImage ? '#FF6B6B' : '#e0e0e0',
                    boxShadow: formData.profileImage ? '0 10px 30px rgba(255, 107, 107, 0.2)' : 'none'
                  }}
                >
                  {formData.profileImage ? (
                    formData.profileImage.startsWith('data:') ? (
                      <img src={formData.profileImage} alt="Profile" />
                    ) : (
                      <span className="avatar-emoji">{formData.profileImage}</span>
                    )
                  ) : (
                    <div className="avatar-placeholder">👤</div>
                  )}
                </motion.div>
              </motion.div>

              <motion.div variants={itemVariants} className="avatar-options">
                <h4>Choose from Avatars</h4>
                <div className="avatar-grid">
                  {avatarOptions.map((avatar, index) => (
                    <motion.button
                      key={index}
                      type="button"
                      className={`avatar-option ${formData.profileImage === avatar ? 'selected' : ''}`}
                      onClick={() => handleAvatarSelect(avatar)}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      whileTap={{ scale: 0.9 }}
                      animate={{ 
                        borderColor: formData.profileImage === avatar ? '#FF6B6B' : '#e0e0e0',
                        backgroundColor: formData.profileImage === avatar ? '#FFF5F5' : 'white'
                      }}
                    >
                      {avatar}
                    </motion.button>
                  ))}
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="upload-section">
                <h4>Upload Your Photo</h4>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="upload-btn"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📁 Choose File
                </motion.button>
              </motion.div>

              <div className="action-buttons">
                <motion.button
                  variants={itemVariants}
                  whileHover={{ 
                    scale: 1.02,
                    boxShadow: "0 10px 25px rgba(255, 107, 107, 0.3)"
                  }}
                  whileTap={{ scale: 0.98 }}
                  className="complete-btn"
                  onClick={handleProfileComplete}
                >
                  Complete Registration 🎉
                </motion.button>

                <motion.button
                  variants={itemVariants}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="skip-btn"
                  onClick={handleProfileComplete}
                >
                  Skip for Now
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Login Prompt Section */}
        <motion.div
          className="login-prompt"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <p>Already have an account?</p>
          <motion.button
            className="login-redirect-btn"
            onClick={handleLoginRedirect}
            whileHover={{ 
              scale: 1.05,
              backgroundColor: '#1E1E2F',
              color: 'white'
            }}
            whileTap={{ scale: 0.95 }}
          >
            Sign In Here ✨
          </motion.button>
        </motion.div>

        {/* Success Animation */}
        <AnimatePresence>
          {showLoginPrompt && (
            <motion.div
              className="success-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="success-message"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <div className="success-icon">🎉</div>
                <h3>Redirecting to Login...</h3>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;