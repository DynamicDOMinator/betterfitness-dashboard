'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const storedToken = Cookies.get('admin_token');
    const storedUser = Cookies.get('admin_user');
    
    if (storedToken && storedUser && storedUser !== 'undefined') {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        // Clear invalid cookies
        Cookies.remove('admin_token');
        Cookies.remove('admin_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('https://dashboard.bettrfitness.com/admin/login', {
        username,
        password
      });

      if (response.data.success) {
        const { token, admin } = response.data.data; // Note: data is nested in response.data.data
        
        // Store token and user data in cookies
        Cookies.set('admin_token', token, { expires: 1 }); // 1 day
        Cookies.set('admin_user', JSON.stringify(admin), { expires: 1 });
        
        setToken(token);
        setUser(admin);
        
        // Redirect to dashboard after successful login
        window.location.href = '/dashboard';
        
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Invalid credentials');
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.response) {
        throw new Error(error.response.data.message || 'Invalid credentials');
      } else if (error.request) {
        throw new Error('Unable to connect to server. Please check if the backend is running.');
      } else {
        throw new Error(error.message || 'Login failed');
      }
    }
  };

  const logout = () => {
    Cookies.remove('admin_token');
    Cookies.remove('admin_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated: !!token
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};