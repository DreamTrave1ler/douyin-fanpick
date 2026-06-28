FROM node:18-alpine

WORKDIR /app

# 复制服务端代码
COPY server/ ./server/

# 安装依赖
WORKDIR /app/server
RUN npm install --production

EXPOSE 3000

CMD ["node", "app.js"]
