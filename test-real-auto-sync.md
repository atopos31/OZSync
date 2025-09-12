# Auto Sync Real Test Instructions

## Test Steps to Verify Auto Sync Functionality

### 1. Enable Auto Sync in Plugin Settings
- Open Obsidian
- Go to Settings → Community Plugins → ZimaOS Sync
- Enable "Auto Sync"
- Set sync interval to 1 minute (for quick testing)

### 2. Monitor Console Logs
Open Developer Tools (Ctrl+Shift+I) and watch for these messages:
- `Auto sync timer started with interval: XXXXXms`
- `Auto sync timer triggered - starting automatic sync`
- `Auto sync: Starting automatic synchronization...`
- `Auto sync: Executing sync operation`
- `Auto sync: Completed successfully`

### 3. Expected Behavior
- After enabling auto sync, you should see timer start message
- Every 1 minute, you should see sync execution messages
- The sync should happen automatically without manual intervention

### 4. Test Verification
- Create a new note
- Wait for 1 minute
- Check if the note gets synced automatically
- Verify sync status updates in the plugin interface

### 5. Troubleshooting
If auto sync is not working:
- Check console for error messages
- Verify sync interval setting
- Ensure ZimaOS connection is active
- Check if manual sync works first

## Key Code Locations
- Auto sync setup: `main.ts` - `setupAutoSync()` method
- Sync execution: `main.ts` - `performAutoSync()` method
- Timer management: `main.ts` - auto sync timer logic
- Sync manager: `src/sync-manager.ts` - `performSync()` method