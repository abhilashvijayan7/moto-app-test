import React, { createContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
//1. Create the context
 const UserContext = createContext(null);

//2. Create the provider
 const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  // This state is crucial. It starts as true on page load.
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const navigate = useNavigate();
  // Check session on mount to restore user data if available
  
  // 3. The function to check the session on app load
  const checkSession = useCallback(async () => {
    try {
      const response = await axios.get(
        'https://water-pump.onrender.com/api/users/session/session-check',
        { withCredentials: true }
      );
    // If the server confirms the session is valid, restore the user object
      if (response.data.loggedIn === true && response.data.user) {
        setUser(response.data.user);
      } else {
         // If the session is invalid, ensure the user is logged out        setUser(null);
      }
    } catch (error) {
      console.error('Session check failed:', error);
      setUser(null);
    } finally {
      // This signals to the rest of the app that the check is complete
      setIsCheckingSession(false);
    }
  }, []);

// 4. This useEffect calls checkSession() once when the app first loads
  useEffect(() => {
    checkSession();
  }, [checkSession]);

 // This function is called by the Login page after a successful API call
  const login = (userData) => {
    setUser(userData);
    
    navigate('/home');
  };

  // const logout = async () => {
  //   try {
  //     await axios.post(
  //       'https://water-pump.onrender.com/api/users/logout',
  //       {},
  //       { withCredentials: true }
  //     );
     
  //   } catch (error) {
  //     console.error('Logout error:', error);
  //   } finally {
  //     setUser(null);
  //      navigate('/login');
  //   }
  // };
 

    // This function is called by the Logout page/button
  const logout = useCallback(async () => {
    try {
      await axios.post('https://water-pump.onrender.com/api/users/logout', {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout API call failed, but logging out on frontend.", error);
    } finally {
      setUser(null);
      navigate('/login');
    }
  }, [navigate]);

  // 5. Provide the user, loading state, and functions to the rest of the app
  const contextValue = {
    user,
    setUser,
    isCheckingSession,
    login,
    logout,
  };


  return (
     <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext,  UserProvider };
