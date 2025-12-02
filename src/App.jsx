import React, { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Navigate
} from 'react-router-dom';
import './App.css';

// Components
import Header from './components/Header/Header';
import Navbar from './components/Navbar';
import Timeline from './components/Header/Timeline/Timeline';
import NewThread from './components/Header/NewThread/NewThread';
import Profile from './components/Profile/Profile';
import Login from './context/Login';
import Register from './context/Register';
import Settings from './components/settings';
import Alert from './components/Header/Timeline/Alert';
import { AuthProvider, useAuth } from './context/AuthContext';

function App() {
  const [darkMode, setDarkMode] = useState(false);

  // Initialize theme from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem('threadx_theme') || 'light';
    setDarkMode(savedTheme === 'dark');
    applyTheme(savedTheme);
  }, []);

  // Listen for theme changes from Settings component
  useEffect(() => {
    const handleThemeChange = (e) => {
      setDarkMode(e.detail.darkMode);
      applyTheme(e.detail.darkMode ? 'dark' : 'light');
    };

    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, []);

  // Apply theme to document
  const applyTheme = (theme) => {
    const root = document.documentElement;
    const isDark = theme === 'dark';

    if (isDark) {
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

    document.body.style.backgroundColor = isDark ? '#0F0F1A' : '#F5F5F5';
    document.body.style.color = isDark ? '#E4E4E6' : '#333333';
  };

  return (
    <AuthProvider>
      <Router>
        <div className={`App ${darkMode ? 'dark-mode' : 'light-mode'}`}>
          <AppContent />
        </div>
      </Router>
    </AuthProvider>
  );
}

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <div className="threadx-logo">
            <div className="thread-icon">
              <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="10" cy="10" r="3" fill="#FF6B6B" />
                <circle cx="20" cy="20" r="3" fill="#FF6B6B" />
                <circle cx="30" cy="30" r="3" fill="#FF6B6B" />
                <line x1="10" y1="10" x2="30" y2="30" stroke="#FF6B6B" strokeWidth="2" />
              </svg>
            </div>
            <h1>ThreadX</h1>
          </div>
        </div>
        <p>Loading your experience...</p>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <Routes>
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={!user ? <Login /> : <Navigate to="/" />} 
        />
        <Route 
          path="/register" 
          element={!user ? <Register /> : <Navigate to="/" />} 
        />
        
        {/* Protected Routes */}
        <Route 
          path="/*" 
          element={user ? <AuthenticatedLayout /> : <PublicLayout />} 
        />
      </Routes>
    </div>
  );
}

// Layout for authenticated users
function AuthenticatedLayout() {
  return (
    <div className="authenticated-layout">
      <Header />
      <div className="main-content-wrapper">
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="/new" element={<NewThread />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/alert" element={<Alert />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      <Navbar />
    </div>
  );
}

// Layout for unauthenticated users
function PublicLayout() {
  return (
    <div className="public-layout">
      <Header />
      <div className="main-content-wrapper">
        <Routes>
          <Route path="/" element={<Timeline />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;