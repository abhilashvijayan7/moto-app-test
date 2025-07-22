import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Check session on mount to restore user data if available
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get(
          'https://water-pump.onrender.com/api/users/session/session-check',
          { withCredentials: true }
        );
        if (response.data.loggedIn === true && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    checkSession();
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await axios.post(
        'https://water-pump.onrender.com/api/users/logout',
        {},
        { withCredentials: true }
      );
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
};

// kdjfkjshfkjhsdkjfhsdkjfhskjdf