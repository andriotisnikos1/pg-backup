# pg-backup: A simple automated backup script for PostgreSQL databases using `pg_dump`.

## Requirements
- `S3` / `Backblaze B2` / `Cloudflare R2` Credentials
- A `PostgreSQL database connection URL`
- (Optional) A `Sentry DSN` and the `monitor slug` for cron job monitoring
- A configured `.env` file, explained below

## .env Configuration

Copy the `.env.preset` file to `.env` and fill in the required fields.

```dotenv
NODE_ENV=# "development" | "production" (optional: defaults to "production")

# S3 Configuration (required)
S3_REGION=
S3_ENDPOINT=
S3_AUTH_KEY_ID=
S3_AUTH_SECRET=
S3_BUCKET=

# Backups Configuration
BACKUPS_CRON_SCHEDULE= # "0 0 * * *" (required)
BACKUPS_MAX_KEEP_COUNT= # the number of latest backups to keep (defaults to 5)

# a unique identifier for the backup file. 
# the file format with identifier is
# {date}-{random 32 characters}.{identifier}.sql
# if not set, the file format is
# {date}-{random 32 characters}.sql
BACKUPS_FILE_IDENTIFIER= # optional

# Postgres Configuration
POSTGRES_URL= # required

# (Optional) Sentry Configuration
SENTRY_ENABLED=# "true" | "false"
SENTRY_DSN= # required if SENTRY_ENABLED=true
SENTRY_MONITOR_SLUG= # required if SENTRY_ENABLED=true
```

## Installation
You can install `pg-backup` using:
- docker
- run from source

### Docker

```bash
docker run -d \
    -v "/path/to/.env:/app/.env" \
    --name pg-backup \
    andriotisnikos1/pg-backup
```

### Run from source

`Note`: Run from source requires:
- [bun](https://bun.sh) to be installed
- `pg_dump`, the version matching your PostgreSQL version, to be installed

```bash
git clone https://github.com/andriotisnikos1/pg-backup

mv /path/to/.env pg-backup/.env

cd pg-backup

bun src/index.ts
```

# Using for versions other than PostgreSQL 16 with docker
If you are using a version of Postgres other than 16 (the default build), you can build the image yourself from source:

```bash
docker build -t pg-backup --build-arg POSTGRES_VERSION=my-postgres-version .
```