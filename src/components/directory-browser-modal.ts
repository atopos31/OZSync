import { App, Modal, Setting, Notice } from 'obsidian';
import ZimaOSSyncPlugin from '../../main';
import { ZimaOSDirectory } from '../types';

export class DirectoryBrowserModal extends Modal {
	plugin: ZimaOSSyncPlugin;
	onSelect: (path: string) => void;
	currentPath: string = '/media';
	directories: ZimaOSDirectory[] = [];
	contentEl: HTMLElement;

	constructor(app: App, plugin: ZimaOSSyncPlugin, onSelect: (path: string) => void) {
		super(app);
		this.plugin = plugin;
		this.onSelect = onSelect;
	}

	onOpen() {
		const { contentEl } = this;
		this.contentEl = contentEl;
		contentEl.empty();

		// Modal title
		contentEl.createEl('h2', { text: 'Select Sync Directory' });

		// Current path display
		const pathEl = contentEl.createEl('div', { cls: 'directory-path' });
		pathEl.createEl('strong', { text: 'Current Path: ' });
		pathEl.createEl('span', { text: this.currentPath });

		// Directory list container
		const listContainer = contentEl.createEl('div', { cls: 'directory-list' });

		// Load directories
		this.loadDirectories(listContainer);

		// Action buttons
		const buttonContainer = contentEl.createEl('div', { cls: 'modal-button-container' });
		
		// Select current directory button
		new Setting(buttonContainer)
			.addButton(button => button
				.setButtonText('Select This Directory')
				.setCta()
				.onClick(() => {
					this.onSelect(this.currentPath);
					this.close();
				}))
			.addButton(button => button
				.setButtonText('Cancel')
				.onClick(() => {
					this.close();
				}));
	}

	private async loadDirectories(container: HTMLElement): Promise<void> {
		container.empty();
		container.createEl('div', { text: 'Loading directories...', cls: 'loading-text' });

		try {
			this.directories = await this.plugin.zimaosClient.listDirectories(this.currentPath);
			this.renderDirectories(container);
		} catch (error) {
			console.error('Failed to load directories:', error);
			container.empty();
			container.createEl('div', { 
				text: 'Failed to load directories. Please check your connection.', 
				cls: 'error-text' 
			});
		}
	}

	private renderDirectories(container: HTMLElement): void {
		container.empty();

		// Add parent directory option (if not at root)
		if (this.currentPath !== '/' && this.currentPath !== '/media') {
			const parentItem = container.createEl('div', { cls: 'directory-item parent-dir' });
			parentItem.createEl('span', { text: '📁 ..', cls: 'directory-icon' });
			parentItem.createEl('span', { text: 'Parent Directory', cls: 'directory-name' });
			parentItem.addEventListener('click', () => {
				this.navigateToParent();
			});
		}

		// Add directories
		const dirs = this.directories.filter(item => item.isDirectory);
		if (dirs.length === 0) {
			container.createEl('div', { 
				text: 'No subdirectories found in this location.', 
				cls: 'empty-text' 
			});
			return;
		}

		dirs.forEach(dir => {
			const dirItem = container.createEl('div', { cls: 'directory-item' });
			dirItem.createEl('span', { text: '📁', cls: 'directory-icon' });
			dirItem.createEl('span', { text: dir.name, cls: 'directory-name' });
			
			// Add size info if available
			if (dir.size !== undefined) {
				dirItem.createEl('span', { 
					text: this.formatSize(dir.size), 
					cls: 'directory-size' 
				});
			}

			dirItem.addEventListener('click', () => {
				this.navigateToDirectory(dir.path);
			});
		});
	}

	private navigateToParent(): void {
		const pathParts = this.currentPath.split('/').filter(p => p.length > 0);
		if (pathParts.length > 1) {
			pathParts.pop();
			this.currentPath = '/' + pathParts.join('/');
		} else {
			this.currentPath = '/media';
		}
		this.updateView();
	}

	private navigateToDirectory(path: string): void {
		this.currentPath = path;
		this.updateView();
	}

	private updateView(): void {
		// Update path display
		const pathEl = this.contentEl.querySelector('.directory-path span');
		if (pathEl) {
			pathEl.textContent = this.currentPath;
		}

		// Reload directories
		const listContainer = this.contentEl.querySelector('.directory-list') as HTMLElement;
		if (listContainer) {
			this.loadDirectories(listContainer);
		}
	}

	private formatSize(bytes: number): string {
		if (bytes === 0) return '0 B';
		const k = 1024;
		const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}