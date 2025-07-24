import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  // Check session on mount to restore user data if available
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await axios.get(
          'https://water-pump.onrender.com/api/users/session/session-check',
          { withCredentials: true }
        );

         console.log("hsjfhsdjhjsdhf",response.data)
        if (response.data.loggedIn === true && response.data.user) {
          setUser(response.data.user);
        }
      } catch (error) {
        console.error('Session check error:', error);
      } finally {
        setIsCheckingSession(false);
      }
    };
    checkSession();
  }, []);

  const login = (userData) => {
    setUser(userData);
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
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsCheckingSession(false);
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout, isCheckingSession }}>
      {children}
    </UserContext.Provider>
  );
};


// kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk