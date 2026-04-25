import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, rtdb } from '../firebase/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, set as rtdbSet } from 'firebase/database';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, additionalData) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userData = {
      email,
      role: 'student', // default role
      ...additionalData,
      createdAt: new Date().toISOString()
    };

    // 1. Create user document in Firestore
    await setDoc(doc(db, "users", cred.user.uid), userData);
    
    // 2. Sync user profile to Realtime Database (for security rules)
    await rtdbSet(ref(rtdb, `users/${cred.user.uid}`), {
      email: userData.email,
      role: userData.role
    });

    return cred;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  async function logout() {
    await signOut(auth);
    setCurrentUser(null);
    setUserData(null);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Fetch user data from firestore
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.status === 'banned') {
            await signOut(auth);
            setCurrentUser(null);
            setUserData(null);
            // We can optionally pass an error message here or handle it in the UI
          } else {
            setUserData(data);
          }
        } else {
          // fallback if user document doesn't exist yet but user is authenticated
          setUserData({ email: user.email, role: 'student' });
        }
      } else {
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    login,
    signup,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
