// User & Role Management (Super Admin, Tournament Organizer, etc.)
// Uses Firebase Authentication (accounts) + Realtime Database (profile/role)
import { initializeApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut as secondarySignOut } from 'firebase/auth';
import { ref as dbRef, get, set, update, remove } from 'firebase/database';
import { database, firebaseConfig } from '../firebase/config';

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  TOURNAMENT_ORGANIZER: 'tournament_organizer'
};

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.TOURNAMENT_ORGANIZER]: 'Tournament Organizer'
};

// Fetch a single user's profile by uid
export const getUserProfile = async (uid) => {
  try {
    const snapshot = await get(dbRef(database, `users/${uid}`));
    return snapshot.exists() ? { uid, ...snapshot.val() } : null;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Fetch all users (Super Admin only - UI enforced)
export const getAllUsers = async () => {
  try {
    const snapshot = await get(dbRef(database, 'users'));
    if (!snapshot.exists()) return [];
    const usersObj = snapshot.val();
    return Object.keys(usersObj).map((uid) => ({ uid, ...usersObj[uid] }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
};

// Check if any users exist yet (used for first-run bootstrap of Super Admin)
export const anyUsersExist = async () => {
  try {
    const snapshot = await get(dbRef(database, 'users'));
    return snapshot.exists() && Object.keys(snapshot.val()).length > 0;
  } catch (error) {
    console.error('Error checking users existence:', error);
    return true; // fail safe - assume users exist to avoid accidental super admin grants
  }
};

// Create a Firebase Auth account + profile WITHOUT logging out the current admin.
// Uses a temporary secondary Firebase app instance for account creation.
export const createUserAccount = async ({ name, email, password, role, assignedTournaments = [] }) => {
  const secondaryApp = initializeApp(firebaseConfig, `Secondary-${Date.now()}`);
  const secondaryAuth = getAuth(secondaryApp);
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    const uid = credential.user.uid;

    const profile = {
      name,
      email,
      role,
      assignedTournaments: role === ROLES.TOURNAMENT_ORGANIZER ? assignedTournaments : [],
      status: 'active',
      createdAt: new Date().toISOString()
    };

    await set(dbRef(database, `users/${uid}`), profile);

    await secondarySignOut(secondaryAuth);
    await deleteApp(secondaryApp);

    return { success: true, uid, profile };
  } catch (error) {
    try { await deleteApp(secondaryApp); } catch (_) { /* ignore cleanup error */ }
    console.error('Error creating user account:', error);
    return { success: false, error: error.message };
  }
};

// Update a user's role / assigned tournaments / name
export const updateUserProfile = async (uid, updates) => {
  try {
    await update(dbRef(database, `users/${uid}`), updates);
    return { success: true };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// Deactivate/activate a user (blocks app access without deleting the Firebase Auth account)
export const setUserStatus = async (uid, status) => {
  return updateUserProfile(uid, { status });
};

// Remove a user's profile (revokes app access). Firebase Auth account itself
// must be deleted separately from the Firebase Console (client SDK cannot
// delete other users' auth accounts without the Admin SDK).
export const deleteUserProfile = async (uid) => {
  try {
    await remove(dbRef(database, `users/${uid}`));
    return { success: true };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return { success: false, error: error.message };
  }
};

// Fully delete a user: removes both the Firebase Auth account and the
// Realtime Database profile via the backend server (Admin SDK required).
// Falls back to profile-only deletion if the backend is unavailable, so the
// user still loses app access even if full cleanup can't happen right now.
const API_URL = import.meta.env.VITE_BACKUP_API_URL || 'http://localhost:3001';

export const deleteUserCompletely = async (uid) => {
  try {
    const response = await fetch(`${API_URL}/api/users/${uid}`, { method: 'DELETE' });
    const data = await response.json();

    if (data.success) {
      return { success: true, authDeleted: true };
    }

    // Backend reachable but couldn't delete Auth account (e.g. not configured) -
    // still remove the DB profile so app access is revoked immediately.
    await remove(dbRef(database, `users/${uid}`));
    return { success: true, authDeleted: false, warning: data.error };
  } catch (error) {
    console.error('Error reaching backend to delete user, falling back to profile-only removal:', error);
    try {
      await remove(dbRef(database, `users/${uid}`));
      return { success: true, authDeleted: false, warning: 'Backend server unavailable - login account was not removed.' };
    } catch (dbError) {
      return { success: false, error: dbError.message };
    }
  }
};
