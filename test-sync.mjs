#!/usr/bin/env node

// Test file synchronization functionality
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

class SyncFunctionTest {
    constructor() {
        this.testDir = './test-vault';
        this.backupDir = './test-backup';
    }

    async setup() {
        console.log('🔧 Setting up test environment...');
        
        // Create test directories
        await this.ensureDir(this.testDir);
        await this.ensureDir(this.backupDir);
        
        // Create test files
        await this.createTestFiles();
        console.log('✅ Test environment setup completed');
    }

    async ensureDir(dirPath) {
        try {
            await fs.access(dirPath);
        } catch {
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    async createTestFiles() {
        const testFiles = [
            {
                path: 'note1.md',
                content: '# Test Note 1\n\nThis is a test note for verifying sync functionality.\n\n- Item 1\n- Item 2\n- Item 3'
            },
            {
                path: 'folder1/note2.md',
                content: '# Subfolder Note\n\nThis is a note located in a subfolder.\n\n```javascript\nconsole.log("Hello World");\n```'
            },
            {
                path: 'daily/2024-01-01.md',
                content: '# 2024-01-01 Daily\n\nToday\'s tasks:\n- [x] Complete Project A\n- [ ] Start Project B\n- [ ] Review notes'
            }
        ];

        for (const file of testFiles) {
            const fullPath = path.join(this.testDir, file.path);
            const dir = path.dirname(fullPath);
            await this.ensureDir(dir);
            await fs.writeFile(fullPath, file.content, 'utf8');
        }
    }

    async testFileEncryption() {
        console.log('🔍 Testing file encryption functionality...');
        
        const testContent = 'This is a test content for encryption';
        const password = 'test-password-123';
        
        // 模拟加密过程
        const encrypted = this.encryptContent(testContent, password);
        console.log(`   Encrypted length: ${encrypted.length} characters`);
        
        // Simulate decryption process
        const decrypted = this.decryptContent(encrypted, password);
        const success = decrypted === testContent;
        
        console.log(`   Decryption result: ${success ? '✅ Success' : '❌ Failed'}`);
        return success;
    }

    encryptContent(content, password) {
        const algorithm = 'aes-256-cbc';
        const key = crypto.scryptSync(password, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        
        let encrypted = cipher.update(content, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return iv.toString('hex') + ':' + encrypted;
    }

    decryptContent(encryptedData, password) {
        try {
            const algorithm = 'aes-256-cbc';
            const key = crypto.scryptSync(password, 'salt', 32);
            const [ivHex, encrypted] = encryptedData.split(':');
            const iv = Buffer.from(ivHex, 'hex');
            const decipher = crypto.createDecipheriv(algorithm, key, iv);
            
            let decrypted = decipher.update(encrypted, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            
            return decrypted;
        } catch (error) {
            return null;
        }
    }

    async testBackupCreation() {
        console.log('🔍 Testing backup creation functionality...');
        
        try {
            const files = await this.scanDirectory(this.testDir);
            console.log(`   Files found: ${files.length}`);
            
            let backupCount = 0;
            for (const file of files) {
                const content = await fs.readFile(file.fullPath, 'utf8');
                const backupPath = path.join(this.backupDir, file.relativePath);
                const backupDir = path.dirname(backupPath);
                
                await this.ensureDir(backupDir);
                await fs.writeFile(backupPath, content, 'utf8');
                backupCount++;
            }
            
            console.log(`   Backup files created: ${backupCount}`);
            console.log('✅ Backup creation successful');
            return true;
        } catch (error) {
            console.log(`❌ Backup creation failed: ${error.message}`);
            return false;
        }
    }

    async testFileRestore() {
        console.log('🔍 Testing file restore functionality...');
        
        try {
            // Delete original files
            await fs.rm(this.testDir, { recursive: true, force: true });
            await this.ensureDir(this.testDir);
            
            // Restore from backup
            const backupFiles = await this.scanDirectory(this.backupDir);
            console.log(`   Files to restore: ${backupFiles.length}`);
            
            let restoredCount = 0;
            for (const file of backupFiles) {
                const content = await fs.readFile(file.fullPath, 'utf8');
                const restorePath = path.join(this.testDir, file.relativePath);
                const restoreDir = path.dirname(restorePath);
                
                await this.ensureDir(restoreDir);
                await fs.writeFile(restorePath, content, 'utf8');
                restoredCount++;
            }
            
            console.log(`   Files restored: ${restoredCount}`);
            console.log('✅ File restore successful');
            return true;
        } catch (error) {
            console.log(`❌ File restore failed: ${error.message}`);
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
        console.log('🧹 Cleaning up test environment...');
        try {
            await fs.rm(this.testDir, { recursive: true, force: true });
            await fs.rm(this.backupDir, { recursive: true, force: true });
            console.log('✅ Cleanup completed');
        } catch (error) {
            console.log(`⚠️ Cleanup warning: ${error.message}`);
        }
    }

    async runAllTests() {
        console.log('🚀 开始文件同步功能测试\n');
        
        try {
            await this.setup();
            console.log('');
            
            const encryptionResult = await this.testFileEncryption();
            console.log('');
            
            const backupResult = await this.testBackupCreation();
            console.log('');
            
            const restoreResult = await this.testFileRestore();
            console.log('');
            
            console.log('📊 测试结果汇总:');
            console.log(`   文件加密: ${encryptionResult ? '✅ 成功' : '❌ 失败'}`);
            console.log(`   备份创建: ${backupResult ? '✅ 成功' : '❌ 失败'}`);
            console.log(`   文件恢复: ${restoreResult ? '✅ 成功' : '❌ 失败'}`);
            
            const overallSuccess = encryptionResult && backupResult && restoreResult;
            console.log(`   整体状态: ${overallSuccess ? '✅ 所有测试通过' : '❌ 部分测试失败'}`);
            
            return overallSuccess;
        } finally {
            console.log('');
            await this.cleanup();
        }
    }
}

// 运行测试
const tester = new SyncFunctionTest();
tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('测试执行错误:', error);
    process.exit(1);
});