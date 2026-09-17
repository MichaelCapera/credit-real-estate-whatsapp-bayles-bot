# ============================================
# DOCKERFILE - WhatsApp Bot
# ============================================

FROM node:20-alpine

# Install dependencies for Baileys (puppeteer dependencies)
RUN apk add --no-cache \
    chromium \
    git \
    python3 \
    make \
    g++ \
    && rm -rf /var/cache/apk/*

# Set environment variable for Puppeteer
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create app directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./

# Install Node.js dependencies
RUN npm install --only=production

# Copy application code
COPY index.js .
COPY src ./src

# Create necessary folders
RUN mkdir -p auth_info_baileys logs

# Expose port (optional, for health checks)
EXPOSE 3000

# Start the bot
CMD ["node", "index.js"]