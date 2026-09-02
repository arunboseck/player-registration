import { createContext, useContext, useState, useEffect } from 'react';
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { ref as dbRef, set } from 'firebase/database';
import { auth, database } from '../firebase/config';
import { getUserProfile, anyUsersExist, ROLES } from '../utils/userManagement';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null); // { uid, email, name, role, assignedTournaments, status }
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setAuthError('');
      if (!firebaseUser) {
        setIsAuthenticated(false);
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        let profile = await getUserProfile(firebaseUser.uid);

        // First-run bootstrap: if no users exist yet in the system,
        // automatically grant Super Admin to whoever logs in first.
        if (!profile) {
          const usersExist = await anyUsersExist();
          if (!usersExist) {
            profile = {
              name: firebaseUser.email.split('@')[0],
              email: firebaseUser.email,
              role: ROLES.SUPER_ADMIN,
              assignedTournaments: [],
              status: 'active',
              createdAt: new Date().toISOString()
            };
            await set(dbRef(database, `users/${firebaseUser.uid}`), profile);
          }
        }

        if (!profile) {
          // Authenticated with Firebase but has no app profile/role assigned
          setAuthError('Your account has no assigned role. Please contact an administrator.');
          await firebaseSignOut(auth);
          setIsAuthenticated(false);
          setUser(null);
        } else if (profile.status === 'inactive') {
          setAuthError('Your account has been deactivated. Please contact an administrator.');
          await firebaseSignOut(auth);
          setIsAuthenticated(false);
          setUser(null);
        } else {
          setIsAuthenticated(true);
          setUser({ uid: firebaseUser.uid, ...profile });
        }
      } catch (error) {
        console.error('Error resolving user profile:', error);
        setAuthError('Failed to load account details. Please try again.');
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      const message =
        error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password' || error.code === 'auth/user-not-found'
          ? 'Invalid email or password'
          : error.message;
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
    setIsAuthenticated(false);
    setUser(null);
  };

  const hasRole = (...roles) => !!user && roles.includes(user.role);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '1.2rem',
        color: '#667eea'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, authError, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};
