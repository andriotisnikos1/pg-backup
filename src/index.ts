import colors from '@colors/colors';
import * as Sentry from '@sentry/node';
import cron from 'node-cron';
import backup from './backup.js';
import "./central.config.js";
import { env } from './central.config.js';
import deleteOldBackups from './lib/deleteOldBackups.js';
import getConfig from "./lib/getConfig.js";
import uploadBackup from './lib/uploadBackup.js';

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
        const {fullpath, filename} = getConfig()
        // notify start
        console.log(colors.green("backup:"), "Starting backup...");
        // get backup
        const backupStatus = await backup(fullpath);
        if (!backupStatus) throw new Error("Backup failed");
        // upload backup
        const uploadStatus = await uploadBackup(fullpath, filename);
        if (!uploadStatus) throw new Error("Upload of backup failed");
        // delete old backups
        const cleanupStatus = await deleteOldBackups();
        if (!cleanupStatus) throw new Error("Cleanup of old backups failed");
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