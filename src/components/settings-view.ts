import { Setting, PluginSettingTab, App, Notice } from 'obsidian';
import OZSyncPlugin from '../../main';
import { OZSyncSettings, OZSyncDirectory } from '../types';
import { DirectoryBrowserModal } from './directory-browser-modal';

export class OZSyncSettingsTab extends PluginSettingTab {
	plugin: OZSyncPlugin;

	constructor(app: App, plugin: OZSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Connection Settings Section
		this.createConnectionSettings(containerEl);

		// Sync Status Section
		this.createSyncStatus(containerEl);

		// Sync Settings Section
		this.createSyncSettings(containerEl);

		// Advanced Settings Section
		this.createAdvancedSettings(containerEl);
	}

	private createConnectionSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Connection')
			.setHeading();

		// Server URL
		new Setting(containerEl)
			.setName('Server URL')
			.setDesc('OZSync server IP address or hostname')
			.addText(text => text
				.setPlaceholder('192.168.1.100')
				.setValue(this.plugin.settings.serverUrl)
				.onChange(async (value) => {
					this.plugin.settings.serverUrl = value;
					await this.plugin.saveSettings();
				}));

		// Port
		new Setting(containerEl)
			.setName('Port')
			.setDesc('OZSync server port (default: 80)')
			.addText(text => text
				.setPlaceholder('80')
				.setValue(this.plugin.settings.port.toString())
				.onChange(async (value) => {
					const port = parseInt(value) || 80;
					this.plugin.settings.port = port;
					await this.plugin.saveSettings();
				}));

		// Username
		new Setting(containerEl)
			.setName('Username')
			.setDesc('OZSync username')
			.addText(text => text
				.setPlaceholder('admin')
				.setValue(this.plugin.settings.username)
				.onChange(async (value) => {
					this.plugin.settings.username = value;
					await this.plugin.saveSettings();
				}));

		// Password
		new Setting(containerEl)
			.setName('Password')
			.setDesc('OZSync password')
			.addText(text => {
				text.inputEl.type = 'password';
				return text
					.setPlaceholder('••••••••')
					.setValue(this.plugin.settings.password)
					.onChange(async (value) => {
						this.plugin.settings.password = value;
						await this.plugin.saveSettings();
					});
			});



		// Test connection button
		new Setting(containerEl)
			.setName('Test Connection')
			.setDesc('Test connection to OZSync server')
			.addButton(button => button
				.setButtonText('Test Connection')
				.onClick(async () => {
					button.setButtonText('Testing...');
					button.setDisabled(true);
					
					try {
						const success = await this.plugin.ozsyncClient.testConnection();
						if (success) {
							new Notice('Connection successful!');
							button.setButtonText('✓ Connected');
						} else {
							new Notice('Connection failed!');
							button.setButtonText('✗ Failed');
						}
					} catch (error) {
						new Notice('Connection error!');
						button.setButtonText('✗ Error');
					}
					
					setTimeout(() => {
						button.setButtonText('Test Connection');
						button.setDisabled(false);
					}, 3000);
				}));

		// Authentication status display
		const authStatusEl = containerEl.createEl('div', { cls: 'ozsync-auth-status' });
		this.updateAuthStatus(authStatusEl);

		// Login/Logout button
		new Setting(containerEl)
			.setName('Authentication Management')
			.setDesc('Login or logout from OZSync server')
			.addButton(button => {
				const authState = this.plugin.ozsyncClient.getAuthState();
				if (authState.isAuthenticated) {
					button.setButtonText('Logout')
						.onClick(async () => {
							this.plugin.ozsyncClient.logout();
							this.updateAuthStatus(authStatusEl);
							new Notice('Logged out successfully');
							// Re-render button
							this.display();
						});
				} else {
					button.setButtonText('Login')
						.setCta()
						.onClick(async () => {
							button.setButtonText('Logging in...');
							button.setDisabled(true);
							
							try {
							const success = await this.plugin.ozsyncClient.login();
							if (success) {
								new Notice('Login successful!');
								this.updateAuthStatus(authStatusEl);
								// Re-render button
								this.display();
							} else {
								// Error message is already shown by OZSyncClient.showErrorNotice
								// No need to show additional notice here
							}
						} catch (error: any) {
							// Error message is already shown by OZSyncClient.showErrorNotice
							// No need to show additional notice here
						}
							
							button.setButtonText('Login');
							button.setDisabled(false);
						});
				}
			});
	}

	private updateAuthStatus(statusEl: HTMLElement): void {
		const authState = this.plugin.ozsyncClient.getAuthState();
		statusEl.empty();
		
		if (authState.isAuthenticated && authState.user) {
			statusEl.createEl('div', {
				text: `✓ Logged in: ${authState.user.username} (${authState.user.role})`,
				cls: 'ozsync-auth-success'
			});
			if (authState.tokenData?.expires_at) {
				const expiresAt = new Date(authState.tokenData.expires_at * 1000);
				const now = new Date();
				const timeLeft = expiresAt.getTime() - now.getTime();
				const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
				
				statusEl.createEl('div', {
					text: `Token expires: ${expiresAt.toLocaleString()} (${hoursLeft}h remaining)`,
					cls: hoursLeft < 1 ? 'ozsync-auth-warning' : 'ozsync-auth-info'
				});
			}
		} else {
			statusEl.createEl('div', {
				text: '✗ Not logged in',
				cls: 'ozsync-auth-error'
			});
		}
	}

	private createSyncSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Synchronization')
			.setHeading();

		// Auto Sync Enable
		new Setting(containerEl)
			.setName('Enable Auto Sync')
			.setDesc('Automatically synchronize files with OZSync')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSyncEnabled)
				.onChange(async (value) => {
					this.plugin.settings.autoSyncEnabled = value;
					// If enabling auto sync and no interval is set, use default 15 minutes
					if (value && this.plugin.settings.syncInterval <= 0) {
						this.plugin.settings.syncInterval = 15;
					}
					await this.plugin.saveSettings();
					this.plugin.updateSyncSettings();
					// Refresh the settings view to show updated interval
					this.display();
				}));

		// Sync Interval
		new Setting(containerEl)
			.setName('Sync Interval')
			.setDesc('How often to sync (in minutes)')
			.addSlider(slider => slider
				.setLimits(5, 120, 5)
				.setValue(this.plugin.settings.syncInterval)
				.setDynamicTooltip()
				.onChange(async (value) => {
					this.plugin.settings.syncInterval = value;
					await this.plugin.saveSettings();
					this.plugin.updateSyncSettings();
				}));

		// Sync Directory Selection
		this.createDirectorySelection(containerEl);
	}

	private async createDirectorySelection(containerEl: HTMLElement): Promise<void> {
		new Setting(containerEl)
			.setName('Sync Directory')
			.setHeading();

		// Current sync directory display (now editable)
		new Setting(containerEl)
			.setName('Current Sync Directory')
			.setDesc('Files will be synchronized to this directory on OZSync')
			.addText(text => text
				.setValue(this.plugin.settings.syncDirectory || '/media/ZimaOS-HD/Obsidian')
				.setPlaceholder('/media/ZimaOS-HD/Obsidian')
				.onChange(async (value) => {
					this.plugin.settings.syncDirectory = value;
					await this.plugin.saveSettings();
				}));

		// Browse directory button - now opens ZimaOS file browser
		new Setting(containerEl)
			.setName('Open Sync Directory')
			.setDesc('Open OZSync file browser to view backup files')
			.addButton(button => button
				.setButtonText('Open Sync Directory')
				.onClick(async () => {
					try {
						const authState = this.plugin.ozsyncClient.getAuthState();
						if (!authState.isAuthenticated) {
							new Notice('Please login first');
							return;
						}

						await this.openOZSyncFileBrowser();
					} catch (error) {
						new Notice('Failed to open OZSync browser');
						console.error('OZSync browser error:', error);
					}
				}));
	}

	private async openOZSyncFileBrowser(): Promise<void> {
		try {
			const authState = this.plugin.ozsyncClient.getAuthState();
			if (!authState.isAuthenticated || !authState.tokenData?.access_token) {
				new Notice('Please login first to access OZSync files');
				return;
			}

			// Get current sync directory and convert path
			const currentPath = this.plugin.settings.syncDirectory || '/media/ZimaOS-HD';
			const ozsyncPath = this.convertPathForOZSync(currentPath);
			
			// Build OZSync file browser URL with both access_token and refresh_token
			const protocol = this.plugin.settings.useHttps ? 'https' : 'http';
			const baseUrl = `${protocol}://${this.plugin.settings.serverUrl}:${this.plugin.settings.port}/modules/icewhale_files/#/files`;
			let fullUrl = `${baseUrl}/${ozsyncPath}?token=${encodeURIComponent(authState.tokenData.access_token)}`;
			
			// Add refresh_token if available
			if (authState.tokenData.refresh_token) {
				fullUrl += `&refresh_token=${encodeURIComponent(authState.tokenData.refresh_token)}`;
			}
			
			// Open in external browser
			window.open(fullUrl, '_blank');
			new Notice('OZSync file browser opened in external window');
			
		} catch (error) {
			console.error('Failed to open OZSync file browser:', error);
			new Notice('Failed to open OZSync file browser');
		}
	}

	/**
	 * Convert local path to OZSync path format
	 * Removes /media prefix for OZSync file browser
	 */
	private convertPathForOZSync(path: string): string {
		if (!path) return 'ZimaOS-HD';
		
		// Remove /media prefix if present
		if (path.startsWith('/media/')) {
			return path.substring(7); // Remove '/media/'
		}
		
		// If path doesn't start with /media, assume it's already in correct format
		return path.startsWith('/') ? path.substring(1) : path;
	}

	private createSyncStatus(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Sync Status')
			.setHeading();

		// Create status container
		const statusContainer = containerEl.createEl('div', { cls: 'sync-status-container' });
		
		// Status header
		const statusHeader = statusContainer.createEl('div', { cls: 'sync-status-header' });
		statusHeader.createEl('span', { text: 'Synchronization Status', cls: 'sync-status-title' });
		
		const statusIndicator = statusHeader.createEl('span', { cls: 'sync-status-indicator' });
		this.updateStatusIndicator(statusIndicator);

		// Progress bar
		const progressContainer = statusContainer.createEl('div', { cls: 'sync-progress' });
		const progressBar = progressContainer.createEl('div', { cls: 'sync-progress-bar' });
		const progressFill = progressBar.createEl('div', { cls: 'sync-progress-fill' });
		this.updateProgressBar(progressFill);

		// Sync details
		const detailsContainer = statusContainer.createEl('div', { cls: 'sync-details' });
		this.updateSyncDetails(detailsContainer);

		// Auto-refresh status every 2 seconds
		window.setInterval(() => {
			this.updateStatusIndicator(statusIndicator);
			this.updateProgressBar(progressFill);
			this.updateSyncDetails(detailsContainer);
		}, 2000);
	}

	private updateStatusIndicator(indicator: HTMLElement): void {
		const syncStatus = this.plugin.syncManager?.getSyncStatus();
		if (!syncStatus) {
			indicator.textContent = '● Not initialized';
			indicator.className = 'sync-status-indicator error';
			return;
		}

		switch (syncStatus.status) {
			case 'syncing':
				indicator.textContent = '● Syncing';
				indicator.className = 'sync-status-indicator syncing';
				break;
			case 'idle':
				indicator.textContent = '● Idle';
				indicator.className = 'sync-status-indicator idle';
				break;
			case 'error':
				indicator.textContent = '● Error';
				indicator.className = 'sync-status-indicator error';
				break;
			default:
				indicator.textContent = '● Unknown';
				indicator.className = 'sync-status-indicator error';
		}
	}

	private updateProgressBar(progressFill: HTMLElement): void {
		const syncStatus = this.plugin.syncManager?.getSyncStatus();
		if (!syncStatus || syncStatus.totalFiles === 0) {
			progressFill.setCssProps({ '--ozsync-progress': '0%' });
			return;
		}

		const progress = (syncStatus.processedFiles / syncStatus.totalFiles) * 100;
		progressFill.setCssProps({ '--ozsync-progress': `${Math.min(100, Math.max(0, progress))}%` });
	}

	private updateSyncDetails(container: HTMLElement): void {
		container.empty();
		
		const syncStatus = this.plugin.syncManager?.getSyncStatus();
		if (!syncStatus) {
			container.createEl('div', { text: 'Sync manager not initialized', cls: 'error-text' });
			return;
		}

		// Last sync time
		const lastSyncItem = container.createEl('div', { cls: 'sync-detail-item' });
		lastSyncItem.createEl('span', { text: 'Last Sync:' });
		const lastSyncTime = syncStatus.lastSyncTime ? 
			new Date(syncStatus.lastSyncTime).toLocaleString() : 'Never';
		lastSyncItem.createEl('span', { text: lastSyncTime });

		// Next sync time
		if (this.plugin.settings.autoSyncEnabled && syncStatus.nextSyncTime) {
			const nextSyncItem = container.createEl('div', { cls: 'sync-detail-item' });
			nextSyncItem.createEl('span', { text: 'Next Sync:' });
			const nextSyncTimeEl = nextSyncItem.createEl('span', { 
				text: new Date(syncStatus.nextSyncTime).toLocaleString(),
				cls: 'next-sync-time'
			});
			
			// Add countdown
			const now = new Date().getTime();
			const nextSync = new Date(syncStatus.nextSyncTime).getTime();
			const timeLeft = nextSync - now;
			
			if (timeLeft > 0) {
				const minutes = Math.floor(timeLeft / (1000 * 60));
				const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
				const countdownEl = nextSyncItem.createEl('span', { 
					text: ` (in ${minutes}m ${seconds}s)`,
					cls: 'sync-countdown'
				});
			}
		} else if (this.plugin.settings.autoSyncEnabled) {
			const nextSyncItem = container.createEl('div', { cls: 'sync-detail-item' });
			nextSyncItem.createEl('span', { text: 'Next Sync:' });
			nextSyncItem.createEl('span', { text: 'Calculating...', cls: 'next-sync-time' });
		}

		// Files processed
		const filesItem = container.createEl('div', { cls: 'sync-detail-item' });
		filesItem.createEl('span', { text: 'Files:' });
		filesItem.createEl('span', { text: `${syncStatus.processedFiles}/${syncStatus.totalFiles}` });

		// Sync speed
		if (syncStatus.syncSpeed && syncStatus.syncSpeed > 0) {
			const speedItem = container.createEl('div', { cls: 'sync-detail-item' });
			speedItem.createEl('span', { text: 'Speed:' });
			speedItem.createEl('span', { 
				text: this.formatSpeed(syncStatus.syncSpeed), 
				cls: 'sync-speed' 
			});
		}

		// Bytes transferred
		if (syncStatus.bytesTransferred && syncStatus.totalBytes) {
			const bytesItem = container.createEl('div', { cls: 'sync-detail-item' });
			bytesItem.createEl('span', { text: 'Data:' });
			bytesItem.createEl('span', { 
				text: `${this.formatBytes(syncStatus.bytesTransferred)}/${this.formatBytes(syncStatus.totalBytes)}` 
			});
		}
	}

	private formatSpeed(bytesPerSecond: number): string {
		if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
		if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
		return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
	}

	private formatBytes(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
	}



	private createAdvancedSettings(containerEl: HTMLElement): void {
		new Setting(containerEl)
			.setName('Advanced')
			.setHeading();



		// Sync direction
		new Setting(containerEl)
			.setName('Sync Direction')
			.setDesc('The newest modified file wins. Local edits upload when newer; newer remote files download.');

		// Debug Mode
		new Setting(containerEl)
			.setName('Debug Mode')
			.setDesc('Enable detailed logging for troubleshooting')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.debugMode)
				.onChange(async (value) => {
					this.plugin.settings.debugMode = value;
					await this.plugin.saveSettings();
				}));

		// Manual Sync Button
		new Setting(containerEl)
			.setName('Manual Sync')
			.setDesc('Trigger immediate synchronization')
			.addButton(button => button
				.setButtonText('Sync Now')
				.setCta()
				.onClick(async () => {
					button.setButtonText('Syncing...');
					button.setDisabled(true);
					
					try {
						await this.plugin.performManualSync();
						button.setButtonText('✓ Synced');
					} catch (error) {
						button.setButtonText('✗ Failed');
					}
					
					setTimeout(() => {
						button.setButtonText('Sync Now');
						button.setDisabled(false);
					}, 3000);
				}));


	}
}
