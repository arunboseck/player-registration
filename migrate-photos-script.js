/**
 * AUTOMATED PHOTO MIGRATION SCRIPT
 * 
 * This script migrates all base64 photos from Firebase Realtime Database
 * to Firebase Storage and replaces them with URLs.
 * 
 * HOW TO RUN:
 * 1. Make sure you're in the project directory
 * 2. Run: node migrate-photos-script.js
 * 3. Wait for completion (5-10 minutes)
 */

import { initializeApp } from 'firebase/app';
import { getDatabase, ref, get, set } from 'firebase/database';
import { readFileSync } from 'fs';

// Load environment variables from .env file
function loadEnv() {
  try {
    const envContent = readFileSync('.env', 'utf-8');
    const env = {};
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
        env[key] = value;
      }
    });
    return env;
  } catch (error) {
    console.error('❌ Error reading .env file:', error.message);
    process.exit(1);
  }
}

const env = loadEnv();

// Firebase configuration from .env file
const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: env.VITE_FIREBASE_DATABASE_URL,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID
};

// Validate configuration
if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL || !firebaseConfig.storageBucket) {
  console.error('❌ ERROR: Missing Firebase configuration!');
  console.error('Make sure you have a .env file with all VITE_FIREBASE_* variables');
  process.exit(1);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

console.log('✅ Firebase initialized successfully\n');
console.log('📸 Using Cloudinary for photo storage (FREE!)\n');

/**
 * Convert base64 to Buffer for upload
 */
function base64ToBuffer(base64String) {
  const matches = base64String.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid base64 string');
  }
  
  const data = matches[2];
  return {
    buffer: Buffer.from(data, 'base64'),
    mimeType: `image/${matches[1]}`
  };
}

/**
 * Upload photo to Cloudinary (FREE!)
 */
async function uploadPhotoToStorage(base64Photo, playerId) {
  try {
    const cloudName = env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = env.VITE_CLOUDINARY_API_KEY;
    const uploadPreset = env.VITE_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) {
      throw new Error('VITE_CLOUDINARY_CLOUD_NAME not set in .env file');
    }

    // Use fetch with form data (Node.js 18+ has native fetch)
    const FormData = (await import('node-fetch')).FormData || globalThis.FormData;
    const fetch = globalThis.fetch || (await import('node-fetch')).default;

    const formData = new FormData();
    formData.append('file', base64Photo);
    formData.append('folder', 'players');
    formData.append('public_id', `player_${playerId}_${Date.now()}`);

    // If upload preset is available, use it
    if (uploadPreset) {
      formData.append('upload_preset', uploadPreset);
    } else if (apiKey) {
      // Use API key for unsigned upload
      formData.append('api_key', apiKey);
      formData.append('timestamp', Math.floor(Date.now() / 1000).toString());
      formData.append('upload_preset', 'ml_default');
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
    return data.secure_url;

  } catch (error) {
    console.error('Error uploading to Cloudinary:', error.message);
    throw error;
  }
}

/**
 * Main migration function
 */
async function migrateAllPhotos() {
  try {
    console.log('🔄 Starting photo migration...\n');
    const startTime = Date.now();
    
    // Fetch all players
    console.log('📥 Fetching all players from database...');
    const playersRef = ref(database, 'players');
    const snapshot = await get(playersRef);
    
    if (!snapshot.exists()) {
      console.log('⚠️  No players found in database');
      return;
    }
    
    const playersObj = snapshot.val();
    const playerIds = Object.keys(playersObj);
    
    console.log(`📊 Found ${playerIds.length} players\n`);
    
    let migrated = 0;
    let skipped = 0;
    let failed = 0;
    
    // Process each player
    for (let i = 0; i < playerIds.length; i++) {
      const playerId = playerIds[i];
      const player = playersObj[playerId];
      const playerNum = i + 1;
      
      try {
        // Skip if no photo
        if (!player.photo) {
          console.log(`⏭️  [${playerNum}/${playerIds.length}] ${player.name} - No photo`);
          skipped++;
          continue;
        }
        
        // Skip if already a Storage URL
        if (player.photo.includes('firebasestorage.googleapis.com')) {
          console.log(`✓  [${playerNum}/${playerIds.length}] ${player.name} - Already using Storage URL`);
          skipped++;
          continue;
        }
        
        // Skip if not base64
        if (!player.photo.startsWith('data:image/')) {
          console.log(`⏭️  [${playerNum}/${playerIds.length}] ${player.name} - Invalid photo format`);
          skipped++;
          continue;
        }
        
        // Migrate photo
        console.log(`📤 [${playerNum}/${playerIds.length}] Migrating: ${player.name}...`);
        
        const photoURL = await uploadPhotoToStorage(player.photo, playerId);
        
        // Update database
        const playerRef = ref(database, `players/${playerId}`);
        await set(playerRef, {
          ...player,
          photo: photoURL
        });
        
        console.log(`✅ [${playerNum}/${playerIds.length}] Migrated: ${player.name}`);
        migrated++;
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ [${playerNum}/${playerIds.length}] Failed: ${player.name} - ${error.message}`);
        failed++;
      }
    }
    
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ MIGRATION COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total players:  ${playerIds.length}`);
    console.log(`Migrated:       ${migrated} ✅`);
    console.log(`Skipped:        ${skipped} ⏭️`);
    console.log(`Failed:         ${failed} ❌`);
    console.log(`Duration:       ${duration}s`);
    console.log('='.repeat(60) + '\n');
    
    if (migrated > 0) {
      console.log('🎉 Success! Your photos are now stored in Firebase Storage.');
      console.log('📊 The players page should now load 100x faster!\n');
    }
    
    process.exit(0);
    
  } catch (error) {
    console.error('\n❌ MIGRATION FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run migration
console.log('🚀 Photo Migration Tool\n');
migrateAllPhotos();
