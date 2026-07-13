import { ref, get, remove, set } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Cleanup duplicate tournament registrations
 * Keeps only the first registration for each mobile number per tournament
 */
export const cleanupDuplicateRegistrations = async (tournamentId) => {
  try {
    console.log(`Starting cleanup for tournament: ${tournamentId}`);
    
    // Get all registrations for this tournament
    const registrationsRef = ref(database, `tournament_registrations/${tournamentId}`);
    const snapshot = await get(registrationsRef);
    
    if (!snapshot.exists()) {
      console.log('No registrations found');
      return { duplicatesFound: 0, duplicatesRemoved: 0 };
    }

    const registrationsObj = snapshot.val();
    const registrationsList = Object.keys(registrationsObj).map(key => ({
      id: key,
      ...registrationsObj[key]
    }));

    // Group by mobile number
    const mobileGroups = {};
    registrationsList.forEach(reg => {
      const sanitizedMobile = reg.mobile.replace(/[^0-9]/g, '');
      if (!mobileGroups[sanitizedMobile]) {
        mobileGroups[sanitizedMobile] = [];
      }
      mobileGroups[sanitizedMobile].push(reg);
    });

    // Find duplicates
    let duplicatesFound = 0;
    let duplicatesRemoved = 0;
    const toDelete = [];

    for (const mobile in mobileGroups) {
      const group = mobileGroups[mobile];
      if (group.length > 1) {
        duplicatesFound += group.length - 1;
        
        // Sort by registration date (keep oldest)
        group.sort((a, b) => {
          const dateA = new Date(a.registeredAt || 0);
          const dateB = new Date(b.registeredAt || 0);
          return dateA - dateB;
        });

        // Mark all except first for deletion
        for (let i = 1; i < group.length; i++) {
          toDelete.push({
            id: group[i].id,
            name: group[i].name,
            mobile: group[i].mobile
          });
        }
      }
    }

    console.log(`Found ${duplicatesFound} duplicates`);
    console.log('Duplicates to remove:', toDelete);

    // Delete duplicates
    for (const dup of toDelete) {
      const dupRef = ref(database, `tournament_registrations/${tournamentId}/${dup.id}`);
      await remove(dupRef);
      duplicatesRemoved++;
      console.log(`Deleted duplicate: ${dup.name} (${dup.mobile})`);
    }

    console.log(`Cleanup complete. Removed ${duplicatesRemoved} duplicates`);
    
    return {
      duplicatesFound,
      duplicatesRemoved,
      deletedEntries: toDelete
    };
  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
    throw error;
  }
};

/**
 * Create unique keys for all existing registrations
 * This is a one-time migration to establish the unique key system
 */
export const migrateToUniqueKeys = async (tournamentId) => {
  try {
    console.log(`Migrating tournament ${tournamentId} to unique key system`);
    
    // First cleanup duplicates
    await cleanupDuplicateRegistrations(tournamentId);
    
    // Get all registrations
    const registrationsRef = ref(database, `tournament_registrations/${tournamentId}`);
    const snapshot = await get(registrationsRef);
    
    if (!snapshot.exists()) {
      return { keysCreated: 0 };
    }

    const registrationsObj = snapshot.val();
    const registrationsList = Object.keys(registrationsObj).map(key => ({
      id: key,
      ...registrationsObj[key]
    }));

    // Create unique keys for each registration
    let keysCreated = 0;
    for (const reg of registrationsList) {
      const sanitizedMobile = reg.mobile.replace(/[^0-9]/g, '');
      const uniqueKey = `${tournamentId}_${sanitizedMobile}`;
      const uniqueCheckRef = ref(database, `tournament_registrations_unique/${uniqueKey}`);
      
      // Check if key already exists
      const keySnapshot = await get(uniqueCheckRef);
      if (!keySnapshot.exists()) {
        // Create unique key
        await set(uniqueCheckRef, {
          registrationId: reg.id,
          mobile: reg.mobile,
          name: reg.name,
          createdAt: new Date().toISOString()
        });
        keysCreated++;
        console.log(`Created unique key for: ${reg.name} (${reg.mobile})`);
      }
    }

    console.log(`Migration complete. Created ${keysCreated} unique keys`);
    
    return { keysCreated };
  } catch (error) {
    console.error('Error migrating to unique keys:', error);
    throw error;
  }
};
