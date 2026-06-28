#!/bin/bash

echo "=========================================="
echo "  FanPick 接口测试"
echo "=========================================="
echo ""

BASE_URL="http://localhost:3000/api"

# 测试健康检查
echo "[1] 健康检查..."
curl -s "$BASE_URL/health" | head -c 200
echo ""
echo ""

# 测试登录（需要真实 code 才能成功）
echo "[2] 登录接口（测试参数校验）..."
curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{}' | head -c 200
echo ""
echo ""

# 测试产品列表
echo "[3] 产品列表..."
curl -s "$BASE_URL/products?page=1&size=5" | head -c 200
echo ""
echo ""

# 测试排行榜
echo "[4] 排行榜..."
curl -s "$BASE_URL/wants/rank?page=1&size=5" | head -c 200
echo ""
echo ""

echo "=========================================="
echo "  测试完成"
echo "=========================================="
echo ""
echo "如果看到返回 JSON 数据，说明服务运行正常。"
echo "如果返回错误，请检查："
echo "  1. 后端服务是否启动 (npm run dev)"
echo "  2. 数据库是否初始化 (mysql -u root -p < schema.sql)"
echo "  3. .env 配置是否正确"
echo ""
