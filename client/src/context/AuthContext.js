import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from '../utils/axiosConfig';

const AuthContext = createContext({});

// Configure axios defaults for auth
const setAuthToken = (token) => {
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('token', token);
  } else {
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('token');
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setAuthToken(token);
      fetchUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
      setError(null);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setUser(null);
      setAuthToken(null);
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (username, password) => {
    setError(null);
    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, user } = response.data;
      
      setAuthToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Register function
  const register = async (userData) => {
    setError(null);
    try {
      const response = await axios.post('/api/auth/register', userData);
      const { token, user } = response.data;
      
      setAuthToken(token);
      setUser(user);
      
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de l\'inscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    setAuthToken(null);
    setError(null);
  };

  // Update profile function
  const updateProfile = async (profileData) => {
    try {
      const response = await axios.put('/api/auth/profile', profileData);
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors de la mise à jour du profil';
      return { success: false, error: errorMessage };
    }
  };

  // Change password function
  const changePassword = async (currentPassword, newPassword) => {
    try {
      await axios.put('/api/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Erreur lors du changement de mot de passe';
      return { success: false, error: errorMessage };
    }
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isManager: user?.role === 'manager',
    isStaff: user?.role === 'staff',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
