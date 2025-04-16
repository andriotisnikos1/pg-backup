import { env } from "./central.config"
import clild_process from "child_process"
import colors from "@colors/colors"
import * as Sentry from "@sentry/node"

function getChildProcessConfig(backupPath:string) {
    if (env.backups.use_dumpall) {
        const pg_password = env.postgres.url.split(':')[2].split('@')[0]
        const rest_of_url = env.postgres.url.split(`:${pg_password}`).join('')
        return {
            base_command: `export PGPASSWORD=${pg_password}; pg_dumpall`,
            use_shell: true,
            backup_util: "pg_dumpall",
            args: [
                "-f",
                backupPath,
                "-d",
                rest_of_url
            ]
        }
    }
    return {
        base_command: "pg_dump",
        use_shell: false,
        backup_util: "pg_dump",
        args: [
            "-F", // custom format
            "c",
            "-f",
            backupPath,
            env.postgres.url
        ]
    }
}

async function attemptBackup(backupPath: string) {
    try {
        return await new Promise<boolean>((resolve, reject) => {
            const { base_command, use_shell, args, backup_util } = getChildProcessConfig(backupPath)
            const dump = clild_process.spawn(base_command, args, {
                shell: use_shell
            })
            dump.on("message", (msg) => {
                console.log(colors.cyan("info:"), msg)
            })
            dump.on("exit", (code) => {
                console.log(colors.green("backup:"), `${backup_util} finished. Uploading to S3...`)
                resolve(code === 0)
            })
            dump.on("error", (err) => {
                console.error(colors.red("stderr:"), err)
                reject(false)
            })
            dump.stderr.on("data", (data) => console.error(colors.red("error:"), data.toString()))
        })
    } catch (error) {
        console.error(colors.red("error:"), error)
        return false
    }

}

export default async function backup(fullpath: string) {
    try {
        const backupStatus = await attemptBackup(fullpath);
        if (backupStatus) return true
        console.error(colors.red("error:"), "Backup failed. Exiting...");
        return false
    } catch (error) {
        console.error(colors.red("error:"), error)
        return false
    }
}