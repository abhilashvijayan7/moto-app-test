import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check session on mount to restore user data
  useEffect(() => {
    const restoreSession = async () => {
      try {
        // Restore user from localStorage
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        // Validate session with backend
        const response = await axios.get(
          'https://water-pump.onrender.com/api/users/session/session-check',
          { withCredentials: true }
        );

        console.log('Session check response:', response.data);

        if (response.data.loggedIn === true && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('user', JSON.stringify(response.data.user));
        } else {
          setUser(null);
          localStorage.removeItem('user');
        }
      } catch (error) {
        console.error('Session check error:', error.response?.data || error.message);
        setUser(null);
        localStorage.removeItem('user');
      } finally {
        setIsCheckingSession(false);
      }
    };

    restoreSession();
  }, []);

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsCheckingSession(false);
  };

  const logout = async () => {
    try {
      await axios.post(
        'https://water-pump.onrender.com/api/users/logout',
        {},
        { withCredentials: true }
      );
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout error:', error.response?.data || error.message);
    } finally {
      setIsCheckingSession(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, login, logout, isCheckingSession }}>
      {children}
    </UserContext.Provider>
  );
};