FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
# --- THIS IS THE FIX ---
RUN npm install
# ---
COPY . .
EXPOSE 5000
CMD ["node", "src/server.js"]