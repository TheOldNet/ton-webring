# NODE_VERSION comes from .nvmrc via scripts/run-docker-compose.js / compose build args.
ARG NODE_VERSION
FROM node:${NODE_VERSION}-bookworm-slim
WORKDIR /app
ENV PYTHON=python3
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    libpixman-1-dev \
  && rm -rf /var/lib/apt/lists/*
RUN npm install -g yarn@1.22.22
COPY package.json ./
COPY yarn.lock* ./
RUN yarn
COPY . ./
