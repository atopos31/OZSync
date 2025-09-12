import { Plugin, TAbstractFile, TFile, Notice, WorkspaceLeaf } from 'obsidian';
import { ZimaOSClient } from './src/zimaos-client';
import { SyncManager } from './src/sync-manager';
import { ZimaOSSettings, DEFAULT_SETTINGS, SyncStatus, SyncOperation, SyncLog } from './src/types';
import { ZimaOSSettingsTab } from './src/components/settings-view';
import { StatusView, STATUS_VIEW_TYPE } from './src/components/status-view';
import { CloudBrowserView, CLOUD_BROWSER_VIEW_TYPE } from './src/components/cloud-browser';

export default class ZimaOSSyncPlugin extends Plugin {
	settings: ZimaOSSettings;
	zimaosClient: ZimaOSClient;
	syncManager: SyncManager;
	syncStatus: SyncStatus;
	recentOperations: SyncOperation[] = [];
	errorLogs: SyncLog[] = [];
	private autoSyncInterval: number | null = null;
	private statusBarItem: HTMLElement | null = null;

	async onload() {
		await this.loadSettings();

		// Initialize clients
		this.zimaosClient = new ZimaOSClient(this.settings);
		this.syncManager = new SyncManager(this.zimaosClient, this.settings, this.addLog.bind(this));

		// Initialize sync status
		this.syncStatus = {
			isConnected: false,
			syncInProgress: false,
			status: 'idle',
			lastSyncTime: undefined,
			pendingFiles: 0,
			processedFiles: 0,
			totalFiles: 0,
			syncSpeed: 0,
			bytesTransferred: 0,
			totalBytes: 0,
			errorCount: 0,
			lastError: undefined,
			startTime: undefined
		};

		// Register views
		this.registerView(
			STATUS_VIEW_TYPE,
			(leaf) => new StatusView(leaf, this)
		);

		this.registerView(
			CLOUD_BROWSER_VIEW_TYPE,
			(leaf) => new CloudBrowserView(leaf, this)
		);

		// Add ribbon icons
		this.addRibbonIcon('cloud-sync', 'ZimaOS Sync Status', () => {
			this.activateView(STATUS_VIEW_TYPE);
		});

		this.addRibbonIcon('cloud', 'ZimaOS Sync', () => {
			this.zimaosClient.login(this.settings.username, this.settings.password);
		});

		// Add status bar
		this.statusBarItem = this.addStatusBarItem();
		this.updateStatusBar();

		// Add commands
		this.addCommand({
			id: 'zimaos-sync-now',
			name: 'Sync Now',
			callback: () => this.performManualSync()
		});



		this.addCommand({
			id: 'zimaos-login',
			name: 'Login to ZimaOS',
			callback: async () => {
				try {
					const success = await this.zimaosClient.login(this.settings.username, this.settings.password);
					if (success) {
						new Notice('Login successful!');
					} else {
						new Notice('Login failed!');
					}
				} catch (error) {
					new Notice('Login error: ' + error.message);
				}
			}
		});

		this.addCommand({
			id: 'zimaos-open-status',
			name: 'Open Sync Status',
			callback: () => this.activateView(STATUS_VIEW_TYPE)
		});

		this.addCommand({
			id: 'zimaos-open-browser',
			name: 'Open Cloud Browser',
			callback: () => this.activateView(CLOUD_BROWSER_VIEW_TYPE)
		});



		// Add settings tab
		this.addSettingTab(new ZimaOSSettingsTab(this.app, this));

		// Initialize connection and sync
		await this.initializePlugin();
	}

	async onunload() {
		// Stop auto sync
		if (this.autoSyncInterval) {
			clearInterval(this.autoSyncInterval);
			this.autoSyncInterval = null;
		}

		// Cleanup sync manager
		if (this.syncManager) {
			this.syncManager.stopAutoSync();
		}
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
		
		// Update clients with new settings
		if (this.zimaosClient) {
			this.zimaosClient.updateSettings(this.settings);
		}
		if (this.syncManager) {
			this.syncManager.updateSettings(this.settings);
		}

		// Restart auto sync if settings changed
		this.setupAutoSync();
	}

	private async initializePlugin(): Promise<void> {
		try {
			// Always initialize sync manager
			await this.syncManager.initialize();
			
			// Setup auto sync if enabled
			this.setupAutoSync();
			
			console.log('ZimaOS plugin initialized successfully');
		} catch (error) {
			console.error('Failed to initialize ZimaOS sync plugin:', error);
			this.logError('Plugin initialization failed', error);
		}
	}

	private setupAutoSync(): void {
		// Clear existing interval
		if (this.autoSyncInterval) {
			clearInterval(this.autoSyncInterval);
			this.autoSyncInterval = null;
			console.log('Auto sync timer cleared');
		}

		// Setup new interval if auto sync is enabled
		if (this.settings.autoSyncEnabled && this.settings.syncInterval > 0) {
			const intervalMs = this.settings.syncInterval * 60 * 1000; // Convert minutes to milliseconds
			this.autoSyncInterval = window.setInterval(() => {
				console.log('Auto sync timer triggered - starting automatic sync');
				this.performAutoSync();
			}, intervalMs);
			console.log(`Auto sync enabled: interval set to ${this.settings.syncInterval} minutes (${intervalMs}ms)`);
		} else {
			console.log('Auto sync disabled or invalid interval');
		}
	}

	private async performAutoSync(): Promise<void> {
		console.log('Auto sync: Starting automatic synchronization...');
		
		if (this.syncStatus.syncInProgress) {
			console.log('Auto sync: Skipping - sync already in progress');
			return; // Skip if sync is already in progress
		}

		try {
			console.log('Auto sync: Executing sync operation');
			await this.syncManager.performSync();
			this.updateSyncStatus({ syncInProgress: false, lastSyncTime: new Date(), errorCount: 0 });
			console.log('Auto sync: Completed successfully');
		} catch (error) {
			console.error('Auto sync failed:', error);
			this.logError('Auto sync failed', error);
			this.updateSyncStatus({ syncInProgress: false, errorCount: this.syncStatus.errorCount + 1 });
		}
	}

	async performManualSync(): Promise<void> {
		if (this.syncStatus.syncInProgress) {
			new Notice('Sync already in progress');
			return;
		}

		try {
			this.updateSyncStatus({ syncInProgress: true });
			new Notice('Starting sync...');
			
			await this.syncManager.performSync();
			
			this.updateSyncStatus({ 
				syncInProgress: false, 
				lastSyncTime: new Date(), 
				errorCount: 0,
				lastError: undefined
			});
			new Notice('Sync completed successfully');
		} catch (error) {
			console.error('Manual sync failed:', error);
			this.logError('Manual sync failed', error);
			this.updateSyncStatus({ 
				syncInProgress: false, 
				errorCount: this.syncStatus.errorCount + 1,
				lastError: error.message
			});
			new Notice('Sync failed: ' + error.message);
		}
	}





	// Public methods for components
	getSyncStatus(): SyncStatus {
		return { ...this.syncStatus };
	}

	getRecentOperations(limit: number = 10): SyncOperation[] {
		return this.recentOperations.slice(0, limit);
	}

	getErrorLogs(limit: number = 20): SyncLog[] {
		return this.errorLogs.slice(0, limit);
	}

	clearLogs(): void {
		this.errorLogs = [];
		this.recentOperations = [];
	}



	updateSyncSettings(): void {
		this.syncManager.updateSettings(this.settings);
	}

	addLog(log: any): void {
		console.log('ZimaOS Sync Log:', log);
	}

	// Private helper methods
	private updateSyncStatus(updates: Partial<SyncStatus>): void {
		this.syncStatus = { ...this.syncStatus, ...updates };
		this.updateStatusBar();
	}

	private updateStatusBar(): void {
		if (!this.statusBarItem) return;

		let statusText = 'ZimaOS: ';
		if (this.syncStatus.syncInProgress) {
			statusText += '🔄 Syncing';
		} else if (this.syncStatus.isConnected) {
			statusText += '🟢 Connected';
		} else {
			statusText += '🔴 Disconnected';
		}

		if (this.syncStatus.errorCount > 0) {
			statusText += ` (${this.syncStatus.errorCount} errors)`;
		}

		this.statusBarItem.setText(statusText);
	}

	private logError(message: string, error: any): void {
		const log: SyncLog = {
			timestamp: new Date(),
			level: 'error',
			message,
			details: error
		};
		this.errorLogs.unshift(log);
		
		// Keep only last 100 logs
		if (this.errorLogs.length > 100) {
			this.errorLogs = this.errorLogs.slice(0, 100);
		}
	}

	private addOperation(operation: SyncOperation): void {
		this.recentOperations.unshift(operation);
		
		// Keep only last 50 operations
		if (this.recentOperations.length > 50) {
			this.recentOperations = this.recentOperations.slice(0, 50);
		}
	}

	private async activateView(viewType: string): Promise<void> {
		const { workspace } = this.app;

		let leaf: WorkspaceLeaf | null = null;
		const leaves = workspace.getLeavesOfType(viewType);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			leaf = workspace.getRightLeaf(false);
			await leaf?.setViewState({ type: viewType, active: true });
		}

		// "Reveal" the leaf in case it is in a collapsed sidebar
		if (leaf) {
			workspace.revealLeaf(leaf);
		}
	}
}
