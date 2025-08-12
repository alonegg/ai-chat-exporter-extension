# AI Chat Exporter - Browser Extension

一个功能强大的浏览器插件，可以将与AI大语言模型的对话内容导出为Markdown和HTML文件，并自动保存到GitHub仓库。

## 核心功能特性

### 🌐 多平台支持
- **ChatGPT** (`chatgpt.com`, `chat.openai.com`)
  - 自动识别用户和助手消息
  - 保留代码块格式和语法高亮
  - 支持多轮对话完整导出
  
- **Claude** (`claude.ai`)
  - 提取完整对话历史
  - 保持消息结构和格式
  - 支持Claude的特殊格式内容
  
- **Gemini** (`gemini.google.com`)
  - 导出Google Gemini对话
  - 保留富文本格式
  - 支持图文混合内容识别
  
- **Poe** (`poe.com`)
  - 支持所有Poe平台的AI机器人
  - 自动识别不同bot的回复
  - 保持对话上下文完整性

### 📤 GitHub集成功能
- **直接上传**: 无需手动操作，一键上传到GitHub仓库
- **智能覆盖**: 自动检测同名文件，支持更新或创建新文件
- **分支选择**: 可指定上传到特定分支（默认main）
- **路径自定义**: 支持在仓库中创建文件夹结构组织对话
- **批量操作**: 同时上传Markdown和HTML两种格式

### 📝 导出格式特性

#### Markdown格式
- 清晰的对话结构，使用分隔线区分轮次
- 保留原始格式，包括：
  - 列表和编号
  - 代码块with语言标识
  - 链接和图片引用
  - 加粗、斜体等文本样式
- 添加元数据信息（时间戳、URL、平台）

#### HTML格式
- **专业设计的样式**:
  - 渐变色标题栏
  - 用户消息：蓝色边框卡片
  - AI回复：紫色边框卡片
  - 响应式设计，适配各种屏幕
- **代码高亮**: 黑色背景的代码展示区
- **可读性优化**: 精心调整的字体和间距
- **独立文件**: 所有样式内嵌，可直接打开查看

### 🎯 智能命名系统
- **自动生成模式**: `平台-时间戳-内容摘要`
  - 示例: `chatgpt-2024-01-20-12-30-how-to-code-python`
- **时间戳模式**: 纯时间戳命名
  - 示例: `2024-01-20-12-30-45`
- **自定义前缀**: 用户定义前缀+时间戳
  - 示例: `my-chat-2024-01-20`
- **内容摘要**: 自动提取首条消息前30字符作为标题

### 🎨 用户界面功能

#### Popup弹窗
- **实时状态显示**: 成功/错误/处理中状态即时反馈
- **预览面板**: 
  - 双标签切换（Markdown/HTML）
  - 实时渲染效果展示
  - 滚动查看长对话
- **快捷操作**:
  - 一键提取当前页面对话
  - 自定义文件名输入
  - 格式选择复选框
  - 路径配置输入框

#### 设置页面
- **GitHub配置区**:
  - Access Token安全输入（密码模式）
  - 显示/隐藏Token切换按钮
  - 用户名/组织名验证
  - 仓库名实时校验
  - 连接测试功能with即时反馈
  
- **导出偏好设置**:
  - 默认导出格式选择
  - 默认保存路径配置
  - 文件命名模式选择
  - 自定义前缀设置
  
- **自动化选项**:
  - 关闭标签页时自动导出
  - 导出前确认提示
  - 批量导出支持

### 🔒 安全性设计
- **Token加密存储**: 使用Chrome同步存储API安全保存
- **权限最小化**: 仅请求必要的浏览器权限
- **本地处理**: 对话内容在本地提取和处理，不经过第三方服务器
- **Token验证**: 实时验证GitHub访问权限

## 安装指南

### Chrome浏览器安装
1. 下载插件文件到本地
2. 打开Chrome浏览器，进入 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择插件文件夹
6. 插件安装完成，在工具栏可见图标

### Edge浏览器安装
1. 打开Edge浏览器，进入 `edge://extensions/`
2. 开启左下角的"开发人员模式"
3. 点击"加载解压缩的扩展"
4. 选择插件文件夹
5. 插件安装完成

## 配置指南

### 1. 生成GitHub访问令牌
1. 登录GitHub，进入 Settings → Developer settings → Personal access tokens → Tokens (classic)
2. 点击"Generate new token (classic)"
3. 设置token名称，如"AI Chat Exporter"
4. 选择权限范围：
   - `repo` - 完整仓库访问权限
   - `public_repo` - 仅公开仓库（如果只用于公开仓库）
5. 点击"Generate token"并复制保存

### 2. 插件配置
1. 点击插件图标，选择"设置"
2. 填入GitHub配置：
   - **Personal Access Token**: 粘贴刚才生成的token
   - **用户名/组织名**: 你的GitHub用户名
   - **仓库名**: 目标仓库名称
   - **分支**: 默认为main，可自定义
3. 配置导出设置：
   - **默认路径**: 文件保存路径，如 `chats/`
   - **导出格式**: 选择Markdown和/或HTML
   - **文件命名**: 选择命名模式
4. 点击"测试连接"验证配置
5. 保存设置

## 使用教程

### 基本导出流程
1. 在支持的AI平台进行对话
2. 点击浏览器工具栏的插件图标
3. 点击"提取对话"按钮
4. 在预览区查看提取结果
5. 自定义文件名和路径（可选）
6. 选择导出格式
7. 点击"导出到GitHub"完成上传

### 高级使用技巧

#### 文件组织
- 使用路径创建文件夹：`projects/chatgpt/`
- 按日期组织：`2024/01/conversations/`
- 按主题分类：`coding/python/`, `writing/articles/`

#### 批量导出工作流
1. 开启自动导出功能
2. 设置统一的文件命名规则
3. 配置默认保存路径
4. 浏览多个对话页面，插件自动导出

#### 自动化设置
- **关闭标签自动导出**: 离开对话页面时自动保存
- **导出确认**: 避免意外导出，显示确认对话框
- **格式预设**: 设置默认导出Markdown或HTML

## 导出格式示例

### Markdown格式示例
```markdown
# AI对话记录

**时间**: 2024-01-20 14:30:25  
**平台**: ChatGPT  
**URL**: https://chatgpt.com/c/abc123  

---

**用户**: 请帮我写一个Python函数来计算斐波那契数列

**助手**: 我来为你写一个计算斐波那契数列的Python函数：

```python
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n-1) + fibonacci(n-2)
```

这是一个递归实现...

---
```

### HTML格式示例
生成的HTML文件包含：
- 响应式设计的对话界面
- 用户消息蓝色卡片样式
- AI回复紫色卡片样式
- 代码块语法高亮
- 完整的CSS样式内嵌

## 调试和故障排除

### 浏览器开发者工具
1. 按F12打开开发者工具
2. 切换到Console标签
3. 查看插件相关日志信息
4. 错误信息会显示具体问题

### 常见问题

#### 插件相关
- **提取失败**: 检查是否在支持的AI平台页面
- **按钮无响应**: 刷新页面重试
- **权限错误**: 确认已授予必要权限

#### GitHub相关
- **上传失败**: 检查token权限和网络连接
- **仓库不存在**: 确认仓库名称和权限
- **分支错误**: 确认目标分支存在

#### 内容相关
- **格式错乱**: 某些特殊字符可能需要手动调整
- **内容不完整**: 等待页面完全加载后再提取
- **重复内容**: 使用去重功能或手动编辑

### Gemini专用调试
插件包含专门的Gemini调试脚本 (`gemini-debug.js`)，可以：
- 分析页面DOM结构
- 测试不同的选择器策略
- 输出详细的提取日志

## 隐私和安全

### 数据处理
- **本地处理**: 所有对话内容在浏览器本地提取和处理
- **无第三方传输**: 不经过任何中间服务器
- **直接上传**: 仅与GitHub API直接通信

### Token安全
- **加密存储**: 使用Chrome安全存储API
- **权限控制**: 建议使用最小必要权限
- **定期更新**: 建议定期更换访问令牌

### 权限说明
- `activeTab`: 读取当前标签页内容
- `storage`: 保存用户设置
- `scripting`: 在AI平台页面注入提取脚本
- `host_permissions`: 访问指定AI平台和GitHub API

## 技术架构

### 项目结构
```
ai-chat-exporter/
├── manifest.json          # 插件配置文件
├── background.js           # 后台服务脚本
├── content.js             # 内容提取脚本
├── popup.html/js/css      # 弹窗界面
├── options.html/js/css    # 设置页面
├── icons/                 # 图标资源
└── debug/                 # 调试工具
```

### 核心技术
- **内容提取**: DOM选择器 + 智能文本处理
- **GitHub集成**: REST API + Base64编码
- **UI交互**: 原生JavaScript + CSS3
- **数据存储**: Chrome Storage API

### API使用
- **Chrome APIs**: `chrome.runtime`, `chrome.storage`, `chrome.scripting`
- **GitHub API**: Contents API for file operations
- **Web APIs**: DOM manipulation, Fetch API

## 开发指南

### 本地开发
1. 克隆仓库到本地
2. 在Chrome中加载解压缩的扩展
3. 修改代码后重新加载扩展
4. 使用开发者工具调试

### 图标生成
使用 `icons/generate-icons.html` 工具：
1. 在浏览器中打开该文件
2. 自动生成所需尺寸的PNG图标
3. 替换 `icons/` 目录中的文件

### 测试工具
- `test-extraction.html`: 测试内容提取功能
- `content-debug.js`: 调试内容脚本
- `gemini-debug.js`: Gemini专用调试

## 更新日志

### v1.0.0 (2024-01-20)
- 🎉 首次发布
- ✅ 支持ChatGPT、Claude、Gemini、Poe四大平台
- ✅ Markdown和HTML双格式导出
- ✅ GitHub直接上传功能
- ✅ 智能文件命名系统
- ✅ 完整的用户界面
- ✅ 安全的Token管理

## 路线图

### 即将推出
- 🔄 更多AI平台支持 (Bing Chat, Bard等)
- 📊 导出统计和历史记录
- 🎨 自定义HTML模板
- 🔍 对话内容搜索功能
- 📱 移动端适配

### 长期计划
- 🌐 多语言界面支持
- 🔗 其他云存储集成 (Dropbox, OneDrive)
- 🤖 AI对话分析和摘要
- 📈 使用数据可视化

## 贡献指南

欢迎提交Issue和Pull Request！

### 贡献方式
1. Fork本仓库
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 开发规范
- 遵循现有代码风格
- 添加必要的注释
- 测试新功能
- 更新相关文档

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- GitHub Issues: [提交问题](https://github.com/alonegg/ai-chat-exporter-extension/issues)
- Email: [联系邮箱]

---

⭐ 如果这个项目对你有帮助，请给个Star支持一下！