# Use lightweight official Node image
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package management files
COPY package*.json ./

# Install dependencies (production-only)
RUN npm ci --omit=dev

# Copy remaining source code files
COPY . .

# Create directory for profile uploads
RUN mkdir -p uploads

# Expose port
EXPOSE 5000

# Set environment variables default (can be overridden in compose)
ENV PORT=5000
ENV NODE_ENV=production
ENV CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000
ENV SMTP_HOST=
ENV SMTP_PORT=587
ENV SMTP_SECURE=false
ENV SMTP_USER=
ENV SMTP_PASS=
ENV FROM_EMAIL=
ENV TWILIO_ACCOUNT_SID=
ENV TWILIO_AUTH_TOKEN=
ENV TWILIO_PHONE_NUMBER=

# Start Express server
CMD ["node", "server.js"]
