# Use Node.js as the base image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the React application
RUN npm run build

# Expose ports for both frontend and backend
EXPOSE 3001
EXPOSE 5173

# Create a script to run both frontend and backend with proper line endings
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'npm run server & npm run dev' >> /app/start.sh && \
    chmod +x /app/start.sh

# Set the start command with full path
CMD ["/bin/sh", "/app/start.sh"]
