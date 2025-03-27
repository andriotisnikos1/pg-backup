import { z } from 'zod'

const envSchema = z.object({
    NODE_ENV: z.enum(['development', 'production']).default('development'),
    s3: z.object({
        region: z.string(),
        endpoint: z.string().optional(),
        accessKeyId: z.string().min(5),
        secretAccessKey: z.string().min(5),
        bucketName: z.string().min(1),
    }),
    backups: z.object({
        cron_schedule: z.string().min(5),
        max_backups: z.number().optional().default(5),
        file_identifier: z.string().optional()
    }),
    postgres: z.object({
        url: z.string().min(15),
    }),
    sentry: z.object({
        enabled: z.enum(['true', 'false']).default('false'),
        dsn: z.string().optional(),
        monitor_slug: z.string().optional()
    })
})

export const env = await envSchema.parseAsync({
    NODE_ENV: process.env.NODE_ENV,
    s3: {
        region: process.env.S3_REGION!,
        endpoint: process.env.S3_ENDPOINT,
        accessKeyId: process.env.S3_AUTH_KEY_ID!,
        secretAccessKey: process.env.S3_AUTH_SECRET!,
        bucketName: process.env.S3_BUCKET!,
    },
    backups: {
        cron_schedule: process.env.BACKUPS_CRON_SCHEDULE!,
        max_backups: process.env.BACKUPS_MAX_KEEP_COUNT ? parseInt(process.env.BACKUPS_MAX_KEEP_COUNT) : 5,
        file_identifier: process.env.BACKUPS_FILE_IDENTIFIER
    },
    postgres: {
        url: process.env.POSTGRES_URL!,
    },
    sentry: {
        enabled: process.env.SENTRY_ENABLED || 'false',
        dsn: process.env.SENTRY_DSN,
        monitor_slug: process.env.SENTRY_MONITOR_SLUG
    }
})