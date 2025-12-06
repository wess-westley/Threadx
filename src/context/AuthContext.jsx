// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------- LOAD USER ----------
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem('threadx_user');
      if (savedUser) {
        const parsedUser = JSON.parse(savedUser);
        console.log("✓ User loaded from localStorage:", parsedUser);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("❌ Error loading user:", error);
      localStorage.removeItem('threadx_user');
    }
    setLoading(false);
  }, []);

  // ---------- LOGIN ----------
  const login = async (identifier, password) => {
    try {
      if (!identifier || !password) {
        console.error("❌ Missing identifier or password");
        return { success: false, error: "Email/Username and password are required" };
      }

      const idLower = identifier.toLowerCase();

      // ----- DEMO USERS -----
      const demoUsers = {
        "demo@threadx.com": {
          id: "demo1",
          username: "demo_user",
          email: "demo@threadx.com",
          avatar: "https://ui-avatars.com/api/?name=Demo+User&background=FF6B6B&color=fff",
          bio: "ThreadX demo user exploring the platform!",
          joinDate: new Date().toISOString(),
          location: "Kerugoya",
        },
        "dev@threadx.com": {
          id: "dev1",
          username: "threadx_dev",
          email: "dev@threadx.com",
          avatar: "https://ui-avatars.com/api/?name=ThreadX+Dev&background=1E1E2F&color=fff",
          bio: "Developer building amazing features for ThreadX!",
          joinDate: new Date().toISOString(),
          location: "Nairobi",
        },
      };

      // Check demo users
      for (const key in demoUsers) {
        const u = demoUsers[key];
        if (
          u.email.toLowerCase() === idLower ||
          u.username.toLowerCase() === idLower
        ) {
          if (password !== "password123") {
            console.error("❌ Invalid password for demo user");
            return { success: false, error: "Invalid password" };
          }

          console.log("✓ Demo user login successful:", u.username);
          localStorage.setItem("threadx_user", JSON.stringify(u));
          setUser(u);
          return { success: true };
        }
      }

      // ----- REGISTERED USERS -----
      const users = JSON.parse(localStorage.getItem("threadx_users") || "[]");
      console.log("📋 Total registered users:", users.length);

      const found = users.find(
        (u) =>
          (u.username && u.username.toLowerCase() === idLower) ||
          (u.email && u.email.toLowerCase() === idLower)
      );

      if (!found) {
        console.error("❌ User not found:", identifier);
        return { success: false, error: "User not found. Please register." };
      }

      console.log("✓ User found:", found.username);

      const storedPassword = localStorage.getItem(`password_${found.id}`);
      console.log("🔍 Checking password for user ID:", found.id);
      console.log("📦 Stored password exists:", !!storedPassword);

      if (!storedPassword) {
        console.error("❌ No password stored for this user (ID: " + found.id + ")");
        return { success: false, error: "No password stored for this user. Please re-register." };
      }

      if (storedPassword !== password) {
        console.error("❌ Password mismatch");
        return { success: false, error: "Invalid password" };
      }

      console.log("✓ Password verified successfully");
      localStorage.setItem("threadx_user", JSON.stringify(found));
      setUser(found);

      return { success: true };

    } catch (err) {
      console.error("❌ LOGIN ERROR:", err);
      return { success: false, error: "Login failed. Try again." };
    }
  };

  // ---------- REGISTER ----------
  const register = async (username, email, password, location = '') => {
    try {
      console.log("🔄 Starting registration for:", username);

      if (!username || !email || !password) {
        console.error("❌ Missing required fields");
        return { success: false, error: 'All fields required' };
      }

      if (username.length < 3) {
        console.error("❌ Username too short");
        return { success: false, error: 'Username must be at least 3 characters' };
      }

      if (password.length < 6) {
        console.error("❌ Password too short");
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const users = JSON.parse(localStorage.getItem('threadx_users') || '[]');
      console.log("📋 Current total users in database:", users.length);

      const exists = users.some(
        u => u.username === username || u.email === email
      );
      if (exists) {
        console.error("❌ Username or email already exists");
        return { success: false, error: 'Username or email already exists' };
      }

      const newUser = {
        id: Date.now().toString(), // Convert to string for consistency
        username,
        email,
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=FF6B6B&color=fff`,
        bio: 'New ThreadX user!',
        joinDate: new Date().toISOString(),
        location,
      };

      console.log("✓ Creating new user:", newUser);

      // Step 1: Add user to users list
      users.push(newUser);
      localStorage.setItem('threadx_users', JSON.stringify(users));
      console.log("✓ User added to users list");

      // Step 2: Store the password
      const passwordKey = `password_${newUser.id}`;
      localStorage.setItem(passwordKey, password);
      console.log("✓ Password stored with key:", passwordKey);

      // Verify password was stored
      const verifyPassword = localStorage.getItem(passwordKey);
      console.log("✓ Password verification:", verifyPassword === password ? "PASSED" : "FAILED");

      // Step 3: Set current user session
      localStorage.setItem('threadx_user', JSON.stringify(newUser));
      console.log("✓ Current user session set");

      // Step 4: Set token
      localStorage.setItem('threadx_token', 'mock_jwt_token');
      console.log("✓ Token set");

      // Step 5: Update React state
      setUser(newUser);
      console.log("✓ React state updated");

      console.log("✅ Registration successful for:", username);
      return { success: true, user: newUser };

    } catch (error) {
      console.error("❌ Registration error:", error);
      return { success: false, error: 'Registration failed. ' + error.message };
    }
  };

  // ---------- LOGOUT ----------
  const logout = () => {
    console.log("🚪 Logging out user:", user?.username);
    setUser(null);
    localStorage.removeItem('threadx_user');
    localStorage.removeItem('threadx_token');
    console.log("✓ User session cleared");
  };

  // ---------- UPDATE PROFILE ----------
  const updateProfile = (updatedData) => {
    if (!user) {
      console.error("❌ No user to update");
      return;
    }

    const updatedUser = { ...user, ...updatedData };
    console.log("🔄 Updating profile for:", user.username);

    setUser(updatedUser);
    localStorage.setItem('threadx_user', JSON.stringify(updatedUser));
    console.log("✓ Current user profile updated");

    try {
      const users = JSON.parse(localStorage.getItem('threadx_users') || '[]');
      const updatedUsers = users.map(u =>
        u.id === updatedUser.id ? updatedUser : u
      );
      localStorage.setItem('threadx_users', JSON.stringify(updatedUsers));
      console.log("✓ User profile updated in users list");
    } catch (error) {
      console.error('❌ Error updating profile list:', error);
    }
  };

  // ---------- VERIFY PASSWORD ----------
  const verifyPassword = (currentPassword) => {
    if (!user) {
      console.error("❌ No user to verify password for");
      return false;
    }

    const storedPassword = localStorage.getItem(`password_${user.id}`);
    const isValid = storedPassword === currentPassword;
    console.log("🔍 Password verification:", isValid ? "PASSED" : "FAILED");
    return isValid;
  };

  // ---------- CHECK IF NEW PASSWORD IS DIFFERENT ----------
  const isPasswordDifferent = (newPassword) => {
    if (!user) {
      console.error("❌ No user for password comparison");
      return true;
    }

    const storedPassword = localStorage.getItem(`password_${user.id}`);
    const isDifferent = storedPassword !== newPassword;
    console.log("🔄 Password different:", isDifferent);
    return isDifferent;
  };

  // ---------- CHANGE PASSWORD ----------
  const changePassword = (newPassword) => {
    if (!user) {
      console.error("❌ No user to change password for");
      return false;
    }

    try {
      localStorage.setItem(`password_${user.id}`, newPassword);
      console.log("✓ Password changed for user:", user.username);
      return true;
    } catch (error) {
      console.error("❌ Error changing password:", error);
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
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}