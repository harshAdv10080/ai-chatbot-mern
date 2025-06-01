import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const AuthContext = createContext();

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, loading: false };
    case 'SET_TOKEN':
      return { ...state, token: action.payload };
    case 'LOGOUT':
      return { ...state, user: null, token: null, isAuthenticated: false, loading: false };
    case 'UPDATE_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
};

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: true,
  error: null,
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Load user on app start
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('token');
      
      if (token) {
        try {
          api.setAuthToken(token);
          const response = await api.get('/auth/me');
          
          dispatch({ type: 'SET_USER', payload: response.data.user });
          dispatch({ type: 'SET_TOKEN', payload: token });
        } catch (error) {
          console.error('Failed to load user:', error);
          localStorage.removeItem('token');
          api.setAuthToken(null);
          dispatch({ type: 'LOGOUT' });
        }
      } else {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadUser();
  }, []);

  // Login function
  const login = async (email, password, twoFactorToken = null, backupCode = null) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const loginData = { email, password };
      if (twoFactorToken) loginData.twoFactorToken = twoFactorToken;
      if (backupCode) loginData.backupCode = backupCode;

      const response = await api.post('/auth/login', loginData);

      // Check if 2FA is required
      if (response.data.requires2FA) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return {
          success: false,
          requires2FA: true,
          message: response.data.message
        };
      }

      const { token, user } = response.data;

      localStorage.setItem('token', token);
      api.setAuthToken(token);

      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_TOKEN', payload: token });

      toast.success('Welcome back!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Register function
  const register = async (name, email, password) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.post('/auth/register', { name, email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      api.setAuthToken(token);

      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_TOKEN', payload: token });

      toast.success('Account created successfully!');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    api.setAuthToken(null);
    dispatch({ type: 'LOGOUT' });
    toast.success('Logged out successfully');
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await api.put('/auth/profile', profileData);
      const { user } = response.data;

      dispatch({ type: 'UPDATE_USER', payload: user });
      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    }
  };

  // Refresh token function
  const refreshToken = async () => {
    try {
      const response = await api.post('/auth/refresh');
      const { token } = response.data;

      localStorage.setItem('token', token);
      api.setAuthToken(token);
      dispatch({ type: 'SET_TOKEN', payload: token });

      return { success: true };
    } catch (error) {
      console.error('Token refresh failed:', error);
      logout();
      return { success: false };
    }
  };

  // Check if user has enough tokens
  const hasTokensAvailable = (tokensNeeded = 1) => {
    if (!state.user) return false;
    return state.user.subscription.tokensUsed + tokensNeeded <= state.user.subscription.tokensLimit;
  };

  // Update token usage
  const updateTokenUsage = (tokensUsed) => {
    if (state.user) {
      dispatch({
        type: 'UPDATE_USER',
        payload: {
          subscription: {
            ...state.user.subscription,
            tokensUsed: state.user.subscription.tokensUsed + tokensUsed
          }
        }
      });
    }
  };

  // Get token usage percentage
  const getTokenUsagePercentage = () => {
    if (!state.user) return 0;
    const { tokensUsed, tokensLimit } = state.user.subscription;
    return Math.round((tokensUsed / tokensLimit) * 100);
  };

  // Check if token limit is near
  const isTokenLimitNear = (threshold = 80) => {
    return getTokenUsagePercentage() >= threshold;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    refreshToken,
    hasTokensAvailable,
    updateTokenUsage,
    getTokenUsagePercentage,
    isTokenLimitNear,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
