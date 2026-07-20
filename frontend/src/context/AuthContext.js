import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (googleToken) => {
    try {
      setLoading(true);
      localStorage.setItem('token', googleToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${googleToken}`;
      setToken(googleToken);
      
      const response = await axios.get('/api/auth/me');
      setUser(response.data.user);
      
      toast.success('Successfully logged in!');
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Login failed');
      return { success: false, error: error.response?.data?.error };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const verifyStudent = async (studentId) => {
    try {
      const response = await axios.post('/api/auth/verify', { studentId });
      setUser(response.data.user);
      toast.success('Student ID verified successfully!');
      return { success: true, user: response.data.user };
    } catch (error) {
      console.error('Verification error:', error);
      toast.error(error.response?.data?.error || 'Verification failed');
      return { success: false, error: error.response?.data?.error };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    verifyStudent,
    isAuthenticated: !!user,
    isVerified: user?.is_verified || false,
    isAdmin: user?.role === 'admin' || user?.role === 'faculty',
    isStudent: user?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
