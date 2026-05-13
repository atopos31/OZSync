# OZSync for Obsidian

OZSync syncs an Obsidian vault with ZimaOS storage for desktop backup, file browsing, and cross-device access.

## Features

- Manual vault sync to a configured ZimaOS directory
- Optional interval-based automatic sync
- ZimaOS cloud file browser inside Obsidian
- Upload, download, preview, folder creation, and delete actions in the browser
- Newer-file-wins sync based on modification time
- Local backup before a remote download overwrites an existing local file
- Status bar and status view for sync state

## Requirements

- Obsidian desktop
- A reachable ZimaOS server
- A ZimaOS account with access to the target storage path

This plugin is desktop-only.

## Installation

### Community Plugins

After OZSync is accepted into the Obsidian community plugin directory:

1. Open Obsidian Settings.
2. Go to Community plugins.
3. Search for OZSync.
4. Install and enable the plugin.

### Manual Installation

Download the latest release assets from:

https://github.com/atopos31/OZSync/releases

Create this folder in your vault:

```text
<Vault>/.obsidian/plugins/ozsync/
```

Copy these files into that folder:

```text
main.js
manifest.json
styles.css
```

Restart Obsidian or reload the app, then enable OZSync from Community plugins.

## Configuration

Open OZSync settings and configure:

- Server URL: the ZimaOS host or IP address
- Port: the ZimaOS HTTP or HTTPS port
- Username and password: your ZimaOS credentials
- Sync directory: the remote ZimaOS path used for vault sync
- Auto sync: optional interval sync

The default sync directory is:

```text
/media/ZimaOS-HD/Obsidian
```

Change it if your ZimaOS storage volume uses a different path.

## Sync Behavior

OZSync compares local and remote file modification times:

- If the local file is newer, OZSync uploads it.
- If the remote file is newer, OZSync downloads it.
- Files in `.obsidian/`, `.trash/`, and `.ozsync-backups/` are excluded.

Before OZSync overwrites an existing local file with a remote download, it saves the previous local copy under:

```text
.ozsync-backups/YYYY-MM-DD-HHMMSS/
```

The plugin does not automatically propagate deletions during vault sync. Delete actions are only available in the cloud browser and require confirmation.

## Development

```bash
npm install
npm run check
npm run build
```

For development rebuilds:

```bash
npm run dev
```

## Release

Release tags must match `manifest.json.version` exactly. For example:

```bash
git tag 0.1.1
git push origin 0.1.1
```

The GitHub Actions release workflow builds the plugin and uploads:

```text
main.js
manifest.json
styles.css
```

## Support

Open issues at:

https://github.com/atopos31/OZSync/issues

Include your Obsidian version, plugin version, ZimaOS version, and relevant console logs. Do not include passwords or tokens.

## License

MIT
