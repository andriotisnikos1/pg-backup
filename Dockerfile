from ubuntu:22.04

# set prod
env NODE_ENV=production
env DEBIAN_FRONTEND=noninteractive

# install packages and bun
run apt-get update -y && \
    apt-get install -y curl unzip ca-certificates postgresql-client --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

run curl -fsSL https://bun.sh/install | bash

# add bun to path
env PATH="/root/.bun/bin:${PATH}"

# the usual
workdir /app

copy package.json .

run bun install

copy . .

cmd ["bun", "./src/index.ts"]