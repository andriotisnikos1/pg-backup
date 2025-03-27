import crypto from 'crypto';
import os from 'os';
import "./central.config.js";
import cron from 'node-cron';
import { env } from './central.config.js';
import { s3 } from './s3.js';
import fsp from 'fs/promises';
import { DeleteObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import backup from './backup.js';
import colors from '@colors/colors';
import * as Sentry from '@sentry/node';

if (env.sentry.enabled === 'true') {
    if (!env.sentry.dsn) {
        console.error(colors.red("error:"), "Sentry DSN not provided. Required when sentry is enabled. Exiting...");
        process.exit(1);
    }
    Sentry.init({ dsn: env.sentry.dsn });
    if (!env.sentry.monitor_slug) {
        console.error(colors.red("error:"), "Sentry monitor slug not provided. Required when sentry is enabled. Exiting...");
        process.exit(1);
    }
}



cron.schedule(env.backups.cron_schedule, async () => {
    if (env.sentry.enabled === 'true') {
        Sentry.captureCheckIn({
            monitorSlug: env.sentry.monitor_slug!,
            status: "in_progress"
        })
    }
    try {
        const tmpdir = os.tmpdir();
        const ID = crypto.randomBytes(16).toString('hex');
        const date = new Date().toISOString().split('T')[0];
        const filename = `${date}-${ID}${env.backups.file_identifier ? `.${env.backups.file_identifier}` : ""}.dump`;
        const fullpath = `${tmpdir}/${filename}`;
        // notify start
        console.log(colors.green("backup:"), "Starting backup...");
        // get backup
        const backupStatus = await backup(fullpath, filename);
        if (!backupStatus) {
            console.error(colors.red("error:"), "Backup failed. Exiting...");
            return
        }
        // upload backup
        const dumpContents = await fsp.readFile(fullpath);
        await s3.send(new PutObjectCommand({
            Bucket: env.s3.bucketName,
            Key: filename,
            Body: dumpContents,
            ContentType: 'application/octet-stream'
        }))
        console.log(colors.green("backup:"), "Backup uploaded to S3. Keeping latest", env.backups.max_backups, "backups....")
        // list objects
        const list = await s3.send(new ListObjectsV2Command({
            Bucket: env.s3.bucketName
        }))
        // delete old backups
        const sortedTmstpDesc = list.Contents!.filter(b => b.Key!.includes(`${env.backups.file_identifier ? `.${env.backups.file_identifier}` : ""}.dump`)).sort((a, b) => {
            return (a.LastModified!.getTime() > b.LastModified!.getTime()) ? -1 : 1
        })
        const toDelete = sortedTmstpDesc.slice(env.backups.max_backups)
        for (const object of toDelete) {
            await s3.send(new DeleteObjectCommand({
                Bucket: env.s3.bucketName,
                Key: object.Key!
            }))
            console.log(colors.green("backup:"), "Deleted old backup", object.Key)
        }
        // notify
        console.log(colors.green("backup:"), "Backup completed successfully.")
        console.log(colors.cyan("-".repeat(15)))
        if (env.sentry.enabled === 'true') {
            Sentry.captureCheckIn({
                monitorSlug: env.sentry.monitor_slug!,
                status: "ok"
            })
        }
    } catch (error) {
        console.error(colors.red("error:"), error)
        if (env.sentry.enabled === 'true') {
            Sentry.captureCheckIn({
                monitorSlug: env.sentry.monitor_slug!,
                status: "error",
            })
        }
    }
})