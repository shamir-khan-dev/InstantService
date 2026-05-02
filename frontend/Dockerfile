# Use the official Node alpine image
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Copy the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the frontend port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start"]
