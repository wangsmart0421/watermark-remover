# Watermark Remover

在线水印去除工具，基于Cloudflare Workers和AI技术实现。

## 功能特性

- 🖼️ **图片上传**：支持拖拽和点击上传
- 🎯 **精确选择**：矩形和画笔工具选择水印区域
- 🤖 **AI智能去除**：使用Replicate API的LaMa模型
- ⚡ **快速处理**：Cloudflare Workers无服务器架构
- 📱 **响应式设计**：支持桌面和移动端
- 🔒 **隐私保护**：不存储用户图片数据

## 技术架构

```
前端 (Cloudflare Pages)
├── HTML/CSS/JavaScript
├── Fabric.js (Canvas图形库)
└── Tailwind CSS (样式框架)

后端 (Cloudflare Workers)
├── REST API接口
├── Replicate API集成
└── 错误处理和日志

AI服务 (Replicate API)
└── LaMa图像修复模型
```

## 快速开始

### 本地开发

1. **克隆项目**
   ```bash
   git clone https://github.com/wangsmart0421/watermark-remover.git
   cd watermark-remover
   ```

2. **前端开发**
   ```bash
   cd frontend
   # 使用Live Server或直接打开index.html
   ```

3. **Worker开发**
   ```bash
   cd worker
   npm install
   npm run dev
   ```

### 部署到Cloudflare

1. **部署前端到Pages**
   ```bash
   cd frontend
   wrangler pages deploy --project-name watermark-remover
   ```

2. **部署Worker**
   ```bash
   cd worker
   wrangler deploy
   ```

3. **配置环境变量**
   - `REPLICATE_API_TOKEN`: Replicate API密钥
   - `ALLOWED_ORIGINS`: 允许的域名

## 项目结构

```
watermark-remover/
├── frontend/                 # 前端代码
│   ├── index.html           # 主页面
│   ├── app.js              # 主逻辑
│   ├── style.css           # 样式文件
│   ├── utils/              # 工具函数
│   └── assets/             # 静态资源
├── worker/                  # Cloudflare Worker
│   ├── src/
│   │   ├── worker.js       # Worker主文件
│   │   └── api/           # API路由
│   ├── package.json
│   └── wrangler.toml
├── docs/                   # 文档
├── scripts/               # 部署脚本
└── README.md             # 项目说明
```

## API文档

### 去除水印接口
```
POST /api/remove
Content-Type: application/json

请求体:
{
  "image": "base64编码的图片",
  "mask": "base64编码的mask"
}

响应:
{
  "success": true,
  "result": "base64编码的处理结果",
  "processingTime": 1234
}
```

## 配置要求

### 环境变量
```bash
# Cloudflare Worker环境变量
REPLICATE_API_TOKEN=your_replicate_token
ALLOWED_ORIGINS=https://your-domain.pages.dev

# 本地开发
VITE_REPLICATE_API_TOKEN=your_token
```

### 第三方服务
1. **Replicate API**：注册获取API密钥
2. **Cloudflare账号**：部署Worker和Pages
3. **GitHub账号**：代码托管（可选）

## 开发计划

### MVP版本 (v1.0)
- [x] 基础图片上传和预览
- [x] 矩形和画笔选择工具
- [x] Replicate API集成
- [x] 结果下载功能
- [x] 响应式界面

### 版本1.1
- [ ] 更多选择工具（套索、魔棒）
- [ ] 批量处理功能
- [ ] 处理历史记录
- [ ] 性能优化

### 版本1.2
- [ ] 多种AI模型选择
- [ ] 图片预处理功能
- [ ] API接口文档
- [ ] 错误监控

## 贡献指南

1. Fork本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

## 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 联系

- GitHub: [@wangsmart0421](https://github.com/wangsmart0421)
- 项目地址: https://github.com/wangsmart0421/watermark-remover

## 致谢

- [Replicate](https://replicate.com/) - AI模型API服务
- [Cloudflare](https://cloudflare.com/) - Workers和Pages服务
- [Fabric.js](http://fabricjs.com/) - Canvas图形库
- [LaMa](https://github.com/advimman/lama) - 图像修复模型