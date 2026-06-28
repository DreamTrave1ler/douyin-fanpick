#!/bin/bash

echo "=========================================="
echo "  FanPick - 抖音粉丝选品小程序启动脚本"
echo "=========================================="
echo ""

# 检查 Docker 是否可用
check_docker() {
    if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
        return 0
    fi
    return 1
}

# Docker 方式启动
start_docker() {
    echo "[1/2] 启动 Docker 容器..."
    docker-compose up -d --build
    echo ""
    echo "[2/2] 等待服务就绪..."
    sleep 5
    echo ""
    echo "✅ 启动成功！"
    echo ""
    echo "  后端服务: http://localhost:3000"
    echo "  数据库:   localhost:3306 (用户: root, 密码: fanpick123)"
    echo ""
    echo "  测试接口: curl http://localhost:3000/api/health"
    echo ""
}

# 本地方式启动
start_local() {
    echo "[1/3] 安装依赖..."
    cd server
    npm install
    cd ..
    echo ""

    echo "[2/3] 请确保 MySQL 已启动并执行初始化脚本:"
    echo "  mysql -u root -p < server/schema.sql"
    echo ""

    echo "[3/3] 启动后端服务..."
    cd server
    npm run dev &
    cd ..
    echo ""
    echo "✅ 后端服务启动中: http://localhost:3000"
    echo ""
}

# 主流程
echo "选择启动方式:"
echo ""
echo "  1) Docker 方式（推荐，自动安装 MySQL）"
echo "  2) 本地方式（需要已安装 MySQL）"
echo ""
read -p "请输入选项 [1]: " choice
choice=${choice:-1}

echo ""

case $choice in
    1)
        if check_docker; then
            start_docker
        else
            echo "❌ 未检测到 Docker，请先安装 Docker Desktop"
            echo "   下载地址: https://www.docker.com/products/docker-desktop/"
            echo ""
            echo "   或选择本地方式启动（选项 2）"
            exit 1
        fi
        ;;
    2)
        start_local
        ;;
    *)
        echo "无效选项"
        exit 1
        ;;
esac

echo "=========================================="
echo "  下一步：配置小程序前端"
echo "=========================================="
echo ""
echo "  1. 下载抖音开发者工具:"
echo "     https://developer.open-douyin.com/docs/resource/zh-CN/mini-app/develop/developer-instrument/download/"
echo ""
echo "  2. 导入 miniapp 目录"
echo ""
echo "  3. 在开发者工具中点击「编译」预览"
echo ""
