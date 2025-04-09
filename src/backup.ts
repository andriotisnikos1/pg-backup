import { env } from "./central.config"
import clild_process from "child_process"
import colors from "@colors/colors"
import * as Sentry from "@sentry/node"

async function attemptBackup(backupPath: string, filename: string) {
    try {
        return await new Promise<boolean>((resolve, reject) => {
            const dump = clild_process.spawn('pg_dump', [
                "-F", // custom format
                "c",
                `-f`,
                backupPath,
                env.postgres.url
            ])
            dump.on("message", (msg) => {
                console.log(colors.cyan("info:"), msg)
            })
            dump.on("exit", (code) => {
                console.log(colors.green("backup:"), "pg_dump finished. Uploading to S3...")
                resolve(code === 0)
            })
            dump.on("error", (err) => {
                console.error(colors.red("error:"), err)
                reject(false)
            })
            dump.stderr.on("data", (data) => console.error(colors.red("error:"), data.toString()))
        })
    } catch (error) {
        console.error(colors.red("error:"), error)
        return false
    }

}

export default async function backup(fullpath: string, filename: string) {
    try {
        const backupStatus = await attemptBackup(fullpath, filename);
        if (backupStatus) return true
        console.error(colors.red("error:"), "Backup failed. Exiting...");
        return false
    } catch (error) {
        console.error(colors.red("error:"), error)
        return false
    }
}