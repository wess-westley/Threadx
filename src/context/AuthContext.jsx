// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';
import CryptoJS from 'crypto-js';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------- LOAD USER FROM LOCAL STORAGE ----------
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('threadx_user');
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Error loading user from storage:", error);
      localStorage.removeItem('threadx_user');
    }
    setLoading(false);
  }, []);

  // ---------- HASH PASSWORD ----------
  const hashPassword = (password) => {
    return CryptoJS.SHA256(password).toString();
  };

  // ---------- LOGIN ----------
  const login = async (email, password) => {
    try {
      if (!email || !password) return { success: false, error: 'Email and password are required' };

      const demoUsers = {
        'demo@threadx.com': {
          id: 1,
          username: 'demo_user',
          email: 'demo@threadx.com',
          avatar: 'https://ui-avatars.com/api/?name=Demo+User&background=FF6B6B&color=fff',
          bio: 'ThreadX demo user exploring the platform!',
          joinDate: new Date().toISOString(),
          location: 'Kerugoya',
        },
        'dev@threadx.com': {
          id: 2,
          username: 'threadx_dev',
          email: 'dev@threadx.com',
          avatar: 'https://ui-avatars.com/api/?name=ThreadX+Dev&background=1E1E2F&color=fff',
          bio: 'Developer building amazing features for ThreadX!',
          joinDate: new Date().toISOString(),
          location: 'Nairobi',
        }
      };

      // Check if user is a demo user
      if (demoUsers[email] && password === 'password123') {
        const demoUser = demoUsers[email];
        setUser(demoUser);
        localStorage.setItem('threadx_user', JSON.stringify(demoUser));
        localStorage.setItem('threadx_token', 'mock_jwt_token');
        
        // Store the hashed password for demo user
        const hashedPassword = hashPassword(password);
        localStorage.setItem(`password_${demoUser.id}`, hashedPassword);
        
        return { success: true };
      }

      // Check registered users
      const existingUsers = JSON.parse(localStorage.getItem('threadx_users') || '[]');
      const foundUser = existingUsers.find(u => u.email === email);

      if (foundUser) {
        const storedPassword = localStorage.getItem(`password_${foundUser.id}`);
        const hashedPassword = hashPassword(password);

        if (storedPassword && hashedPassword === storedPassword) {
          setUser(foundUser);
          localStorage.setItem('threadx_user', JSON.stringify(foundUser));
          localStorage.setItem('threadx_token', 'mock_jwt_token');
          return { success: true };
        } else {
          return { success: false, error: 'Invalid email or password' };
        }
      }

      if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters long' };

      // Create new user
      const mockUser = {
        id: Date.now(),
        username: email.split('@')[0],
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(email.split('@')[0])}&background=FF6B6B&color=fff`,
        bio: 'ThreadX enthusiast sharing thoughts and ideas!',
        joinDate: new Date().toISOString(),
        location: '',
      };

      existingUsers.push(mockUser);
      localStorage.setItem('threadx_users', JSON.stringify(existingUsers));
      
      // Store the hashed password
      const hashedPassword = hashPassword(password);
      localStorage.setItem(`password_${mockUser.id}`, hashedPassword);

      setUser(mockUser);
      localStorage.setItem('threadx_user', JSON.stringify(mockUser));
      localStorage.setItem('threadx_token', 'mock_jwt_token');

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: 'Invalid credentials' };
    }
  };

  // ---------- REGISTER ----------
  const register = async (username, email, password, location = '') => {
    try {
      if (!username || !email || !password) return { success: false, error: 'All fields are required' };
      if (username.length < 3) return { success: false, error: 'Username must be at least 3 characters long' };
      if (password.length < 6) return { success: false, error: 'Password must be at least 6 characters long' };

      const existingUsers = JSON.parse(localStorage.getItem('threadx_users') || '[]');

      const userExists = existingUsers.some(
        user => user.username === username || user.email === email
      );
      if (userExists) return { success: false, error: 'Username or email already exists' };

      const newUser = {
        id: Date.now(),
        username,
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF6B6B&color=fff`,
        bio: 'New ThreadX user!',
        joinDate: new Date().toISOString(),
        location,
      };

      existingUsers.push(newUser);
      localStorage.setItem('threadx_users', JSON.stringify(existingUsers));

      // Store the hashed password
      const hashedPassword = hashPassword(password);
      localStorage.setItem(`password_${newUser.id}`, hashedPassword);

      setUser(newUser);
      localStorage.setItem('threadx_user', JSON.stringify(newUser));
      localStorage.setItem('threadx_token', 'mock_jwt_token');

      return { success: true };
    } catch (error) {
      console.error("Registration error:", error);
      return { success: false, error: 'Registration failed. Please try again.' };
    }
  };

  // ---------- LOGOUT ----------
  const logout = () => {
    setUser(null);
    localStorage.removeItem('threadx_user');
    localStorage.removeItem('threadx_token');
  };

  // ---------- UPDATE PROFILE ----------
  const updateProfile = (updatedData) => {
    if (!user) return;

    const updatedUser = { ...user, ...updatedData };

    setUser(updatedUser);
    localStorage.setItem('threadx_user', JSON.stringify(updatedUser));

    try {
      const existingUsers = JSON.parse(localStorage.getItem('threadx_users') || '[]');
      const updatedUsers = existingUsers.map(u =>
        u.id === updatedUser.id ? updatedUser : u
      );
      localStorage.setItem('threadx_users', JSON.stringify(updatedUsers));
    } catch (error) {
      console.error('Error updating users list:', error);
    }
  };

  // ---------- VERIFY CURRENT PASSWORD ----------
  const verifyPassword = (currentPassword) => {
    if (!user) return false;

    try {
      const hashedPassword = hashPassword(currentPassword);
      const storedPassword = localStorage.getItem(`password_${user.id}`);

      if (!storedPassword) {
        // For demo users without stored password, check against demo password
        const hashedDemoPassword = hashPassword('password123');
        return hashedPassword === hashedDemoPassword;
      }

      return hashedPassword === storedPassword;
    } catch (error) {
      console.error('Error verifying password:', error);
      return false;
    }
  };

  // ---------- CHECK IF NEW PASSWORD IS DIFFERENT ----------
  const isPasswordDifferent = (newPassword) => {
    if (!user) return false;

    try {
      const hashedNewPassword = hashPassword(newPassword);
      const storedPassword = localStorage.getItem(`password_${user.id}`);

      if (!storedPassword) {
        // For demo users, check against demo password
        const hashedDemoPassword = hashPassword('password123');
        return hashedNewPassword !== hashedDemoPassword;
      }

      return hashedNewPassword !== storedPassword;
    } catch (error) {
      console.error('Error checking password difference:', error);
      return true;
    }
  };

  // ---------- CHANGE PASSWORD ----------
  const changePassword = (newPassword) => {
    if (!user) return false;

    try {
      const hashedPassword = hashPassword(newPassword);
      localStorage.setItem(`password_${user.id}`, hashedPassword);
      return true;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    verifyPassword,
    isPasswordDifferent,
    changePassword,
    hashPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}