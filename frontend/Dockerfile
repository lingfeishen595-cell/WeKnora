# 构建阶段
FROM node:24-alpine AS build-stage

WORKDIR /app

# 设置环境变量，忽略类型检查错误
ARG VITE_GOOCAN_LOGIN_ENABLED=false
ARG VITE_GOOCAN_GATEWAY_URL=
ARG VITE_GOOCAN_PROJECT_ID=
ARG VITE_GOOCAN_DEFAULT_CORP_ID=
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV VITE_IS_DOCKER=true
ENV VITE_GOOCAN_LOGIN_ENABLED=${VITE_GOOCAN_LOGIN_ENABLED}
ENV VITE_GOOCAN_GATEWAY_URL=${VITE_GOOCAN_GATEWAY_URL}
ENV VITE_GOOCAN_PROJECT_ID=${VITE_GOOCAN_PROJECT_ID}
ENV VITE_GOOCAN_DEFAULT_CORP_ID=${VITE_GOOCAN_DEFAULT_CORP_ID}

# 复制依赖文件
COPY package*.json ./
COPY pnpm-workspace.yaml ./
COPY packages/xlsx-0.20.2.tgz ./packages/xlsx-0.20.2.tgz

# 安装依赖
RUN npm ci

# 复制项目文件
COPY . .

# 构建应用
RUN npm run build

# 生产阶段
FROM nginx:stable-alpine AS production-stage

# 复制构建产物到nginx服务目录
COPY --from=build-stage /app/dist /usr/share/nginx/html

# 复制nginx配置模板文件
COPY nginx.conf /etc/nginx/templates/default.conf.template

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# 设置默认环境变量（MB）
ENV MAX_FILE_SIZE_MB=50

# 暴露端口
EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"] 
