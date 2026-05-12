// OZSync Plugin Types

export interface OZSyncSettings {
	// Connection settings
	serverUrl: string;
	port: number;
	username: string;
	password: string;
	useHttps: boolean;
	
	// Sync settings
	autoSyncEnabled: boolean;
	syncInterval: number; // in minutes
	syncScope: 'all' | 'selected';
	syncDirectory: string; // OZSync directory path
	
	// Advanced settings
	conflictResolution: 'local' | 'remote';
	debugMode: boolean;
}

export const DEFAULT_SETTINGS: OZSyncSettings = {
	// Connection settings
	serverUrl: 'localhost',
	port: 80,
	username: '',
	password: '',
	useHttps: false,
	autoSyncEnabled: false,
	syncInterval: 15,
	syncScope: 'all',
	syncDirectory: '/media/ZimaOS-HD/Obsidian',
	conflictResolution: 'remote',
	debugMode: false
};

export interface SyncStatus {
	isConnected: boolean;
	lastSyncTime?: Date;
	nextSyncTime?: Date;
	syncInProgress: boolean;
	status: 'idle' | 'syncing' | 'error';
	pendingFiles: number;
	processedFiles: number;
	totalFiles: number;
	syncSpeed: number; // bytes per second
	bytesTransferred: number;
	totalBytes: number;
	errorCount: number;
	lastError?: string;
	startTime?: Date;
}

// OZSync directory information interface
export interface OZSyncDirectory {
	name: string;
	path: string;
	isDirectory: boolean;
	size?: number;
	lastModified?: Date;
}

export interface OZSyncFile {
	name: string;
	path: string;
	size: number;
	lastModified: number; // timestamp in milliseconds
	isDirectory: boolean;
	modified: string | number; // API returns unix seconds on current ZimaOS
	mimeType?: string;
}

export interface SyncOperation {
	id: string;
	type: 'upload' | 'download' | 'delete';
	filePath: string;
	status: 'pending' | 'in-progress' | 'completed' | 'failed';
	progress: number;
	error?: string;
	timestamp: Date;
	file?: any; // TFile for upload operations
	remotePath?: string; // Remote file path for download operations
	localPath?: string; // Local file path for download operations
}

export interface ConnectionConfig {
	serverUrl: string;
	port: number;
	username: string;
	password: string;
	useHttps: boolean;
}

// Token认证相关类型
export interface TokenData {
	access_token: string;
	refresh_token: string;
	expires_at: number;
}

export interface LoginResponse {
	success: number;
	message: string;
	data: {
		token: TokenData;
		user: {
			id: number;
			username: string;
			role: string;
			email: string;
			nickname: string;
			avatar: string;
			description: string;
			created_at: string;
			updated_at: string;
		};
	};
}

export interface AuthState {
	isAuthenticated: boolean;
	tokenData?: TokenData;
	user?: {
		id: number;
		username: string;
		role: string;
	};
}

export interface SyncLog {
	timestamp: Date;
	level: 'info' | 'warning' | 'error';
	message: string;
	details?: any;
}
