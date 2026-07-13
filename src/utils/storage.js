// Import and re-export Firebase storage functions
// This allows all existing imports to work without changes

import * as firebaseStorage from './firebaseStorage';

// Player functions
export const getPlayers = firebaseStorage.getPlayers;
export const getPlayerByMobile = firebaseStorage.getPlayerByMobile;
export const addPlayer = firebaseStorage.addPlayer;
export const updatePlayer = firebaseStorage.updatePlayer;
export const deletePlayer = firebaseStorage.deletePlayer;

// Tournament functions
export const getTournaments = firebaseStorage.getTournaments;
export const getTournamentById = firebaseStorage.getTournamentById;
export const addTournament = firebaseStorage.addTournament;
export const updateTournament = firebaseStorage.updateTournament;
export const deleteTournament = firebaseStorage.deleteTournament;

// Tournament Registration functions
export const getTournamentRegistrations = firebaseStorage.getTournamentRegistrations;
export const addTournamentRegistration = firebaseStorage.addTournamentRegistration;
export const deleteRegistration = firebaseStorage.deleteRegistration;
