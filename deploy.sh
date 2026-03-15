#!/bin/bash

# 水印去除工具部署脚本
# 作者: wangsmart0421
# 版本: 1.0.0

set -e  # 遇到错误时退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查命令是否存在
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "$1 未安装，请先安装"
        exit 1
    fi
}

# 显示帮助
show_help() {
    echo "水印去除工具部署脚本"
    echo ""
    echo "用法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help      显示帮助信息"
    echo "  -f, --frontend  仅部署前端"
    echo "  -w, --worker    仅部署Worker"
    echo "  -a, --all       部署全部（默认）"
    echo "  -d, --dev       开发环境部署"
    echo "  -p, --prod      生产环境部署"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh --all --prod   部署全部到生产环境"
    echo "  ./deploy.sh --frontend     仅部署前端"
    echo "  ./deploy.sh --dev          部署到开发环境"
}

# 部署前端
deploy_frontend() {
    log_info "开始部署前端..."
    
    cd frontend
    
    # 检查是否在Cloudflare Pages项目目录
    if [ ! -f "wrangler.toml" ] && [ ! -f ".pages" ]; then
        log_warning "未找到Cloudflare Pages配置文件，创建中..."
        
        # 创建简单的Pages配置
        cat > wrangler.toml << EOF
name = "watermark-remover-frontend"
pages_build_output_dir = "."
compatibility_date = "2024-01-01"

[[routes]]
pattern = "/*"
EOF
    fi
    
    # 部署到Cloudflare Pages
    log_info "部署到Cloudflare Pages..."
    if [ "$ENVIRONMENT" = "production" ]; then
        wrangler pages deploy . --project-name watermark-remover --branch main
    else
        wrangler pages deploy . --project-name watermark-remover-dev --branch dev
    fi
    
    if [ $? -eq 0 ]; then
        log_success "前端部署成功"
    else
        log_error "前端部署失败"
        exit 1
    fi
    
    cd ..
}

# 部署Worker
deploy_worker() {
    log_info "开始部署Worker..."
    
    cd worker
    
    # 检查环境变量
    if [ -z "$REPLICATE_API_TOKEN" ] && [ "$ENVIRONMENT" = "production" ]; then
        log_error "生产环境需要设置 REPLICATE_API_TOKEN 环境变量"
        log_info "请运行: export REPLICATE_API_TOKEN=your_token"
        exit 1
    fi
    
    # 设置环境变量
    if [ "$ENVIRONMENT" = "production" ]; then
        log_info "设置生产环境变量..."
        wrangler secret put REPLICATE_API_TOKEN <<< "$REPLICATE_API_TOKEN"
    fi
    
    # 部署Worker
    log_info "部署Cloudflare Worker..."
    wrangler deploy
    
    if [ $? -eq 0 ]; then
        log_success "Worker部署成功"
    else
        log_error "Worker部署失败"
        exit 1
    fi
    
    cd ..
}

# 部署全部
deploy_all() {
    log_info "开始部署全部组件..."
    
    # 检查必要命令
    check_command git
    check_command wrangler
    check_command npm
    
    # 检查是否在Git仓库中
    if [ ! -d ".git" ]; then
        log_warning "当前目录不是Git仓库，初始化中..."
        git init
        git add .
        git commit -m "Initial commit: Watermark Remover"
    fi
    
    # 安装依赖
    log_info "安装依赖..."
    cd worker
    npm install
    cd ..
    
    # 部署前端
    if [ "$DEPLOY_FRONTEND" = true ]; then
        deploy_frontend
    fi
    
    # 部署Worker
    if [ "$DEPLOY_WORKER" = true ]; then
        deploy_worker
    fi
    
    log_success "部署完成！"
    
    # 显示部署信息
    echo ""
    echo "==================== 部署信息 ===================="
    if [ "$DEPLOY_FRONTEND" = true ]; then
        echo "前端: https://watermark-remover.pages.dev"
    fi
    if [ "$DEPLOY_WORKER" = true ]; then
        echo "Worker API: https://watermark-remover.your-domain.workers.dev"
        echo "API端点: POST /api/remove"
        echo "健康检查: GET /api/health"
    fi
    echo "=================================================="
    echo ""
    echo "下一步:"
    echo "1. 配置自定义域名（可选）"
    echo "2. 设置Replicate API Token"
    echo "3. 测试API接口"
    echo "4. 更新前端中的API端点URL"
}

# 默认值
DEPLOY_FRONTEND=true
DEPLOY_WORKER=true
ENVIRONMENT="development"

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--help)
            show_help
            exit 0
            ;;
        -f|--frontend)
            DEPLOY_WORKER=false
            shift
            ;;
        -w|--worker)
            DEPLOY_FRONTEND=false
            shift
            ;;
        -a|--all)
            DEPLOY_FRONTEND=true
            DEPLOY_WORKER=true
            shift
            ;;
        -d|--dev)
            ENVIRONMENT="development"
            shift
            ;;
        -p|--prod)
            ENVIRONMENT="production"
            shift
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 显示部署计划
echo ""
echo "==================== 部署计划 ===================="
echo "环境: $ENVIRONMENT"
echo "部署前端: $DEPLOY_FRONTEND"
echo "部署Worker: $DEPLOY_WORKER"
echo "=================================================="
echo ""

# 确认部署
read -p "是否继续部署？(y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    log_info "部署已取消"
    exit 0
fi

# 执行部署
deploy_all