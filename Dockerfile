from ubuntu:22.04

# set prod
arg POSTGRES_VERSION=16
env NODE_ENV=production
env DEBIAN_FRONTEND=noninteractive

# install packages and bun
run apt-get update -y && \
    apt-get install -y curl unzip ca-certificates --no-install-recommends && \
    rm -rf /var/lib/apt/lists/*

run apt update && \
    apt install -y wget gnupg2 lsb-release && \
    echo "deb http://apt.postgresql.org/pub/repos/apt/ $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor > /etc/apt/trusted.gpg.d/pgdg.gpg && \
    apt update && \
    apt install -y postgresql-${POSTGRES_VERSION}

run curl -fsSL https://bun.sh/install | bash

# add bun to path
env PATH="/root/.bun/bin:${PATH}"

# the usual
workdir /app

copy package.json .

run bun install

copy . .

cmd ["bun", "./src/index.ts"]