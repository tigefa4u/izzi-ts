# syntax = docker/dockerfile:1

# Adjust NODE_VERSION as desired
ARG NODE_VERSION=17.6.0
FROM node:${NODE_VERSION}-alpine as base

LABEL fly_launch_runtime="Node.js"

# Node.js app lives here
WORKDIR /app

# Set production environment
ENV NODE_ENV=production


# Throw-away build stage to reduce size of final image
FROM base as build

# To install node canvas
RUN apk add --no-cache \
        git \
        build-base \
        g++ \
        cairo-dev \
        jpeg-dev \
        pango-dev \
        freetype-dev \
        giflib-dev \
        make \
        python3

# Install node modules
COPY --link package-lock.json package.json ./
RUN npm ci --include=dev

# Copy application code
COPY --link . .

# Build application
RUN npm run build

# Remove development dependencies
RUN npm prune --omit=dev


# Final stage for app image
FROM base

# node canvas requires these in runtime
RUN apk add --no-cache \
    cairo \
    jpeg \
    pango \
    giflib

# Copy built application
COPY --from=build /app /app

# Setup sqlite3 on a separate volume
RUN mkdir -p /data
VOLUME /data
ENV DATABASE_URL="file:///data/sqlite.db"

ENV NODE_PATH=lib/
# Start the server by default, this can be overwritten at runtime
EXPOSE 3000
CMD [ "npm", "run", "start" ]
