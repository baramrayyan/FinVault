import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  updatePassword,
  sendEmailVerification
} from 'firebase/auth';

const AuthContext = createContext();
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Map 'demo' / 'demo' to a valid firebase email/password behind the scenes
  const mapDemoCredentials = (email, password) => {
    const e = email.toLowerCase() === 'demo' ? 'demo@finvault.com' : email;
    const p = password === 'demo' ? 'demo123' : password;
    return { email: e, password: p };
  };

  const register = (email, password, displayName) => {
    const creds = mapDemoCredentials(email, password);
    return createUserWithEmailAndPassword(auth, creds.email, creds.password).then((userCred) => {
      const p1 = updateProfile(userCred.user, { displayName });
      let p2 = Promise.resolve();
      if (creds.email !== 'demo@finvault.com') {
        p2 = sendEmailVerification(userCred.user);
      }
      return Promise.all([p1, p2]).then(() => userCred);
    });
  };

  const login = (email, password) => {
    const creds = mapDemoCredentials(email, password);
    return signInWithEmailAndPassword(auth, creds.email, creds.password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const updateUserName = (name) => {
    if (currentUser && currentUser.email !== 'demo@finvault.com') {
      return updateProfile(currentUser, { displayName: name });
    }
    return Promise.reject("Cannot change demo account name");
  };

  const updateUserPassword = (newPassword) => {
    if (currentUser && currentUser.email !== 'demo@finvault.com') {
      return updatePassword(currentUser, newPassword);
    }
    return Promise.reject("Cannot change demo account password");
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    register,
    login,
    logout,
    updateUserName,
    updateUserPassword
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
