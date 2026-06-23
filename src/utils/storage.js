// Utility functions for managing player data in localStorage

const PLAYERS_KEY = 'cricket_players';

export const getPlayers = () => {
  try {
    const players = localStorage.getItem(PLAYERS_KEY);
    return players ? JSON.parse(players) : [];
  } catch (error) {
    console.error('Error reading players from localStorage:', error);
    return [];
  }
};

export const addPlayer = (player) => {
  try {
    const players = getPlayers();
    const newPlayer = {
      ...player,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    players.push(newPlayer);
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
    return newPlayer;
  } catch (error) {
    console.error('Error adding player to localStorage:', error);
    throw error;
  }
};

export const updatePlayer = (id, updatedData) => {
  try {
    const players = getPlayers();
    const index = players.findIndex((p) => p.id === id);
    if (index !== -1) {
      players[index] = { ...players[index], ...updatedData };
      localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
      return players[index];
    }
    return null;
  } catch (error) {
    console.error('Error updating player in localStorage:', error);
    throw error;
  }
};

export const deletePlayer = (id) => {
  try {
    const players = getPlayers();
    const filteredPlayers = players.filter((p) => p.id !== id);
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(filteredPlayers));
    return true;
  } catch (error) {
    console.error('Error deleting player from localStorage:', error);
    throw error;
  }
};
