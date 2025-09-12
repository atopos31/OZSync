# ZimaOS 状态栏调试指南

## 问题描述
用户反映控制台右下角的ZimaOS状态显示不对，且控制台没有看到相关的输出和数据请求。

## 已添加的调试功能

### 1. 详细的控制台日志
我们在以下关键位置添加了详细的调试日志：

- **主插件初始化** (`main.ts`)：
  - 插件加载过程
  - 状态栏创建过程
  - 同步状态初始化
  - 自动同步设置

- **状态栏更新** (`main.ts`)：
  - 状态栏更新触发
  - 状态计算过程
  - 状态文本生成
  - DOM更新结果

- **连接测试** (`sync-manager.ts` 和 `zimaos-client.ts`)：
  - 连接测试开始
  - 登录过程详情
  - API调用结果
  - 错误处理详情

- **登录流程** (`zimaos-client.ts`)：
  - 登录请求准备
  - HTTP请求发送
  - 响应处理
  - Token管理

### 2. 调试命令
添加了一个新的命令 "Debug Status Bar"，可以通过以下方式访问：
- 打开命令面板 (Ctrl/Cmd + P)
- 输入 "Debug Status Bar"
- 执行命令查看详细调试信息

### 3. 全局调试接口
插件实例现在暴露在 `window.zimaosPlugin`，可以在浏览器控制台中直接访问：

```javascript
// 查看插件实例
console.log(window.zimaosPlugin);

// 查看当前同步状态
console.log(window.zimaosPlugin.syncStatus);

// 手动触发状态栏更新
window.zimaosPlugin.updateStatusBar();

// 手动触发调试
window.zimaosPlugin.debugStatusBar();

// 测试连接
window.zimaosPlugin.zimaosClient.testConnection();
```

### 4. 调试脚本
创建了 `debug-status.js` 文件，包含完整的调试脚本，可以直接在控制台中运行。

## 如何调试

### 步骤1：打开开发者工具
1. 在Obsidian中按 `F12` 或 `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
2. 切换到 "Console" 标签页

### 步骤2：查看初始化日志
重新加载插件或重启Obsidian，观察控制台中的初始化日志：
- `[ZimaOS Plugin] 插件开始加载`
- `[ZimaOS Plugin] 创建状态栏项`
- `[ZimaOS Plugin] 状态栏项创建成功`
- `[ZimaOS Plugin] 初始化插件`

### 步骤3：手动触发调试
在控制台中运行：
```javascript
window.zimaosPlugin.debugStatusBar();
```

### 步骤4：测试连接
在控制台中运行：
```javascript
window.zimaosPlugin.zimaosClient.testConnection();
```

### 步骤5：查看状态栏更新
观察控制台中的状态栏更新日志：
- `[Main] updateStatusBar 被调用`
- `[Main] 当前同步状态`
- `[Main] 生成状态文本`
- `[Main] 状态栏更新成功`

## 预期的调试输出

正常情况下，你应该能看到以下类型的日志：

1. **插件初始化**：
   ```
   [ZimaOS Plugin] 插件开始加载
   [ZimaOS Plugin] 创建状态栏项
   [ZimaOS Plugin] 状态栏项创建成功
   ```

2. **连接测试**：
   ```
   [ZimaOS Client] 开始连接测试
   [ZimaOS Login] 开始登录流程
   [ZimaOS Login] 登录成功，处理token数据
   [ZimaOS Client] API连接测试成功
   ```

3. **状态栏更新**：
   ```
   [Main] updateStatusBar 被调用
   [Main] 当前同步状态: {...}
   [Main] 生成状态文本: "ZimaOS: 已连接"
   [Main] 状态栏更新成功
   ```

## 常见问题排查

### 如果没有看到任何日志：
1. 确认插件已启用
2. 检查控制台是否有JavaScript错误
3. 尝试重新加载插件

### 如果状态栏不显示：
1. 检查 `statusBarItem` 是否存在
2. 确认状态栏元素没有被隐藏
3. 验证状态文本是否正确生成

### 如果连接失败：
1. 检查服务器配置
2. 验证用户名和密码
3. 确认网络连接
4. 查看详细的错误信息

## 下一步

根据调试输出的结果，我们可以：
1. 识别具体的问题点
2. 修复发现的bug
3. 优化状态显示逻辑
4. 改进错误处理机制

请运行调试命令并分享控制台输出，这样我们就能准确定位问题所在。