// ZimaOS 状态栏调试脚本
// 在 Obsidian 开发者控制台中运行此脚本

console.log('=== ZimaOS 状态栏调试脚本开始 ===');

// 检查插件是否存在
if (typeof window.zimaosPlugin === 'undefined') {
    console.error('❌ 插件实例不存在！请确保插件已加载。');
    console.log('💡 尝试重新加载插件或重启 Obsidian');
} else {
    console.log('✅ 插件实例已找到');
    
    const plugin = window.zimaosPlugin;
    
    // 1. 基本信息检查
    console.log('\n--- 1. 基本信息检查 ---');
    console.log('插件名称:', plugin.manifest?.name || 'Unknown');
    console.log('插件版本:', plugin.manifest?.version || 'Unknown');
    console.log('插件是否启用:', plugin.app?.plugins?.enabledPlugins?.has(plugin.manifest?.id) || false);
    
    // 2. 状态栏检查
    console.log('\n--- 2. 状态栏检查 ---');
    if (plugin.statusBarItem) {
        console.log('✅ 状态栏元素存在');
        console.log('状态栏文本:', plugin.statusBarItem.getText ? plugin.statusBarItem.getText() : plugin.statusBarItem.innerText);
        console.log('状态栏HTML:', plugin.statusBarItem.innerHTML);
        console.log('状态栏可见性:', plugin.statusBarItem.style.display !== 'none');
        console.log('状态栏类名:', plugin.statusBarItem.className);
        
        // 检查状态栏是否在DOM中
        const isInDOM = document.body.contains(plugin.statusBarItem);
        console.log('状态栏在DOM中:', isInDOM);
        
        if (!isInDOM) {
            console.warn('⚠️ 状态栏元素不在DOM中，可能已被移除');
        }
    } else {
        console.error('❌ 状态栏元素不存在！');
    }
    
    // 3. 同步状态检查
    console.log('\n--- 3. 同步状态检查 ---');
    if (plugin.syncStatus) {
        console.log('同步状态:', JSON.stringify(plugin.syncStatus, null, 2));
    } else {
        console.error('❌ 同步状态不存在！');
    }
    
    // 4. 客户端状态检查
    console.log('\n--- 4. 客户端状态检查 ---');
    if (plugin.zimaosClient) {
        console.log('✅ ZimaOS客户端存在');
        try {
            const authState = plugin.zimaosClient.getAuthState();
            console.log('认证状态:', authState);
        } catch (error) {
            console.error('获取认证状态失败:', error);
        }
    } else {
        console.error('❌ ZimaOS客户端不存在！');
    }
    
    // 5. 设置检查
    console.log('\n--- 5. 设置检查 ---');
    if (plugin.settings) {
        console.log('插件设置:', JSON.stringify(plugin.settings, null, 2));
    } else {
        console.error('❌ 插件设置不存在！');
    }
    
    // 6. 手动测试功能
    console.log('\n--- 6. 手动测试功能 ---');
    
    // 测试状态栏更新
    console.log('🔄 测试状态栏更新...');
    try {
        plugin.updateStatusBar();
        console.log('✅ 状态栏更新成功');
        
        // 等待一下再检查结果
        setTimeout(() => {
            if (plugin.statusBarItem) {
                console.log('更新后的状态栏文本:', plugin.statusBarItem.getText ? plugin.statusBarItem.getText() : plugin.statusBarItem.innerText);
            }
        }, 100);
    } catch (error) {
        console.error('❌ 状态栏更新失败:', error);
    }
    
    // 测试连接
    console.log('🔄 测试连接...');
    if (plugin.zimaosClient && typeof plugin.zimaosClient.testConnection === 'function') {
        plugin.zimaosClient.testConnection()
            .then(result => {
                console.log('✅ 连接测试成功:', result);
            })
            .catch(error => {
                console.error('❌ 连接测试失败:', error);
            });
    } else {
        console.error('❌ 无法执行连接测试');
    }
    
    // 7. 调试命令测试
    console.log('\n--- 7. 调试命令测试 ---');
    if (typeof plugin.debugStatusBar === 'function') {
        console.log('🔄 执行调试命令...');
        try {
            plugin.debugStatusBar();
        } catch (error) {
            console.error('❌ 调试命令执行失败:', error);
        }
    } else {
        console.error('❌ 调试命令不存在');
    }
}

console.log('\n=== 调试脚本结束 ===');
console.log('\n💡 使用提示:');
console.log('- 如果状态栏不显示，检查插件是否正确加载');
console.log('- 如果连接失败，检查服务器设置和网络连接');
console.log('- 可以运行 window.zimaosPlugin.debugStatusBar() 获取更多信息');
console.log('- 可以运行 window.zimaosPlugin.updateStatusBar() 手动更新状态栏');