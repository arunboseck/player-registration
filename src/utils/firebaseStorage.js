import { ref, set, get, remove, push, query, orderByChild, equalTo } from 'firebase/database';
import { database } from '../firebase/config';

// ==================== PLAYERS ====================

export const getPlayers = async () => {
  try {
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);
    if (snapshot.exists()) {
      const playersObj = snapshot.val();
      return Object.keys(playersObj).map(key => ({ id: key, ...playersObj[key] }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching players:', error);
    return [];
  }
};

export const getPlayerByMobile = async (mobile) => {
  try {
    const players = await getPlayers();
    return players.find((p) => p.mobile === mobile) || null;
  } catch (error) {
    console.error('Error fetching player by mobile:', error);
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

    // Double-check in the actual registrations list (fallback)
    const existingRegistrations = await getTournamentRegistrations(tournamentId);
    const existingTournamentReg = existingRegistrations.find(reg =>
      reg.mobile.replace(/[^0-9]/g, '') === sanitizedMobile
    );

    if (existingTournamentReg) {
      return {
        success: false,
        message: `${playerData.name} (${playerData.mobile}) is already registered for this tournament!`
      };
    }

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