import { ref as dbRef, get, set } from 'firebase/database';
import { database } from '../firebase/config';
import { uploadPhotoToStorage } from './firebaseStorage';

/**
 * Migration utility to convert all base64 photos in the database to Cloudinary URLs
 * This should be run ONCE to migrate existing data
 */
export const migrateAllPhotosToStorage = async () => {
  try {
    console.log('🔄 Starting photo migration to Cloudinary (FREE)...');
    const startTime = Date.now();
    
    // Fetch all players
    const playersRef = dbRef(database, 'players');
    const snapshot = await get(playersRef);
    
    if (!snapshot.exists()) {
      console.log('⚠️ No players found in database');
      return { success: true, migrated: 0, skipped: 0, failed: 0 };
    }
    
    const playersObj = snapshot.val();
    const playerIds = Object.keys(playersObj);
    
    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    
    console.log(`📊 Found ${playerIds.length} players to check...`);
    
    // Process each player
    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const player = playersObj[playerId];
      
      try {
        // Skip if no photo
        if (!player.photo) {
          skipped++;
          continue;
        }
        
        // Skip if already a Cloudinary URL
        if (player.photo.includes('cloudinary.com')) {
          skipped++;
          continue;
        }
        
        // Skip if not base64
        if (!player.photo.startsWith('data:image/')) {
          skipped++;
          continue;
        }
        
        console.log(`📤 [${i + 1}/${playerIds.length}] Migrating photo for player: ${player.name} (${playerId})`);

        // Upload to Cloudinary
        const photoURL = await uploadPhotoToStorage(player.photo, playerId);
        
        // Update database with URL instead of base64
        const playerRef = dbRef(database, `players/${playerId}`);
        await set(playerRef, {
          ...player,
          photo: photoURL
        });
        
        migrated++;
        console.log(`✅ [${i + 1}/${playerIds.length}] Migrated: ${player.name}`);
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Failed to migrate photo for ${player.name}:`, error.message);
        failed++;
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    const summary = {
      success: true,
      total: playerIds.length,
      migrated,
      skipped,
      failed,
      duration: `${duration}s`
    };
    
    console.log('\n✅ Migration Complete!');
    console.log('📊 Summary:');
    console.log(`   Total players: ${summary.total}`);
    console.log(`   Migrated: ${summary.migrated}`);
    console.log(`   Skipped: ${summary.skipped}`);
    console.log(`   Failed: ${summary.failed}`);
    console.log(`   Duration: ${summary.duration}`);
    
    return summary;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Migrate a single player's photo by ID
 */
export const migrateSinglePlayerPhoto = async (playerId) => {
  try {
    const playerRef = dbRef(database, `players/${playerId}`);
    const snapshot = await get(playerRef);
    
    if (!snapshot.exists()) {
      throw new Error('Player not found');
    }
    
    const player = snapshot.val();
    
    if (!player.photo) {
      return { success: false, message: 'No photo to migrate' };
    }
    
    if (player.photo.includes('cloudinary.com')) {
      return { success: false, message: 'Already using Cloudinary URL' };
    }
    
    if (!player.photo.startsWith('data:image/')) {
      return { success: false, message: 'Invalid photo format' };
    }
    
    console.log(`📤 Migrating photo for ${player.name}...`);
    
    const photoURL = await uploadPhotoToStorage(player.photo, playerId);
    
    await set(playerRef, {
      ...player,
      photo: photoURL
    });
    
    console.log(`✅ Photo migrated successfully!`);
    
    return {
      success: true,
      message: 'Photo migrated to Cloudinary',
      photoURL
    };
    
  } catch (error) {
    console.error('❌ Error migrating photo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};
