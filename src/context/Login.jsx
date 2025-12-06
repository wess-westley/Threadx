// REPLACE THE ENTIRE Login.jsx FILE WITH THIS

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const timersRef = useRef([]); // store both timeouts and intervals

  const [currentView, setCurrentView] = useState('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    otp: '',
    newPassword: '',
    confirmNewPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [progress, setProgress] = useState(0);
  const [showTick, setShowTick] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  // OTP constant for development/testing
  const FIXED_OTP = '123456';

  useEffect(() => {
    // cleanup on unmount
    return () => {
      timersRef.current.forEach(id => {
        try {
          clearTimeout(id);
          clearInterval(id);
        } catch (e) {
          // ignore
        }
      });
      timersRef.current = [];
    };
  }, []);

  const viewVariants = {
    enter: { x: 300, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -300, opacity: 0 }
  };

  // ---- Input handlers & validators ----
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!formData.username) newErrors.username = 'Username or email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForgotPassword = () => {
    if (!formData.username) {
      setErrors({ username: 'Username is required to recover password' });
      return false;
    }
    return true;
  };

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

  const validateResetPassword = () => {
    const newErrors = {};
    if (!formData.newPassword) newErrors.newPassword = 'New password is required';
    else if (formData.newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';

    if (formData.newPassword !== formData.confirmNewPassword) {
      newErrors.confirmNewPassword = 'Passwords do not match';
    }

    // Check against existing saved plain-text password (no hashing)
    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = users.find(u => u.email === userEmail);
    if (user && user.password === formData.newPassword) {
      newErrors.newPassword = 'New password cannot be the same as old password';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ---- Animation / overlay logic (fixed timing + cleanup) ----
  const startLoginAnimation = () => {
    // show overlay and start a timed progress to 100% in 10s
    setShowOverlay(true);
    setProgress(0);
    setShowTick(false);

    const start = Date.now();
    const durationMs = 10000; // 10 seconds to reach 100%

    // interval updates progress every 100ms
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - start;
      const pct = Math.min(100, Math.round((elapsed / durationMs) * 100));
      setProgress(pct);

      // when reached 100, show tick and schedule redirect
      if (pct >= 100) {
        clearInterval(intervalId);
        // show checkmark a little after reaching 100%
        const tickTimeout = setTimeout(() => {
          setShowTick(true);
        }, 300);
        timersRef.current.push(tickTimeout);

        // navigate after short pause (give user the tick)
        const redirectTimeout = setTimeout(() => {
          setShowOverlay(false);
          navigate('/');
        }, 1300);
        timersRef.current.push(redirectTimeout);
      }
    }, 100);

    timersRef.current.push(intervalId);
  };

  // ---- Action handlers ----
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateLogin()) return;

    setIsLoading(true);

    try {
      // login function from context; expected to accept plain-text password
      const result = await login(formData.username, formData.password);

      if (result && result.success === true) {
        setIsLoading(false);
        startLoginAnimation();
      } else {
        setIsLoading(false);
        setErrors({ general: result?.error || 'Invalid username or password' });
      }
    } catch (err) {
      setIsLoading(false);
      setErrors({ general: 'Something went wrong. Please try again.' });
      console.error('Login error', err);
    }
  };

  const handleForgotPasswordStart = (e) => {
    e.preventDefault();
    if (!validateForgotPassword()) return;

    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');
    const user = users.find(u => u.username === formData.username || u.email === formData.username);

    if (user) {
      setUserEmail(user.email);
      setCurrentView('forgot-password');
      // For dev/testing we show the OTP. In production, you'd send an email.
      console.info(`OTP for ${user.email}: ${FIXED_OTP}`);
      alert(`OTP sent to your email: ${FIXED_OTP}`);
    } else {
      setErrors({ username: 'Username not found' });
    }
  };

  const handleOTPVerify = (e) => {
    e.preventDefault();
    if (validateOTP()) {
      setCurrentView('reset-password');
      setFormData(prev => ({ ...prev, otp: '' }));
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!validateResetPassword()) return;

    setIsLoading(true);

    // simulate small server delay
    await new Promise(r => setTimeout(r, 700));

    const users = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

    // Save plain-text new password (per request)
    const updatedUsers = users.map(u =>
      u.email === userEmail ? { ...u, password: formData.newPassword } : u
    );
    localStorage.setItem('registeredUsers', JSON.stringify(updatedUsers));

    // also update currentUser if matches
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser && currentUser.email === userEmail) {
      localStorage.setItem('currentUser', JSON.stringify({ ...currentUser, password: formData.newPassword }));
    }

    setIsLoading(false);
    setCurrentView('success');

    // return to login after a short delay
    const successTimeout = setTimeout(() => {
      setCurrentView('login');
      setFormData(prev => ({ ...prev, password: '', newPassword: '', confirmNewPassword: '' }));
      setErrors({});
    }, 2000);
    timersRef.current.push(successTimeout);
  };

  const handleRegisterRedirect = () => {
    navigate('/register');
  };

  // ---- small UI toggles ----
  const togglePasswordVisibility = () => setShowPassword(v => !v);
  const toggleNewPasswordVisibility = () => setShowNewPassword(v => !v);
  const toggleConfirmNewPasswordVisibility = () => setShowConfirmNewPassword(v => !v);

  // ---- render ----
  return (
    <>
      {/* OVERLAY */}
      {showOverlay && (
        <div className="threadx-login-overlay-root">
          <div className="threadx-overlay-content">
            {!showTick ? (
              <div className="threadx-spinner" aria-hidden>
                <div className="threadx-spinner-ring" />
              </div>
            ) : (
              <div className="threadx-checkmark" aria-hidden>✓</div>
            )}

            <h3>{showTick ? 'Welcome to ThreadX!' : 'Preparing Your Experience...'}</h3>
            <p>{showTick ? 'Redirecting to your feed...' : 'Loading your personalized timeline...'}</p>

            <div className="threadx-progress-wrapper" aria-hidden>
              <div className="threadx-progress-bar" style={{ width: `${progress}%` }} />
              <div className="threadx-progress-text">{progress}% Complete</div>
            </div>

            <div className="threadx-countdown">
              {showTick ? 'Redirecting...' : `Loading... ${Math.ceil((10000 - (progress / 100) * 10000) / 1000)}s`}
            </div>
          </div>
        </div>
      )}

      {/* MAIN LOGIN */}
      <div className="login-container">
        <motion.div
          className="login-background"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <div className="floating-shapes">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                className="floating-shape"
                animate={{ y: [0, -18, 0], rotate: [0, 180, 360] }}
                transition={{ duration: 6 + i * 0.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            ))}
          </div>
        </motion.div>

        <motion.div
          className="login-card"
          initial={{ scale: 0.9, opacity: 0, y: 40 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, type: 'spring', stiffness: 120 }}
        >
          <div className="app-header">
            <div className="logo-container">
              <div className="thread-icon-mini">● ● ●</div>
              <h1 className="app-name">Thread<span style={{ color: '#FF6B6B' }}>X</span></h1>
            </div>
            <p className="app-tagline">Connect. Share. Inspire.</p>
          </div>

          <AnimatePresence mode="wait">
            {currentView === 'login' && (
              <motion.form
                key="login"
                variants={viewVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={handleLogin}
                className="login-form"
              >
                <motion.h2>Welcome Back</motion.h2>
                <motion.p className="form-subtitle">Sign in to your ThreadX account</motion.p>

                {errors.general && <div className="error-message">{errors.general}</div>}

                <div className="form-group">
                  <label>Username or Email</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username or email"
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>

                <div className="form-group">
                  <label>Password</label>
                  <div className="password-input-container">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Enter your password"
                      className={errors.password ? 'error' : ''}
                    />
                    <button type="button" className="password-toggle" onClick={togglePasswordVisibility} aria-label="Toggle password visibility">
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.password && <span className="error-text">{errors.password}</span>}
                </div>

                <button className="login-btn" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="button-loading">
                      <motion.div
                        className="spinner"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Signing in...
                    </div>
                  ) : (
                    'Sign In to ThreadX 🚀'
                  )}
                </button>

                <div className="form-links">
                  <button
                    type="button"
                    className="forgot-password-link"
                    onClick={() => setCurrentView('forgot-password-username')}
                  >
                    Forgot Password?
                  </button>
                </div>
              </motion.form>
            )}

            {currentView === 'forgot-password-username' && (
              <motion.form
                key="forgot-password-username"
                variants={viewVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={handleForgotPasswordStart}
                className="forgot-password-form"
              >
                <h2>Reset Your Password</h2>
                <p className="form-subtitle">Enter your username to receive a password reset OTP</p>

                <div className="form-group">
                  <label>Username</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="Enter your username"
                    className={errors.username ? 'error' : ''}
                  />
                  {errors.username && <span className="error-text">{errors.username}</span>}
                </div>

                <button type="submit" className="submit-btn">Send Reset OTP 📧</button>
                <button type="button" className="back-btn" onClick={() => setCurrentView('login')}>← Back to Login</button>
              </motion.form>
            )}

            {currentView === 'forgot-password' && (
              <motion.form
                key="forgot-password"
                variants={viewVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={handleOTPVerify}
                className="otp-form"
              >
                <h2>Verify Your Identity</h2>
                <p className="form-subtitle">We've sent a 6-digit OTP to your registered email</p>

                <div className="otp-note">
                  💡 <strong>Development Note:</strong> Use OTP: <span className="otp-code">{FIXED_OTP}</span>
                </div>

                <div className="form-group">
                  <label>Enter OTP</label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleInputChange}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    className={errors.otp ? 'error' : ''}
                  />
                  {errors.otp && <span className="error-text">{errors.otp}</span>}
                </div>

                <button type="submit" className="submit-btn">Verify OTP ✅</button>
                <button type="button" className="back-btn" onClick={() => setCurrentView('forgot-password-username')}>← Back</button>
              </motion.form>
            )}

            {currentView === 'reset-password' && (
              <motion.form
                key="reset-password"
                variants={viewVariants}
                initial="enter"
                animate="center"
                exit="exit"
                onSubmit={handlePasswordReset}
                className="reset-password-form"
              >
                <h2>Create New Password</h2>
                <p className="form-subtitle">Your new password must be different from previous passwords</p>

                <div className="form-group">
                  <label>New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      placeholder="Enter new password"
                      className={errors.newPassword ? 'error' : ''}
                    />
                    <button type="button" className="password-toggle" onClick={toggleNewPasswordVisibility}>
                      {showNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}
                </div>

                <div className="form-group">
                  <label>Confirm New Password</label>
                  <div className="password-input-container">
                    <input
                      type={showConfirmNewPassword ? 'text' : 'password'}
                      name="confirmNewPassword"
                      value={formData.confirmNewPassword}
                      onChange={handleInputChange}
                      placeholder="Confirm new password"
                      className={errors.confirmNewPassword ? 'error' : ''}
                    />
                    <button type="button" className="password-toggle" onClick={toggleConfirmNewPasswordVisibility}>
                      {showConfirmNewPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                  {errors.confirmNewPassword && <span className="error-text">{errors.confirmNewPassword}</span>}
                </div>

                <button className="submit-btn" type="submit" disabled={isLoading}>
                  {isLoading ? (
                    <div className="button-loading">
                      <motion.div
                        className="spinner"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Resetting...
                    </div>
                  ) : (
                    'Reset Password 🔒'
                  )}
                </button>
                <button type="button" className="back-btn" onClick={() => setCurrentView('forgot-password')}>← Back</button>
              </motion.form>
            )}

            {currentView === 'success' && (
              <motion.div
                key="success"
                variants={viewVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="success-view"
              >
                <div className="success-icon">✅</div>
                <h2>Password Reset Successful!</h2>
                <p>Your password has been updated successfully. Redirecting to login...</p>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="register-prompt">
            <p>New to ThreadX?</p>
            <button className="register-redirect-btn" onClick={handleRegisterRedirect}>Create Account 🎉</button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
