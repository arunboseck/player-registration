# Cricket Backup Server

Node.js/Express backend server for managing database backups.

## Features

- 📥 Save backups to local folder
- 📋 List all saved backups
- 📦 Download backup files
- ♻️ Get backup content for restore
- 🗑️ Delete old backups

## Installation

```bash
cd backend
npm install
```

## Development

```bash
npm run dev
```

## Production

```bash
npm start
```

## API Endpoints

### GET /health
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "message": "Backup server is running"
}
```

### GET /api/backups
List all backups

**Response:**
```json
{
  "success": true,
  "backups": [
    {
      "name": "cricket_db_backup_2026-08-14T10-19-27.json",
      "size": 123456,
      "created": "2026-08-14T10:19:27.000Z",
      "totalPlayers": 50,
      "totalTournaments": 10,
      "totalRegistrations": 150
    }
  ]
}
```

### POST /api/backups
Save a new backup

**Request Body:**
```json
{
  "backup": {
    "version": "1.0",
    "timestamp": "2026-08-14T10-19-27",
    "exported_at": "2026-08-14 10:19:27",
    "metadata": {
      "totalPlayers": 50,
      "totalTournaments": 10,
      "totalRegistrations": 150
    },
    "data": { ... }
  }
}
```

**Response:**
```json
{
  "success": true,
  "filename": "cricket_db_backup_2026-08-14T10-19-27.json",
  "message": "Backup saved successfully"
}
```

### GET /api/backups/:filename
Download a backup file

**Response:** File download

### GET /api/backups/:filename/content
Get backup content (for restore)

**Response:**
```json
{
  "success": true,
  "backup": { ... }
}
```

### DELETE /api/backups/:filename
Delete a backup

**Response:**
```json
{
  "success": true,
  "message": "Backup cricket_db_backup_2026-08-14T10-19-27.json deleted successfully"
}
```

## Deployment

### Railway

1. Create account at [railway.app](https://railway.app)
2. Install Railway CLI: `npm install -g @railway/cli`
3. Login: `railway login`
4. Deploy: `railway up`
5. Add domain: `railway domain`

### Environment Variables

No environment variables required for basic operation.

## Storage

Backups are stored in the `backups/` directory.
