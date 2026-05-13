import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import OZSyncPlugin from '../../main';
import { SyncStatus, SyncOperation, SyncLog } from '../types';
import { format } from 'date-fns';

export const STATUS_VIEW_TYPE = 'ozsync-status';

export class StatusView extends ItemView {
	plugin: OZSyncPlugin;
	private refreshInterval: number | null = null;

	constructor(leaf: WorkspaceLeaf, plugin: OZSyncPlugin) {
		super(leaf);
		this.plugin = plugin;
	}

	getViewType(): string {
		return STATUS_VIEW_TYPE;
	}

	getDisplayText(): string {
		return 'OZSync Status';
	}

	getIcon(): string {
		return 'cloud-sync';
	}

	async onOpen(): Promise<void> {
		this.renderView();
		
		// Auto-refresh every 2 seconds for real-time sync status
		this.refreshInterval = window.setInterval(() => {
			this.renderView();
		}, 2000);
	}

	async onClose(): Promise<void> {
		if (this.refreshInterval) {
			clearInterval(this.refreshInterval);
			this.refreshInterval = null;
		}
	}

	private renderView(): void {
		const container = this.containerEl.children[1];
		container.empty();
		container.addClass('ozsync-status-view');

		// Header
		const header = container.createEl('div', { cls: 'status-header' });
		header.createEl('h2', { text: 'OZSync Status' });
		
		const refreshBtn = header.createEl('button', { 
			text: '🔄 Refresh',
			cls: 'mod-cta'
		});
		refreshBtn.onclick = () => this.renderView();

		// Connection Status
		this.renderConnectionStatus(container as HTMLElement);

		// Sync Status
		this.renderSyncStatus(container as HTMLElement);

		// Recent Operations
		this.renderRecentOperations(container as HTMLElement);

		// Error Logs
		this.renderErrorLogs(container as HTMLElement);

		// Quick Actions
		this.renderQuickActions(container as HTMLElement);
	}

	private renderConnectionStatus(container: HTMLElement): void {
		const card = container.createEl('div', { cls: 'status-card' });
		card.createEl('h3', { text: 'Connection Status' });

		const status = this.plugin.getSyncStatus();
		const statusEl = card.createEl('div', { cls: 'connection-status' });
		
		const indicator = statusEl.createEl('div', { 
			cls: `status-indicator ${status.isConnected ? 'connected' : 'disconnected'}` 
		});
		indicator.textContent = status.isConnected ? '🟢' : '🔴';
		
		const statusText = statusEl.createEl('span', { 
			text: status.isConnected ? 'Connected to OZSync' : 'Disconnected',
			cls: 'status-text'
		});

		// Connection details
		const details = card.createEl('div', { cls: 'connection-details' });
		details.createEl('div', { text: `Server: ${this.plugin.settings.serverUrl}:${this.plugin.settings.port}` });
		details.createEl('div', { text: `User: ${this.plugin.settings.username}` });
		
		if (status.lastError) {
			const errorEl = card.createEl('div', { cls: 'error-message' });
			errorEl.textContent = `Last Error: ${status.lastError}`;
		}
	}

	private renderSyncStatus(container: HTMLElement): void {
		const card = container.createEl('div', { cls: 'status-card' });
		card.createEl('h3', { text: 'Synchronization Status' });

		const syncStatus = this.plugin.syncManager?.getSyncStatus();
		
		if (!syncStatus) {
			card.createEl('div', { text: 'Sync manager not initialized', cls: 'error-text' });
			return;
		}

		// Status indicator
		const statusHeader = card.createEl('div', { cls: 'sync-status-header' });
		const statusIndicator = statusHeader.createEl('span', { cls: 'sync-status-indicator' });
		this.updateStatusIndicator(statusIndicator, syncStatus);

		// Progress bar
		if (syncStatus.status === 'syncing' && syncStatus.totalFiles > 0) {
			const progressContainer = card.createEl('div', { cls: 'sync-progress' });
			const progressBar = progressContainer.createEl('div', { cls: 'sync-progress-bar' });
			const progressFill = progressBar.createEl('div', { cls: 'sync-progress-fill' });
			const progress = (syncStatus.processedFiles / syncStatus.totalFiles) * 100;
			progressFill.setCssProps({ '--ozsync-progress': `${Math.min(100, Math.max(0, progress))}%` });
			
			// Progress text
			progressContainer.createEl('div', { 
				text: `${syncStatus.processedFiles}/${syncStatus.totalFiles} files`,
				cls: 'progress-text'
			});
		}

		// Sync details
		const detailsContainer = card.createEl('div', { cls: 'sync-details' });
		
		// Last sync time
		if (syncStatus.lastSyncTime) {
			const lastSyncItem = detailsContainer.createEl('div', { cls: 'sync-detail-item' });
			lastSyncItem.createEl('span', { text: 'Last Sync:' });
			lastSyncItem.createEl('span', { text: new Date(syncStatus.lastSyncTime).toLocaleString() });
		}

		// Sync speed (only show when syncing)
		if (syncStatus.status === 'syncing' && syncStatus.syncSpeed && syncStatus.syncSpeed > 0) {
			const speedItem = detailsContainer.createEl('div', { cls: 'sync-detail-item' });
			speedItem.createEl('span', { text: 'Speed:' });
			speedItem.createEl('span', { 
				text: this.formatSpeed(syncStatus.syncSpeed), 
				cls: 'sync-speed' 
			});
		}

		// Bytes transferred (only show when syncing)
		if (syncStatus.status === 'syncing' && syncStatus.bytesTransferred && syncStatus.totalBytes) {
			const bytesItem = detailsContainer.createEl('div', { cls: 'sync-detail-item' });
			bytesItem.createEl('span', { text: 'Data:' });
			bytesItem.createEl('span', { 
				text: `${this.formatBytes(syncStatus.bytesTransferred)}/${this.formatBytes(syncStatus.totalBytes)}` 
			});
		}

		// Auto sync status
		const autoSyncItem = detailsContainer.createEl('div', { cls: 'sync-detail-item' });
		autoSyncItem.createEl('span', { text: 'Auto Sync:' });
		autoSyncItem.createEl('span', { 
			text: this.plugin.settings.autoSyncEnabled 
				? `ON (every ${this.plugin.settings.syncInterval} minutes)`
				: 'OFF'
		});

		// Next sync time (only show when auto sync is enabled)
		if (this.plugin.settings.autoSyncEnabled && syncStatus.nextSyncTime && !syncStatus.syncInProgress) {
			const nextSyncItem = detailsContainer.createEl('div', { cls: 'sync-detail-item' });
			nextSyncItem.createEl('span', { text: 'Next Sync:' });
			
			const nextSyncTimeSpan = nextSyncItem.createEl('span');
			const updateNextSyncTime = () => {
				if (syncStatus.nextSyncTime) {
					const now = Date.now();
					const nextSyncDate = new Date(syncStatus.nextSyncTime);
					const nextSync = nextSyncDate.getTime();
					const timeLeft = nextSync - now;
					
					if (timeLeft > 0) {
						const minutes = Math.floor(timeLeft / (1000 * 60));
						const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
						nextSyncTimeSpan.textContent = `${nextSyncDate.toLocaleTimeString()} (in ${minutes}m ${seconds}s)`;
					} else {
						nextSyncTimeSpan.textContent = 'Starting soon...';
					}
					nextSyncTimeSpan.removeClass('ozsync-hidden');
				} else {
					nextSyncTimeSpan.addClass('ozsync-hidden');
				}
			};
			
			// 初始更新
			updateNextSyncTime();
			// Update countdown every second
			const interval = setInterval(updateNextSyncTime, 1000);
			// Clean up interval when view is refreshed
			setTimeout(() => clearInterval(interval), 30000);
		}
	}

	private renderRecentOperations(container: HTMLElement): void {
		const card = container.createEl('div', { cls: 'status-card' });
		card.createEl('h3', { text: 'Recent Operations' });

		const operations = this.plugin.getRecentOperations(10);
		
		if (operations.length === 0) {
			card.createEl('div', { 
				text: 'No recent operations',
				cls: 'no-operations'
			});
			return;
		}

		const operationsList = card.createEl('div', { cls: 'operations-list' });
		
		operations.forEach(operation => {
			const opEl = operationsList.createEl('div', { cls: 'operation-item' });
			
			const statusIcon = this.getOperationStatusIcon(operation.status);
			const typeIcon = this.getOperationTypeIcon(operation.type);
			
			opEl.createEl('span', { 
				text: `${statusIcon} ${typeIcon}`,
				cls: 'operation-icons'
			});
			
			opEl.createEl('span', { 
				text: operation.filePath,
				cls: 'operation-file'
			});
			
			opEl.createEl('span', { 
				text: format(operation.timestamp, 'HH:mm:ss'),
				cls: 'operation-time'
			});
			
			if (operation.error) {
				opEl.createEl('div', { 
					text: operation.error,
					cls: 'operation-error'
				});
			}
		});
	}

	private renderErrorLogs(container: HTMLElement): void {
		const card = container.createEl('div', { cls: 'status-card' });
		const header = card.createEl('div', { cls: 'card-header' });
		header.createEl('h3', { text: 'Error Logs' });
		
		const clearBtn = header.createEl('button', { 
			text: 'Clear',
			cls: 'mod-warning'
		});
		clearBtn.onclick = () => {
			this.plugin.clearLogs();
			this.renderView();
			new Notice('Error logs cleared');
		};

		const logs = this.plugin.getErrorLogs(20);
		
		if (logs.length === 0) {
			card.createEl('div', { 
				text: 'No errors logged',
				cls: 'no-errors'
			});
			return;
		}

		const logsList = card.createEl('div', { cls: 'logs-list' });
		
		logs.forEach(log => {
			const logEl = logsList.createEl('div', { cls: `log-item log-${log.level}` });
			
			logEl.createEl('span', { 
				text: format(log.timestamp, 'MM-dd HH:mm:ss'),
				cls: 'log-time'
			});
			
			logEl.createEl('span', { 
				text: log.level.toUpperCase(),
				cls: 'log-level'
			});
			
			logEl.createEl('span', { 
				text: log.message,
				cls: 'log-message'
			});
			
			if (log.details) {
				const detailsEl = logEl.createEl('div', { cls: 'log-details' });
				detailsEl.textContent = JSON.stringify(log.details, null, 2);
			}
		});
	}

	private renderQuickActions(container: HTMLElement): void {
		const card = container.createEl('div', { cls: 'status-card' });
		card.createEl('h3', { text: 'Quick Actions' });

		const actionsContainer = card.createEl('div', { cls: 'quick-actions' });

		// Manual Sync
		const syncBtn = actionsContainer.createEl('button', { 
			text: '🔄 Sync Now',
			cls: 'mod-cta action-button'
		});
		syncBtn.onclick = async () => {
			syncBtn.textContent = '🔄 Syncing...';
			syncBtn.disabled = true;
			
			try {
				await this.plugin.performManualSync();
				syncBtn.textContent = '✅ Synced';
			} catch (error) {
				syncBtn.textContent = '❌ Failed';
			}
			
			setTimeout(() => {
				syncBtn.textContent = '🔄 Sync Now';
				syncBtn.disabled = false;
			}, 3000);
		};



		// Login to OZSync
		const testBtn = actionsContainer.createEl('button', { 
			text: '🔗 Login to OZSync',
			cls: 'action-button'
		});
		testBtn.onclick = async () => {
			testBtn.textContent = '🔗 Logging in...';
			testBtn.disabled = true;
			
			try {
				const success = await this.plugin.ozsyncClient.login(
					this.plugin.settings.username,
					this.plugin.settings.password
				);
				if (success) {
					new Notice('Login successful!');
					testBtn.textContent = '✅ Logged in';
				} else {
					new Notice('Login failed!');
					testBtn.textContent = '❌ Failed';
				}
			} catch (error) {
				new Notice('Login error: ' + error.message);
				testBtn.textContent = '❌ Error';
			}
			
			setTimeout(() => {
				testBtn.textContent = '🔗 Login to OZSync';
				testBtn.disabled = false;
			}, 3000);
		};

		// Open Settings
		const settingsBtn = actionsContainer.createEl('button', { 
			text: '⚙️ Settings',
			cls: 'action-button'
		});
		settingsBtn.onclick = () => {
			// Open settings tab
			(this.app as any).setting.open();
			(this.app as any).setting.openTabById('ozsync');
		};
	}

	private updateStatusIndicator(indicator: HTMLElement, syncStatus: any): void {
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

	private getOperationStatusIcon(status: string): string {
		switch (status) {
			case 'completed': return '✅';
			case 'failed': return '❌';
			case 'in-progress': return '🔄';
			case 'pending': return '⏳';
			default: return '❓';
		}
	}

	private getOperationTypeIcon(type: string): string {
		switch (type) {
			case 'upload': return '⬆️';
			case 'download': return '⬇️';
			case 'delete': return '🗑️';
			default: return '📄';
		}
	}
}
