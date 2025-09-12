#!/usr/bin/env node

// Test file import functionality
import fs from 'fs/promises';
import path from 'path';

class ImportFunctionTest {
    constructor() {
        this.sourceDir = './test-zimaos-source';
        this.targetDir = './test-obsidian-vault';
        this.conflictDir = './test-conflict-resolution';
    }

    async setup() {
        console.log('🔧 Setting up import test environment...');
        
        // Create test directories
        await this.ensureDir(this.sourceDir);
        await this.ensureDir(this.targetDir);
        await this.ensureDir(this.conflictDir);
        
        // Create mock ZimaOS source files
        await this.createSourceFiles();
        
        // Create existing Obsidian files (for conflict testing)
        await this.createExistingFiles();
        
        console.log('✅ Import test environment setup completed');
    }

    async ensureDir(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    async createSourceFiles() {
        const sourceFiles = [
            {
                path: 'imported-note1.md',
                content: '# Note 1 Imported from ZimaOS\n\nThis is a note imported from ZimaOS cloud storage.\n\n## Content\n- Important Info A\n- Important Info B\n- Important Info C'
            },
            {
                path: 'projects/project-alpha.md',
                content: '# Project Alpha\n\n## Project Overview\nThis is a project document imported from ZimaOS.\n\n## Task List\n- [ ] Task 1\n- [ ] Task 2\n- [x] Completed Task'
            },
            {
                path: 'research/research-notes.md',
                content: '# Research Notes\n\n## Research Topic\nResearch materials synced from ZimaOS.\n\n```python\n# Example code\ndef analyze_data(data):\n    return data.mean()\n```'
            },
            {
                path: 'conflict-test.md',
                content: '# Conflict Test File (ZimaOS Version)\n\nThis is the ZimaOS version, content differs from local.\n\nModified: 2024-01-15 10:00'
            }
        ];

        for (const file of sourceFiles) {
            const fullPath = path.join(this.sourceDir, file.path);
            const dir = path.dirname(fullPath);
            await this.ensureDir(dir);
            await fs.writeFile(fullPath, file.content, 'utf8');
        }
    }

    async createExistingFiles() {
        const existingFiles = [
            {
                path: 'existing-note.md',
                content: '# Existing Note\n\nThis is an existing note in Obsidian.'
            },
            {
                path: 'conflict-test.md',
                content: '# Conflict Test File (Local Version)\n\nThis is the local version, content differs from ZimaOS.\n\nModified: 2024-01-15 09:00'
            }
        ];

        for (const file of existingFiles) {
            const fullPath = path.join(this.targetDir, file.path);
            const dir = path.dirname(fullPath);
            await this.ensureDir(dir);
            await fs.writeFile(fullPath, file.content, 'utf8');
        }
    }

    async testBasicImport() {
        console.log('🔍 Testing basic import functionality...');
        
        try {
            const sourceFiles = await this.scanDirectory(this.sourceDir);
            console.log(`   Source files: ${sourceFiles.length}`);
            
            let importedCount = 0;
            for (const file of sourceFiles) {
                if (file.relativePath === 'conflict-test.md') {
                    continue; // Skip conflict file, test separately
                }
                
                const content = await fs.readFile(file.fullPath, 'utf8');
                const targetPath = path.join(this.targetDir, file.relativePath);
                const targetDir = path.dirname(targetPath);
                
                await this.ensureDir(targetDir);
                await fs.writeFile(targetPath, content, 'utf8');
                importedCount++;
            }
            
            console.log(`   Successfully imported files: ${importedCount}`);
            console.log('✅ Basic import functionality working');
            return true;
        } catch (error) {
            console.log(`❌ Basic import failed: ${error.message}`);
            return false;
        }
    }

    async testConflictResolution() {
        console.log('🔍 Testing conflict resolution functionality...');
        
        try {
            const conflictFile = 'conflict-test.md';
            const sourcePath = path.join(this.sourceDir, conflictFile);
            const targetPath = path.join(this.targetDir, conflictFile);
            
            // 检查文件是否存在冲突
            const sourceExists = await this.fileExists(sourcePath);
            const targetExists = await this.fileExists(targetPath);
            
            if (!sourceExists || !targetExists) {
                console.log('❌ Conflict test files do not exist');
                return false;
            }
            
            const sourceContent = await fs.readFile(sourcePath, 'utf8');
            const targetContent = await fs.readFile(targetPath, 'utf8');
            
            console.log(`   Conflict file detected: ${conflictFile}`);
            console.log(`   Source file length: ${sourceContent.length} characters`);
            console.log(`   Target file length: ${targetContent.length} characters`);
            
            // Simulate conflict resolution strategy: create backup and overwrite
            const backupPath = path.join(this.conflictDir, `${conflictFile}.backup`);
            await fs.writeFile(backupPath, targetContent, 'utf8');
            await fs.writeFile(targetPath, sourceContent, 'utf8');
            
            console.log(`   Backup created: ${backupPath}`);
            console.log('✅ Conflict resolution functionality working');
            return true;
        } catch (error) {
            console.log(`❌ Conflict resolution failed: ${error.message}`);
            return false;
        }
    }

    async testFileValidation() {
        console.log('🔍 Testing file validation functionality...');
        
        try {
            const importedFiles = await this.scanDirectory(this.targetDir);
            console.log(`   Files to validate: ${importedFiles.length}`);
            
            let validCount = 0;
            let invalidCount = 0;
            
            for (const file of importedFiles) {
                const content = await fs.readFile(file.fullPath, 'utf8');
                
                // Validate file format
                const isValidMarkdown = file.relativePath.endsWith('.md');
                const hasContent = content.trim().length > 0;
                const hasValidEncoding = this.isValidUTF8(content);
                
                if (isValidMarkdown && hasContent && hasValidEncoding) {
                    validCount++;
                } else {
                    invalidCount++;
                    console.log(`   ⚠️ Invalid file: ${file.relativePath}`);
                }
            }
            
            console.log(`   Valid files: ${validCount}`);
            console.log(`   Invalid files: ${invalidCount}`);
            
            const success = invalidCount === 0;
            console.log(`   Validation result: ${success ? '✅ All files valid' : '❌ Invalid files exist'}`);
            return success;
        } catch (error) {
            console.log(`❌ File validation failed: ${error.message}`);
            return false;
        }
    }

    isValidUTF8(str) {
        try {
            return Buffer.from(str, 'utf8').toString('utf8') === str;
        } catch {
            return false;
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    async scanDirectory(dirPath) {
        const files = [];
        
        async function scan(currentPath, relativePath = '') {
            const items = await fs.readdir(currentPath);
            
            for (const item of items) {
                const fullPath = path.join(currentPath, item);
                const itemRelativePath = path.join(relativePath, item);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    await scan(fullPath, itemRelativePath);
                } else if (stat.isFile() && item.endsWith('.md')) {
                    files.push({
                        fullPath,
                        relativePath: itemRelativePath,
                        size: stat.size,
                        modified: stat.mtime
                    });
                }
            }
        }
        
        await scan(dirPath);
        return files;
    }

    async cleanup() {
        console.log('🧹 Cleaning up import test environment...');
        try {
            await fs.rm(this.sourceDir, { recursive: true, force: true });
            await fs.rm(this.targetDir, { recursive: true, force: true });
            await fs.rm(this.conflictDir, { recursive: true, force: true });
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.log(`⚠️ Cleanup warning: ${error.message}`);
        }
    }

    async runAllTests() {
        console.log('🚀 Starting file import functionality test\n');
        
        try {
            await this.setup();
            console.log('');
            
            const basicImportResult = await this.testBasicImport();
            console.log('');
            
            const conflictResult = await this.testConflictResolution();
            console.log('');
            
            const validationResult = await this.testFileValidation();
            console.log('');
            
            console.log('📊 Test Results Summary:');
            console.log(`   Basic Import: ${basicImportResult ? '✅ Passed' : '❌ Failed'}`);
            console.log(`   Conflict Resolution: ${conflictResult ? '✅ Passed' : '❌ Failed'}`);
            console.log(`   File Validation: ${validationResult ? '✅ Passed' : '❌ Failed'}`);
            
            const overallSuccess = basicImportResult && conflictResult && validationResult;
            console.log(`   Overall Result: ${overallSuccess ? '✅ All tests passed' : '❌ Some tests failed'}`);
            
            return overallSuccess;
        } finally {
            console.log('');
            await this.cleanup();
        }
    }
}

// Run tests
const tester = new ImportFunctionTest();
tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Test execution error:', error);
    process.exit(1);
});}]}