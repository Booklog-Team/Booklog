# ── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드 실행
COPY . .
RUN npm run build

# ── Serve stage ───────────────────────────────────────────────────────────────
# Nginx 대신 Node.js 이미지를 사용하여 server.js를 실행합니다.
FROM node:20-alpine

WORKDIR /app

# 프로덕션 의존성 설치 (Express 및 미들웨어 포함)
COPY package*.json ./
RUN npm ci --only=production

# 빌드 결과물 및 서버 파일 복사
COPY --from=builder /app/dist/public ./dist/public
COPY server.js ./

# 80번 포트 개방
EXPOSE 80

# 서버 실행
CMD ["node", "server.js"]