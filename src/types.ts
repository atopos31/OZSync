// ZimaOS Sync Plugin Types

export interface ZimaOSSettings {
	// 连接设置
	serverUrl: string;
	port: number;
	username: string;
	password: string;
	useHttps: boolean;
	
	// Sync settings
	autoSyncEnabled: boolean;
	syncInterval: number; // in minutes
	syncScope: 'all' | 'selected';
	syncDirectory: string; // ZimaOS目录路径
	
	// Advanced settings
	conflictResolution: 'local' | 'remote' | 'manual';
	debugMode: boolean;
}

export const DEFAULT_SETTINGS: ZimaOSSettings = {
	// 连接设置
	serverUrl: 'localhost',
	port: 8078,
	username: '',
	password: '',
	useHttps: false,
	autoSyncEnabled: false,
	syncInterval: 30,
	syncScope: 'all',
	syncDirectory: '/media/ZimaOS-HD/Obsidian',
	conflictResolution: 'manual',
	debugMode: false
};

export interface SyncStatus {
	isConnected: boolean;
	lastSyncTime?: Date;
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

// ZimaOS目录信息接口
export interface ZimaOSDirectory {
	name: string;
	path: string;
	isDirectory: boolean;
	size?: number;
	lastModified?: Date;
}

export interface ZimaOSFile {
	name: string;
	path: string;
	size: number;
	lastModified: number; // timestamp in milliseconds
	isDirectory: boolean;
	modified: string; // ISO string format
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