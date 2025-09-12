import { Setting, PluginSettingTab, App, Notice } from 'obsidian';
import ZimaOSSyncPlugin from '../../main';
import { ZimaOSSettings, ZimaOSDirectory } from '../types';
import { DirectoryBrowserModal } from './directory-browser-modal';

export class ZimaOSSettingsTab extends PluginSettingTab {
	plugin: ZimaOSSyncPlugin;

	constructor(app: App, plugin: ZimaOSSyncPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		// Header
		containerEl.createEl('h1', { text: 'ZimaOS Sync Settings' });
		containerEl.createEl('p', { 
			text: 'Configure your ZimaOS connection and synchronization preferences.',
			cls: 'setting-item-description'
		});

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
		containerEl.createEl('h2', { text: 'Connection Settings' });

		// Server URL
		new Setting(containerEl)
			.setName('Server URL')
			.setDesc('ZimaOS server IP address or hostname')
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
			.setDesc('ZimaOS server port (default: 80)')
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
			.setDesc('ZimaOS username')
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
			.setDesc('ZimaOS password')
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



		// Authentication status display
		const authStatusEl = containerEl.createEl('div', { cls: 'zimaos-auth-status' });
		this.updateAuthStatus(authStatusEl);

		// Login/Logout button
		new Setting(containerEl)
			.setName('Authentication Management')
			.setDesc('Login or logout from ZimaOS server')
			.addButton(button => {
				const authState = this.plugin.zimaosClient.getAuthState();
				if (authState.isAuthenticated) {
					button.setButtonText('Logout')
						.onClick(async () => {
							this.plugin.zimaosClient.logout();
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
							const success = await this.plugin.zimaosClient.login();
							if (success) {
								new Notice('Login successful!');
								this.updateAuthStatus(authStatusEl);
								// Re-render button
								this.display();
							} else {
								// Error message is already shown by ZimaOSClient.showErrorNotice
								// No need to show additional notice here
							}
						} catch (error: any) {
							// Error message is already shown by ZimaOSClient.showErrorNotice
							// No need to show additional notice here
						}
							
							button.setButtonText('Login');
							button.setDisabled(false);
						});
				}
			});
	}

	private updateAuthStatus(statusEl: HTMLElement): void {
		const authState = this.plugin.zimaosClient.getAuthState();
		statusEl.empty();
		
		if (authState.isAuthenticated && authState.user) {
			statusEl.createEl('div', {
				text: `Logged in: ${authState.user.username} (${authState.user.role})`,
				cls: 'zimaos-auth-success'
			});
			statusEl.createEl('div', {
				text: `Token expires: ${new Date(authState.tokenData!.expires_at * 1000).toLocaleString()}`,
				cls: 'zimaos-auth-info'
			});
		} else {
			statusEl.createEl('div', {
				text: 'Not logged in',
				cls: 'zimaos-auth-error'
			});
		}
	}

	private createSyncSettings(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Synchronization Settings' });

		// Auto Sync Enable
		new Setting(containerEl)
			.setName('Enable Auto Sync')
			.setDesc('Automatically synchronize files with ZimaOS')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.autoSyncEnabled)
				.onChange(async (value) => {
					this.plugin.settings.autoSyncEnabled = value;
					await this.plugin.saveSettings();
					this.plugin.updateSyncSettings();
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
		containerEl.createEl('h3', { text: 'Sync Directory' });

		// Current sync directory display (now editable)
		new Setting(containerEl)
			.setName('Current Sync Directory')
			.setDesc('Files will be synchronized to this directory on ZimaOS')
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
			.setDesc('Open ZimaOS file browser to view backup files')
			.addButton(button => button
				.setButtonText('Open Sync Directory')
				.onClick(async () => {
					try {
						const authState = this.plugin.zimaosClient.getAuthState();
						if (!authState.isAuthenticated) {
							new Notice('Please login first');
							return;
						}

						await this.openZimaOSFileBrowser();
					} catch (error) {
						new Notice('Failed to open ZimaOS browser');
						console.error('ZimaOS browser error:', error);
					}
				}));
	}

	private async openZimaOSFileBrowser(): Promise<void> {
		try {
			const authState = this.plugin.zimaosClient.getAuthState();
			if (!authState.isAuthenticated || !authState.tokenData?.access_token) {
				new Notice('Please login first to access ZimaOS files');
				return;
			}

			// Get current sync directory and convert path
			const currentPath = this.plugin.settings.syncDirectory || '/media/ZimaOS-HD';
			const zimaosPath = this.convertPathForZimaOS(currentPath);
			
			// Build ZimaOS file browser URL with both access_token and refresh_token
			const baseUrl = 'http://10.0.0.68:8078/modules/icewhale_files/#/files';
			let fullUrl = `${baseUrl}/${zimaosPath}?token=${authState.tokenData.access_token}`;
			
			// Add refresh_token if available
			if (authState.tokenData.refresh_token) {
				fullUrl += `&refresh_token=${authState.tokenData.refresh_token}`;
			}
			
			// Open in external browser
			window.open(fullUrl, '_blank');
			new Notice('ZimaOS file browser opened in external window');
			
		} catch (error) {
			console.error('Failed to open ZimaOS file browser:', error);
			new Notice('Failed to open ZimaOS file browser');
		}
	}

	/**
	 * Convert local path to ZimaOS path format
	 * Removes /media prefix for ZimaOS file browser
	 */
	private convertPathForZimaOS(path: string): string {
		if (!path) return 'ZimaOS-HD';
		
		// Remove /media prefix if present
		if (path.startsWith('/media/')) {
			return path.substring(7); // Remove '/media/'
		}
		
		// If path doesn't start with /media, assume it's already in correct format
		return path.startsWith('/') ? path.substring(1) : path;
	}

	private createSyncStatus(containerEl: HTMLElement): void {
		containerEl.createEl('h2', { text: 'Sync Status' });

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
			progressFill.style.width = '0%';
			return;
		}

		const progress = (syncStatus.processedFiles / syncStatus.totalFiles) * 100;
		progressFill.style.width = `${Math.min(100, Math.max(0, progress))}%`;
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
		containerEl.createEl('h2', { text: 'Advanced Settings' });



		// Conflict Resolution
		new Setting(containerEl)
			.setName('Conflict Resolution')
			.setDesc('How to handle sync conflicts')
			.addDropdown(dropdown => dropdown
				.addOption('local', 'Prefer local changes')
				.addOption('remote', 'Prefer remote changes')
				.addOption('manual', 'Manual resolution')
				.setValue(this.plugin.settings.conflictResolution)
				.onChange(async (value: 'local' | 'remote' | 'manual') => {
					this.plugin.settings.conflictResolution = value;
					await this.plugin.saveSettings();
				}));

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