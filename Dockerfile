FROM node:20-alpine

WORKDIR /app

# Copy backend package files
COPY package.json ./

# Install dependencies (includes pg which is already in package.json)
RUN npm ci --only=production

# Copy compiled backend
COPY backend/dist ./backend/dist

EXPOSE 3000

CMD ["node", "backend/dist/server/index.js"]
