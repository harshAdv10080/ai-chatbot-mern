import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { authAPI } from '../services/api';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const { user } = useAuth();

  // Initialize dark mode from user preference or localStorage
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        // First check user's database preference
        if (user.preferences?.theme === 'dark') {
          return true;
        } else if (user.preferences?.theme === 'light') {
          return false;
        }
        // Fallback to localStorage for this user
        const saved = localStorage.getItem(`darkMode_${user._id}`);
        return saved ? JSON.parse(saved) : false;
      }
      // For non-logged in users, check system preference
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Update theme when user changes (login/logout)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (user) {
        // Load user's theme preference
        let userTheme = false;

        if (user.preferences?.theme === 'dark') {
          userTheme = true;
        } else if (user.preferences?.theme === 'light') {
          userTheme = false;
        } else if (user.preferences?.theme === 'system') {
          userTheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
        } else {
          // Fallback to localStorage
          const saved = localStorage.getItem(`darkMode_${user._id}`);
          userTheme = saved ? JSON.parse(saved) : false;
        }

        setIsDarkMode(userTheme);
      } else {
        // User logged out, reset to system preference
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDarkMode(systemDark);
      }
    }
  }, [user]);

  // Apply dark mode class to document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Save to user-specific localStorage
    if (user) {
      localStorage.setItem(`darkMode_${user._id}`, JSON.stringify(isDarkMode));
    }
  }, [isDarkMode, user]);

  const toggleDarkMode = async () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);

    // Update user preference in database if logged in
    if (user) {
      try {
        await authAPI.updateProfile({
          preferences: {
            ...user.preferences,
            theme: newTheme ? 'dark' : 'light'
          }
        });
      } catch (error) {
        console.error('Failed to update theme preference:', error);
        // Theme still changes locally even if database update fails
      }
    }
  };

  // Clean up old generic theme data (migration helper)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Remove old generic darkMode key if it exists
      const oldTheme = localStorage.getItem('darkMode');
      if (oldTheme !== null) {
        localStorage.removeItem('darkMode');
        console.log('Cleaned up old theme data');
      }
    }
  }, []);

  const value = {
    isDarkMode,
    toggleDarkMode,
    setDarkMode: setIsDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
