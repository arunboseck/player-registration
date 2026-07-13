const PLAYERS_KEY = 'cricket_players';
const TOURNAMENTS_KEY = 'cricket_tournaments';
const TOURNAMENT_REGISTRATIONS_KEY = 'tournament_registrations';

export const getPlayers = () => {
  try {
    const players = localStorage.getItem(PLAYERS_KEY);
    const parsed = players ? JSON.parse(players) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading players:', error);
    return [];
  }
};

export const getPlayerByMobile = (mobile) => {
  const players = getPlayers();
  return players.find((p) => p.mobile === mobile) || null;
};

export const addPlayer = (player) => {
  const players = getPlayers();
  const newPlayer = { ...player, id: Date.now().toString(), createdAt: new Date().toISOString() };
  players.push(newPlayer);
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
  return newPlayer;
};

export const updatePlayer = (id, updatedData) => {
  const players = getPlayers();
  const index = players.findIndex((p) => p.id === id);
  if (index !== -1) {
    players[index] = { ...players[index], ...updatedData };
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    return players[index];
  }
  return null;
};

export const deletePlayer = (id) => {
  const players = getPlayers();
  const filteredPlayers = players.filter((p) => p.id !== id);
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(filteredPlayers));
  return true;
};

export const getTournaments = () => {
  try {
    const tournaments = localStorage.getItem(TOURNAMENTS_KEY);
    const parsed = tournaments ? JSON.parse(tournaments) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error loading tournaments:', error);
    return [];
  }
};

export const getTournamentById = (id) => {
  const tournaments = getTournaments();
  return tournaments.find((t) => t.id === id) || null;
};

export const addTournament = (tournament) => {
  const tournaments = getTournaments();
  const newTournament = { ...tournament, id: Date.now().toString(), createdAt: new Date().toISOString() };
  tournaments.push(newTournament);
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
  return newTournament;
};

export const updateTournament = (id, updatedData) => {
  const tournaments = getTournaments();
  const index = tournaments.findIndex((t) => t.id === id);
  if (index !== -1) {
    tournaments[index] = { ...tournaments[index], ...updatedData };
    localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(tournaments));
    return tournaments[index];
  }
  return null;
};

export const deleteTournament = (id) => {
  const tournaments = getTournaments();
  const filteredTournaments = tournaments.filter((t) => t.id !== id);
  localStorage.setItem(TOURNAMENTS_KEY, JSON.stringify(filteredTournaments));
  return true;
};

export const getTournamentRegistrations = (tournamentId) => {
  try {
    const allRegistrations = localStorage.getItem(TOURNAMENT_REGISTRATIONS_KEY);
    const registrations = allRegistrations ? JSON.parse(allRegistrations) : [];
    // Ensure registrations is always an array
    const safeRegistrations = Array.isArray(registrations) ? registrations : [];
    return tournamentId ? safeRegistrations.filter((r) => r.tournamentId === tournamentId) : safeRegistrations;
  } catch (error) {
    console.error('Error loading tournament registrations:', error);
    return [];
  }
};

export const addTournamentRegistration = (tournamentId, playerData) => {
  // First, check if this player (by mobile) is already registered for this tournament
  const allRegistrations = getTournamentRegistrations();
  const existingTournamentReg = allRegistrations.find(
    (reg) => reg.tournamentId === tournamentId && reg.mobile === playerData.mobile
  );

  if (existingTournamentReg) {
    // Player is already registered for this tournament
    return {
      success: false,
      error: 'ALREADY_REGISTERED',
      message: `${playerData.name} is already registered for this tournament with mobile number ${playerData.mobile}.`
    };
  }

  // Check if player already exists in Players module by mobile number
  const existingPlayer = getPlayerByMobile(playerData.mobile);

  if (!existingPlayer) {
    // Player doesn't exist, add them to the Players module
    const playerForModule = {
      name: playerData.name,
      mobile: playerData.mobile,
      dateOfBirth: playerData.dateOfBirth,
      bloodGroup: playerData.bloodGroup,
      place: playerData.place,
      position: playerData.position,
      photo: playerData.photo || '',
    };
    addPlayer(playerForModule);
  }
  // If player exists, we skip adding them again (no duplicates)

  // Add the tournament registration
  const registrations = getTournamentRegistrations();
  const newRegistration = { ...playerData, tournamentId, id: Date.now().toString(), registeredAt: new Date().toISOString() };
  registrations.push(newRegistration);
  localStorage.setItem(TOURNAMENT_REGISTRATIONS_KEY, JSON.stringify(registrations));

  return {
    success: true,
    registration: newRegistration,
    playerExists: !!existingPlayer,
    message: existingPlayer
      ? 'Player already exists in the system. Tournament registration added.'
      : 'New player added to the system and registered for tournament.'
  };
};
