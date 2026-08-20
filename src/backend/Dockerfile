FROM node:22-alpine
# Git is not strictly needed inside backend docker for mock tasks if we handle git CLI path fallback, but we'll try to install it using apk.
# If DNS/network fails inside docker build, we can use a fallback. Let's make it more robust.
RUN apk update && apk add --no-cache git || echo "Failed to install git inside Docker, using mock fallback"
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 4000
CMD ["npm", "run", "start"]
