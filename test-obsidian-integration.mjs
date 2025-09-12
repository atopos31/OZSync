#!/usr/bin/env node

// 测试Obsidian插件集成
import fs from 'fs/promises';
import path from 'path';

class ObsidianIntegrationTest {
    constructor() {
        this.pluginDir = '.';
        this.requiredFiles = [
            'manifest.json',
            'main.js',
            'styles.css'
        ];
    }

    async testPluginStructure() {
        console.log('🔍 测试插件文件结构...');
        
        try {
            let allFilesExist = true;
            
            for (const file of this.requiredFiles) {
                const filePath = path.join(this.pluginDir, file);
                try {
                    const stats = await fs.stat(filePath);
                    console.log(`   ✅ ${file} (${this.formatFileSize(stats.size)})`);
                } catch {
                    console.log(`   ❌ ${file} - 文件不存在`);
                    allFilesExist = false;
                }
            }
            
            if (allFilesExist) {
                console.log('✅ 插件文件结构完整');
                return true;
            } else {
                console.log('❌ 插件文件结构不完整');
                return false;
            }
        } catch (error) {
            console.log(`❌ 文件结构检查失败: ${error.message}`);
            return false;
        }
    }

    async testManifestValidation() {
        console.log('🔍 测试manifest.json配置...');
        
        try {
            const manifestPath = path.join(this.pluginDir, 'manifest.json');
            const manifestContent = await fs.readFile(manifestPath, 'utf8');
            const manifest = JSON.parse(manifestContent);
            
            const requiredFields = ['id', 'name', 'version', 'minAppVersion', 'description', 'author'];
            let validFields = 0;
            
            for (const field of requiredFields) {
                if (manifest[field]) {
                    console.log(`   ✅ ${field}: ${manifest[field]}`);
                    validFields++;
                } else {
                    console.log(`   ❌ ${field}: 缺失`);
                }
            }
            
            // 检查版本格式
            const versionRegex = /^\d+\.\d+\.\d+$/;
            const validVersion = versionRegex.test(manifest.version);
            const validMinAppVersion = versionRegex.test(manifest.minAppVersion);
            
            console.log(`   版本格式: ${validVersion ? '✅' : '❌'} ${manifest.version}`);
            console.log(`   最低应用版本: ${validMinAppVersion ? '✅' : '❌'} ${manifest.minAppVersion}`);
            
            const isValid = validFields === requiredFields.length && validVersion && validMinAppVersion;
            console.log(`${isValid ? '✅' : '❌'} manifest.json配置${isValid ? '有效' : '无效'}`);
            return isValid;
        } catch (error) {
            console.log(`❌ manifest.json验证失败: ${error.message}`);
            return false;
        }
    }

    async testMainJsValidation() {
        console.log('🔍 测试main.js文件...');
        
        try {
            const mainJsPath = path.join(this.pluginDir, 'main.js');
            const stats = await fs.stat(mainJsPath);
            const content = await fs.readFile(mainJsPath, 'utf8');
            
            console.log(`   文件大小: ${this.formatFileSize(stats.size)}`);
            console.log(`   内容长度: ${content.length} 字符`);
            
            // 检查是否包含基本的插件结构
            const hasPluginClass = content.includes('Plugin') || content.includes('class');
            const hasObsidianImport = content.includes('obsidian') || content.includes('Plugin');
            const hasExports = content.includes('module.exports') || content.includes('export');
            
            console.log(`   包含插件类: ${hasPluginClass ? '✅' : '❌'}`);
            console.log(`   包含Obsidian导入: ${hasObsidianImport ? '✅' : '❌'}`);
            console.log(`   包含导出: ${hasExports ? '✅' : '❌'}`);
            
            // 检查文件是否为空或只有注释
            const nonCommentLines = content.split('\n').filter(line => {
                const trimmed = line.trim();
                return trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*') && !trimmed.startsWith('*');
            });
            
            const hasActualCode = nonCommentLines.length > 5;
            console.log(`   包含实际代码: ${hasActualCode ? '✅' : '❌'} (${nonCommentLines.length} 行)`);
            
            const isValid = hasPluginClass && hasObsidianImport && hasExports && hasActualCode;
            console.log(`${isValid ? '✅' : '❌'} main.js文件${isValid ? '有效' : '无效'}`);
            return isValid;
        } catch (error) {
            console.log(`❌ main.js验证失败: ${error.message}`);
            return false;
        }
    }

    async testStylesValidation() {
        console.log('🔍 测试styles.css文件...');
        
        try {
            const stylesPath = path.join(this.pluginDir, 'styles.css');
            const stats = await fs.stat(stylesPath);
            const content = await fs.readFile(stylesPath, 'utf8');
            
            console.log(`   文件大小: ${this.formatFileSize(stats.size)}`);
            console.log(`   内容长度: ${content.length} 字符`);
            
            // 检查CSS内容
            const hasSelectors = content.includes('.') || content.includes('#');
            const hasProperties = content.includes(':') && content.includes(';');
            const hasZimaOSStyles = content.includes('zimaos') || content.includes('ZimaOS');
            
            console.log(`   包含CSS选择器: ${hasSelectors ? '✅' : '❌'}`);
            console.log(`   包含CSS属性: ${hasProperties ? '✅' : '❌'}`);
            console.log(`   包含ZimaOS样式: ${hasZimaOSStyles ? '✅' : '❌'}`);
            
            // 统计CSS规则数量
            const ruleCount = (content.match(/\{[^}]*\}/g) || []).length;
            console.log(`   CSS规则数量: ${ruleCount}`);
            
            const isValid = hasSelectors && hasProperties && ruleCount > 0;
            console.log(`${isValid ? '✅' : '❌'} styles.css文件${isValid ? '有效' : '无效'}`);
            return isValid;
        } catch (error) {
            console.log(`❌ styles.css验证失败: ${error.message}`);
            return false;
        }
    }

    async testObsidianCompatibility() {
        console.log('🔍 测试Obsidian兼容性...');
        
        try {
            // 检查插件目录位置
            const currentPath = process.cwd();
            const isInPluginsDir = currentPath.includes('.obsidian/plugins');
            console.log(`   位于插件目录: ${isInPluginsDir ? '✅' : '⚠️'} ${isInPluginsDir ? '' : '(当前位置可能不是Obsidian插件目录)'}`);
            
            // 检查manifest中的版本兼容性
            const manifestPath = path.join(this.pluginDir, 'manifest.json');
            const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
            
            const minVersion = manifest.minAppVersion;
            const versionParts = minVersion.split('.').map(Number);
            const isRecentVersion = versionParts[0] > 0 || (versionParts[0] === 0 && versionParts[1] >= 15);
            
            console.log(`   最低版本要求: ${isRecentVersion ? '✅' : '⚠️'} ${minVersion} ${isRecentVersion ? '(兼容现代Obsidian)' : '(版本较旧)'}`);
            
            // 检查是否为桌面端插件
            const isDesktopOnly = manifest.isDesktopOnly === true;
            console.log(`   桌面端专用: ${isDesktopOnly ? '⚠️' : '✅'} ${isDesktopOnly ? '(仅桌面端)' : '(支持移动端)'}`);
            
            console.log('✅ Obsidian兼容性检查完成');
            return true;
        } catch (error) {
            console.log(`❌ 兼容性检查失败: ${error.message}`);
            return false;
        }
    }

    async testPluginInstallation() {
        console.log('🔍 测试插件安装准备...');
        
        try {
            // 检查是否在正确的目录结构中
            const currentPath = process.cwd();
            const pathParts = currentPath.split(path.sep);
            
            let obsidianIndex = -1;
            let pluginsIndex = -1;
            
            for (let i = 0; i < pathParts.length; i++) {
                if (pathParts[i] === '.obsidian') {
                    obsidianIndex = i;
                }
                if (pathParts[i] === 'plugins') {
                    pluginsIndex = i;
                }
            }
            
            const hasCorrectStructure = obsidianIndex !== -1 && pluginsIndex === obsidianIndex + 1;
            console.log(`   目录结构正确: ${hasCorrectStructure ? '✅' : '⚠️'}`);
            
            if (hasCorrectStructure) {
                const vaultPath = pathParts.slice(0, obsidianIndex).join(path.sep);
                const pluginName = pathParts[pathParts.length - 1];
                console.log(`   Vault路径: ${vaultPath}`);
                console.log(`   插件名称: ${pluginName}`);
            }
            
            // 检查文件权限
            const files = ['manifest.json', 'main.js', 'styles.css'];
            let allReadable = true;
            
            for (const file of files) {
                try {
                    await fs.access(path.join(this.pluginDir, file), fs.constants.R_OK);
                    console.log(`   ${file} 可读: ✅`);
                } catch {
                    console.log(`   ${file} 可读: ❌`);
                    allReadable = false;
                }
            }
            
            const installReady = hasCorrectStructure && allReadable;
            console.log(`${installReady ? '✅' : '⚠️'} 插件${installReady ? '已准备好安装' : '安装准备需要注意'}`);
            return installReady;
        } catch (error) {
            console.log(`❌ 安装准备检查失败: ${error.message}`);
            return false;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async runAllTests() {
        console.log('🚀 开始Obsidian插件集成测试\n');
        
        const structureResult = await this.testPluginStructure();
        console.log('');
        
        const manifestResult = await this.testManifestValidation();
        console.log('');
        
        const mainJsResult = await this.testMainJsValidation();
        console.log('');
        
        const stylesResult = await this.testStylesValidation();
        console.log('');
        
        const compatibilityResult = await this.testObsidianCompatibility();
        console.log('');
        
        const installationResult = await this.testPluginInstallation();
        console.log('');
        
        console.log('📊 测试结果汇总:');
        console.log(`   文件结构: ${structureResult ? '✅ 完整' : '❌ 不完整'}`);
        console.log(`   Manifest配置: ${manifestResult ? '✅ 有效' : '❌ 无效'}`);
        console.log(`   主文件: ${mainJsResult ? '✅ 有效' : '❌ 无效'}`);
        console.log(`   样式文件: ${stylesResult ? '✅ 有效' : '❌ 无效'}`);
        console.log(`   兼容性: ${compatibilityResult ? '✅ 兼容' : '❌ 不兼容'}`);
        console.log(`   安装准备: ${installationResult ? '✅ 就绪' : '⚠️ 需注意'}`);
        
        const overallSuccess = structureResult && manifestResult && mainJsResult && stylesResult && compatibilityResult;
        console.log(`   整体状态: ${overallSuccess ? '✅ 插件已准备就绪' : '❌ 插件需要修复'}`);
        
        if (overallSuccess) {
            console.log('\n🎉 插件已准备好在Obsidian中使用！');
            console.log('\n📝 使用说明:');
            console.log('   1. 确保此目录位于 .obsidian/plugins/ 下');
            console.log('   2. 在Obsidian中启用社区插件');
            console.log('   3. 在插件列表中找到并启用 "ZimaOS Sync"');
            console.log('   4. 在设置中配置ZimaOS连接信息');
        }
        
        return overallSuccess;
    }
}

// 运行测试
const tester = new ObsidianIntegrationTest();
tester.runAllTests().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('测试执行错误:', error);
    process.exit(1);
});