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

# Create a script to run both frontend and backend
RUN echo '#!/bin/sh\nnpm run server & npm run dev' > start.sh
RUN chmod +x start.sh

# Set the start command
CMD ["./start.sh"]
