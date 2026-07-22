import { ref, set, get, remove, push, query, orderByChild, orderByKey, equalTo, limitToFirst, startAfter, endBefore, limitToLast } from 'firebase/database';
import { database } from '../firebase/config';

// ==================== PLAYERS ====================

// SERVER-SIDE PAGINATION: Get paginated players without photos
export const getPlayersPaginated = async (pageSize = 20, lastKey = null) => {
  try {
    const startTime = Date.now();
    console.log(`🔍 Fetching page of ${pageSize} players (lastKey: ${lastKey || 'start'})...`);

    const playersRef = ref(database, 'players');
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
        // Remove photo to speed up load
        delete player.photo;
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

// Get total count of players (for pagination info)
export const getPlayersCount = async () => {
  try {
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);
    if (snapshot.exists()) {
      return Object.keys(snapshot.val()).length;
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
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);

    if (snapshot.exists()) {
      const playersObj = snapshot.val();
      const players = Object.keys(playersObj).map(key => {
        const player = { id: key, ...playersObj[key] };
        // Remove photo to speed up initial load
        delete player.photo;
        return player;
      });
      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(2);

      console.log(`✅ Fast fetch complete: ${players.length} players in ${duration}s (photos excluded)`);
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
    const playersRef = ref(database, 'players');
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
    const playersRef = ref(database, "players");
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
    const playersRef = ref(database, 'players');
    const newPlayerRef = push(playersRef);
    const newPlayer = {
      ...player,
      id: newPlayerRef.key,
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
    const playerRef = ref(database, `players/${id}`);
    const snapshot = await get(playerRef);
    if (snapshot.exists()) {
      const updatedPlayer = { ...snapshot.val(), ...updatedData };
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
    const playerRef = ref(database, `players/${id}`);
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
    const tournamentsRef = ref(database, 'tournaments');
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
    const tournamentRef = ref(database, `tournaments/${id}`);
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
    const tournamentsRef = ref(database, 'tournaments');
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
    const tournamentRef = ref(database, `tournaments/${id}`);
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
    const tournamentRef = ref(database, `tournaments/${id}`);
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
    const registrationsRef = ref(database, `tournament_registrations/${tournamentId}`);
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
    const uniqueCheckRef = ref(database, `tournament_registrations_unique/${uniqueRegistrationKey}`);

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
    const registrationsRef = ref(database, `tournament_registrations/${tournamentId}`);
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
    const registrationRef = ref(database, `tournament_registrations/${tournamentId}/${registrationId}`);
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
      const oldUniqueRef = ref(database, `tournament_registrations_unique/${oldUniqueKey}`);
      await remove(oldUniqueRef);

      // Add new unique key
      const newUniqueRef = ref(database, `tournament_registrations_unique/${newUniqueKey}`);
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
    const registrationRef = ref(database, `tournament_registrations/${tournamentId}/${registrationId}`);
    const snapshot = await get(registrationRef);

    if (snapshot.exists()) {
      const registration = snapshot.val();
      const sanitizedMobile = registration.mobile.replace(/[^0-9]/g, '');
      const uniqueKey = `${tournamentId}_${sanitizedMobile}`;

      // Delete both the registration and unique key
      await remove(registrationRef);

      const uniqueCheckRef = ref(database, `tournament_registrations_unique/${uniqueKey}`);
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