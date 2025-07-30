FROM node:18-alpine

WORKDIR /app

# Install nodemon globally
RUN npm install -g nodemon

# Copy only package.json to cache install layer
COPY package.json ./

# Install dependencies
RUN npm install

# Copy everything else (optional if using volume mount in dev)
COPY . .

EXPOSE 5000

# Start using nodemon
CMD ["nodemon", "src/index.js"]
