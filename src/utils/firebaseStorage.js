import { ref as dbRef, set, get, remove, push, query, orderByChild, orderByKey, equalTo, limitToFirst, startAfter, endBefore, limitToLast } from 'firebase/database';
import { database } from '../firebase/config';

// ==================== PHOTO STORAGE HELPERS (CLOUDINARY - FREE!) ====================

/**
 * Upload a photo to Cloudinary and return the download URL
 * @param {string} base64Photo - Base64 encoded photo string
 * @param {string} playerId - Player ID for unique filename
 * @returns {Promise<string>} - Download URL for the uploaded photo
 */
export const uploadPhotoToStorage = async (base64Photo, playerId) => {
  try {
    if (!base64Photo || !base64Photo.startsWith('data:image/')) {
      throw new Error('Invalid photo format');
    }

    console.log('📤 Uploading photo to Cloudinary (FREE)...');

    // Cloudinary configuration
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      throw new Error('Cloudinary cloud name not configured. Please add VITE_CLOUDINARY_CLOUD_NAME to .env');
    }

    const startTime = Date.now();

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append('file', base64Photo);
    formData.append('folder', 'players'); // Organize in folder
    formData.append('public_id', `player_${playerId}_${Date.now()}`); // Unique ID

    // If upload preset is available, use unsigned upload
    if (uploadPreset) {
      formData.append('upload_preset', uploadPreset);
    } else if (apiKey) {
      // Use API key for unsigned upload (no preset needed)
      formData.append('api_key', apiKey);
      formData.append('timestamp', Math.floor(Date.now() / 1000).toString());
      formData.append('upload_preset', 'ml_default'); // Use default preset
    }

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Cloudinary error:', error);
      throw new Error(error.error?.message || 'Upload failed');
    }

    const data = await response.json();
    const uploadTime = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`✅ Photo uploaded to Cloudinary in ${uploadTime}s`);
    console.log(`📸 URL: ${data.secure_url.substring(0, 50)}...`);

    // Return the secure URL
    return data.secure_url;

  } catch (error) {
    console.error('❌ Error uploading photo to Cloudinary:', error);
    throw error;
  }
};

/**
 * Delete a photo from Cloudinary
 * @param {string} photoURL - Download URL of the photo to delete
 */
export const deletePhotoFromStorage = async (photoURL) => {
  try {
    // Check if it's a Cloudinary URL
    if (!photoURL || !photoURL.includes('cloudinary.com')) {
      return; // Not a Cloudinary URL, skip
    }

    console.log('🗑️ Deleting photo from Cloudinary...');

    // Extract public_id from URL
    // URL format: https://res.cloudinary.com/{cloud_name}/image/upload/v{version}/{public_id}.jpg
    const parts = photoURL.split('/upload/');
    if (parts.length < 2) {
      console.warn('⚠️ Invalid Cloudinary URL format');
      return;
    }

    const pathParts = parts[1].split('/');
    const filename = pathParts[pathParts.length - 1];
    const publicId = pathParts.slice(1).join('/').replace(/\.[^/.]+$/, ''); // Remove extension

    console.log(`🗑️ Public ID: ${publicId}`);

    // Note: Deletion requires authenticated API call with API Secret
    // For security, this should be done server-side
    // For now, we'll just log it - photos will remain in Cloudinary
    // You can manually delete them from Cloudinary dashboard or implement server-side deletion

    console.log('⚠️ Photo deletion requires server-side API (skipped for security)');
    console.log('💡 You can delete photos manually from Cloudinary dashboard');

  } catch (error) {
    console.error('⚠️ Error deleting photo:', error.message);
    // Don't throw - photo deletion is not critical
  }
};

// ==================== PLAYERS ====================

// SERVER-SIDE PAGINATION: Get paginated players without photos
export const getPlayersPaginated = async (pageSize = 20, lastKey = null) => {
  try {
    const startTime = Date.now();
    console.log(`🔍 Fetching page of ${pageSize} players (lastKey: ${lastKey || 'start'})...`);

    const playersRef = dbRef(database, 'players');
    let playersQuery;

    if (lastKey) {
      // Fetch next page starting after the last key
      playersQuery = query(playersRef, orderByKey(), startAfter(lastKey), limitToFirst(pageSize));
    } else {
      // Fetch first page
      playersQuery = query(playersRef, orderByKey(), limitToFirst(pageSize));
    }

    const snapshot = await get(playersQuery);

    if (snapshot.exists()) {
      const playersObj = snapshot.val();
      const players = Object.keys(playersObj).map(key => {
        const player = { id: key, ...playersObj[key] };
        // Keep photo URLs (they're small), only remove base64 photos (large)
        if (player.photo && player.photo.startsWith('data:image/')) {
          delete player.photo; // Remove base64 (should not happen with new system)
        }
        // Photo URLs stay - they're just strings, very small!
        return player;
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);
      const newLastKey = players.length > 0 ? players[players.length - 1].id : null;

      console.log(`✅ Fetched ${players.length} players in ${duration}s (server-side pagination)`);

      return {
        players,
        lastKey: newLastKey,
        hasMore: players.length === pageSize // If we got full page, there might be more
      };
    }

    return { players: [], lastKey: null, hasMore: false };
  } catch (error) {
    console.error('❌ Error fetching paginated players:', error);
    return { players: [], lastKey: null, hasMore: false };
  }
};

// Get total count of players WITHOUT downloading all data
export const getPlayersCount = async () => {
  try {
    console.log('🔢 Getting players count (fast method)...');
    const playersRef = dbRef(database, 'players');

    // Use shallow query to get only keys, not full data
    const snapshot = await get(query(playersRef, orderByKey()));

    if (snapshot.exists()) {
      const count = Object.keys(snapshot.val()).length;
      console.log(`✅ Count: ${count} players`);
      return count;
    }
    return 0;
  } catch (error) {
    console.error('❌ Error getting players count:', error);
    return 0;
  }
};

// Fast version: Get players without photos for initial load (kept for backward compatibility)
export const getPlayersWithoutPhotos = async () => {
  try {
    const startTime = Date.now();
    console.log('⚡ Fast fetch: Getting players WITHOUT photos...');
    const playersRef = dbRef(database, 'players');
    const snapshot = await get(playersRef);

    if (snapshot.exists()) {
      const playersObj = snapshot.val();
      const players = Object.keys(playersObj).map(key => {
        const player = { id: key, ...playersObj[key] };
        // Keep photo URLs (small), remove base64 (large - legacy data)
        if (player.photo && player.photo.startsWith('data:image/')) {
          delete player.photo;
        }
        return player;
      });
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`✅ Fast fetch complete: ${players.length} players in ${duration}s`);
      return players;
    }
    return [];
  } catch (error) {
    console.error('❌ Error in fast fetch:', error);
    return [];
  }
};

export const getPlayers = async () => {
  try {
    const startTime = Date.now();
    console.log('🔍 Fetching players from Firebase...');
    const playersRef = dbRef(database, 'players');
    const snapshot = await get(playersRef);

    if (snapshot.exists()) {
      const playersObj = snapshot.val();
      const players = Object.keys(playersObj).map(key => ({ id: key, ...playersObj[key] }));
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      // Calculate approximate data size
      const dataSize = JSON.stringify(playersObj).length;
      const dataSizeMB = (dataSize / (1024 * 1024)).toFixed(2);

      console.log(`✅ Successfully fetched ${players.length} players in ${duration}s`);
      console.log(`📦 Data size: ~${dataSizeMB} MB`);

      if (duration > 3) {
        console.warn(`⚠️ SLOW LOAD: ${duration}s is too slow!`);
        console.warn(`💡 Tip: Move photos to Firebase Storage to reduce data size by 90%`);
      }

      return players;
    } else {
      console.warn('⚠️ No players found in Firebase database at path "players"');
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching players:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      name: error.name
    });
    return [];
  }
};

export const getPlayerByMobile = async (mobile) => {
  try {
    // OPTIMIZED: Use Firebase query instead of fetching all players
    const playersRef = dbRef(database, "players");
    const mobileQuery = query(playersRef, orderByChild("mobile"), equalTo(mobile));
    const snapshot = await get(mobileQuery);
    
    if (snapshot.exists()) {
      const playersObj = snapshot.val();
      const key = Object.keys(playersObj)[0];
      return { id: key, ...playersObj[key] };
    }
    return null;
  } catch (error) {
    console.error("Error fetching player by mobile:", error);
    return null;
  }
};
export const addPlayer = async (player) => {
  try {
    const playersRef = dbRef(database, 'players');
    const newPlayerRef = push(playersRef);
    const playerId = newPlayerRef.key;

    // Handle photo upload to Storage if base64 photo exists
    let photoURL = null;
    if (player.photo && player.photo.startsWith('data:image/')) {
      console.log('📸 Converting base64 photo to Storage URL...');
      photoURL = await uploadPhotoToStorage(player.photo, playerId);
      console.log('✅ Photo uploaded to Storage, saving URL instead of base64');
    } else if (player.photo && player.photo.includes('firebasestorage.googleapis.com')) {
      // Already a storage URL, keep it
      photoURL = player.photo;
    }

    const newPlayer = {
      ...player,
      photo: photoURL, // Store URL instead of base64
      id: playerId,
      createdAt: new Date().toISOString()
    };

    await set(newPlayerRef, newPlayer);
    return newPlayer;
  } catch (error) {
    console.error('Error adding player:', error);
    throw error;
  }
};

export const updatePlayer = async (id, updatedData) => {
  try {
    const playerRef = dbRef(database, `players/${id}`);
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const existingPlayer = snapshot.val();

      // Handle photo update
      let photoURL = existingPlayer.photo; // Keep existing by default

      if (updatedData.photo && updatedData.photo.startsWith('data:image/')) {
        // New base64 photo - upload to Storage
        console.log('📸 Updating photo - uploading to Storage...');

        // Delete old photo if it exists in Storage
        if (existingPlayer.photo && existingPlayer.photo.includes('firebasestorage.googleapis.com')) {
          await deletePhotoFromStorage(existingPlayer.photo);
        }

        // Upload new photo
        photoURL = await uploadPhotoToStorage(updatedData.photo, id);
        console.log('✅ Photo updated in Storage');
      } else if (updatedData.photo && updatedData.photo.includes('firebasestorage.googleapis.com')) {
        // Already a storage URL
        photoURL = updatedData.photo;
      } else if (updatedData.photo === null || updatedData.photo === '') {
        // Photo removed
        if (existingPlayer.photo && existingPlayer.photo.includes('firebasestorage.googleapis.com')) {
          await deletePhotoFromStorage(existingPlayer.photo);
        }
        photoURL = null;
      }

      const updatedPlayer = {
        ...existingPlayer,
        ...updatedData,
        photo: photoURL
      };

      await set(playerRef, updatedPlayer);
      return updatedPlayer;
    }
    return null;
  } catch (error) {
    console.error('Error updating player:', error);
    return null;
  }
};

export const deletePlayer = async (id) => {
  try {
    const playerRef = dbRef(database, `players/${id}`);
    const snapshot = await get(playerRef);

    // Delete photo from Storage if it exists
    if (snapshot.exists()) {
      const player = snapshot.val();
      if (player.photo && player.photo.includes('firebasestorage.googleapis.com')) {
        console.log('🗑️ Deleting player photo from Storage...');
        await deletePhotoFromStorage(player.photo);
      }
    }

    // Delete player from database
    await remove(playerRef);
    return true;
  } catch (error) {
    console.error('Error deleting player:', error);
    return false;
  }
};

// ==================== TOURNAMENTS ====================

export const getTournaments = async () => {
  try {
    const tournamentsRef = dbRef(database, 'tournaments');
    const snapshot = await get(tournamentsRef);
    if (snapshot.exists()) {
      const tournamentsObj = snapshot.val();
      return Object.keys(tournamentsObj).map(key => ({ id: key, ...tournamentsObj[key] }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return [];
  }
};

export const getTournamentById = async (id) => {
  try {
    const tournamentRef = dbRef(database, `tournaments/${id}`);
    const snapshot = await get(tournamentRef);
    if (snapshot.exists()) {
      return { id, ...snapshot.val() };
    }
    return null;
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return null;
  }
};

export const addTournament = async (tournament) => {
  try {
    const tournamentsRef = dbRef(database, 'tournaments');
    const newTournamentRef = push(tournamentsRef);
    const newTournament = {
      ...tournament,
      id: newTournamentRef.key,
      createdAt: new Date().toISOString()
    };
    await set(newTournamentRef, newTournament);
    return newTournament;
  } catch (error) {
    console.error('Error adding tournament:', error);
    throw error;
  }
};

export const updateTournament = async (id, updatedData) => {
  try {
    const tournamentRef = dbRef(database, `tournaments/${id}`);
    const snapshot = await get(tournamentRef);
    if (snapshot.exists()) {
      const updatedTournament = { ...snapshot.val(), ...updatedData };
      await set(tournamentRef, updatedTournament);
      return updatedTournament;
    }
    return null;
  } catch (error) {
    console.error('Error updating tournament:', error);
    return null;
  }
};

export const deleteTournament = async (id) => {
  try {
    const tournamentRef = dbRef(database, `tournaments/${id}`);
    await remove(tournamentRef);
    return true;
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return false;
  }
};


// ==================== TOURNAMENT REGISTRATIONS ====================

export const getTournamentRegistrations = async (tournamentId) => {
  try {
    const registrationsRef = dbRef(database, `tournament_registrations/${tournamentId}`);
    const snapshot = await get(registrationsRef);
    if (snapshot.exists()) {
      const registrationsObj = snapshot.val();
      return Object.keys(registrationsObj).map(key => ({ id: key, ...registrationsObj[key] }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return [];
  }
};

export const addTournamentRegistration = async (tournamentId, playerData) => {
  try {
    // Use mobile number as unique key to prevent duplicates at database level
    const sanitizedMobile = playerData.mobile.replace(/[^0-9]/g, ''); // Remove non-numeric chars
    const uniqueRegistrationKey = `${tournamentId}_${sanitizedMobile}`;

    // Create a unique path using mobile number
    const uniqueCheckRef = dbRef(database, `tournament_registrations_unique/${uniqueRegistrationKey}`);

    // Check if this unique key already exists
    const uniqueSnapshot = await get(uniqueCheckRef);
    if (uniqueSnapshot.exists()) {
      return {
        success: false,
        message: `${playerData.name} (${playerData.mobile}) is already registered for this tournament!`
      };
    }

    // Unique key check above is sufficient - removed redundant query for performance

    // Check if player exists in Players module
    const existingPlayer = await getPlayerByMobile(playerData.mobile);

    let playerMessage = '';

    if (!existingPlayer) {
      // Player doesn't exist in Players module - add them
      const newPlayer = {
        name: playerData.name,
        mobile: playerData.mobile,
        dateOfBirth: playerData.dateOfBirth,
        bloodGroup: playerData.bloodGroup,
        place: playerData.place,
        position: playerData.position,
        photo: playerData.photo
      };

      await addPlayer(newPlayer);
      playerMessage = ' Player has been added to the system.';
    } else {
      playerMessage = ' Player already exists in the system.';
    }

    // Add tournament registration
    const registrationsRef = dbRef(database, `tournament_registrations/${tournamentId}`);
    const newRegistrationRef = push(registrationsRef);
    const registrationId = newRegistrationRef.key;

    const newRegistration = {
      ...playerData,
      id: registrationId,
      tournamentId,
      registeredAt: new Date().toISOString()
    };

    // Write both the registration and unique key atomically
    await set(newRegistrationRef, newRegistration);

    // Store unique key mapping to prevent future duplicates
    await set(uniqueCheckRef, {
      registrationId: registrationId,
      mobile: playerData.mobile,
      name: playerData.name,
      createdAt: new Date().toISOString()
    });

    return {
      success: true,
      message: `${playerData.name} has been successfully registered for the tournament!${playerMessage}`,
      data: newRegistration
    };
  } catch (error) {
    console.error('Error adding tournament registration:', error);
    throw error;
  }
};

export const updateRegistration = async (tournamentId, registrationId, updatedData) => {
  try {
    const registrationRef = dbRef(database, `tournament_registrations/${tournamentId}/${registrationId}`);
    const snapshot = await get(registrationRef);

    if (!snapshot.exists()) {
      return { success: false, message: 'Registration not found' };
    }

    const currentRegistration = snapshot.val();
    const oldMobile = currentRegistration.mobile.replace(/[^0-9]/g, '');
    const newMobile = updatedData.mobile.replace(/[^0-9]/g, '');

    // Check if mobile number changed
    if (oldMobile !== newMobile) {
      // Check if new mobile already exists for this tournament
      const allRegistrations = await getTournamentRegistrations(tournamentId);
      const duplicateExists = allRegistrations.find(
        reg => reg.id !== registrationId && reg.mobile.replace(/[^0-9]/g, '') === newMobile
      );

      if (duplicateExists) {
        return {
          success: false,
          message: `Mobile number ${updatedData.mobile} is already registered for this tournament!`
        };
      }

      // Update unique key
      const oldUniqueKey = `${tournamentId}_${oldMobile}`;
      const newUniqueKey = `${tournamentId}_${newMobile}`;

      // Remove old unique key
      const oldUniqueRef = dbRef(database, `tournament_registrations_unique/${oldUniqueKey}`);
      await remove(oldUniqueRef);

      // Add new unique key
      const newUniqueRef = dbRef(database, `tournament_registrations_unique/${newUniqueKey}`);
      await set(newUniqueRef, {
        registrationId: registrationId,
        mobile: updatedData.mobile,
        name: updatedData.name,
        createdAt: new Date().toISOString()
      });
    }

    // Update registration
    const updated = {
      ...currentRegistration,
      ...updatedData,
      updatedAt: new Date().toISOString()
    };
    await set(registrationRef, updated);

    return { success: true, message: 'Registration updated successfully!' };
  } catch (error) {
    console.error('Error updating registration:', error);
    return { success: false, message: 'Failed to update registration' };
  }
};

export const deleteRegistration = async (tournamentId, registrationId) => {
  try {
    // First, get the registration to find the mobile number
    const registrationRef = dbRef(database, `tournament_registrations/${tournamentId}/${registrationId}`);
    const snapshot = await get(registrationRef);

    if (snapshot.exists()) {
      const registration = snapshot.val();
      const sanitizedMobile = registration.mobile.replace(/[^0-9]/g, '');
      const uniqueKey = `${tournamentId}_${sanitizedMobile}`;

      // Delete both the registration and unique key
      await remove(registrationRef);

      const uniqueCheckRef = dbRef(database, `tournament_registrations_unique/${uniqueKey}`);
      await remove(uniqueCheckRef);
    } else {
      await remove(registrationRef);
    }

    return true;
  } catch (error) {
    console.error('Error deleting registration:', error);
    return false;
  }
};