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

# Expose port for backend (we only need one port now)
EXPOSE 3001

# Create a script to run the server
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo 'cd /app && node server.js' >> /app/start.sh && \
    chmod +x /app/start.sh

# Set the start command with full path
CMD ["/bin/sh", "/app/start.sh"]
