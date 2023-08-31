# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=16.9.0
FROM node:${NODE_VERSION}-alpine as base

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production


# Throw-away build stage to reduce size of final image
FROM base as build

# To install node canvas
RUN apk add build-base \
        g++ \
        cairo-dev \
        jpeg-dev \
        pango-dev \
        freetype-dev \
        giflib-dev \
        make \
        python3

# Install node modules
COPY package-lock.json package.json ./
RUN npm ci --include=dev

# # Copy application code
COPY . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --production


# Final stage for app image
FROM base

# node canvas requires these in runtime
RUN apk add cairo \
    jpeg \
    pango \
    giflib

# Copy built application
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/lib /app/lib
COPY --from=build /app/package.json /app/package.json

# Setup sqlite3 on a separate volume
RUN mkdir -p /data
VOLUME /data
ENV DATABASE_URL="file:///data/sqlite.db"

ENV NODE_PATH=lib/

EXPOSE 5000
CMD [ "npm", "run", "start" ]
