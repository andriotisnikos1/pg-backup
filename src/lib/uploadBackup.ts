import colors from "@colors/colors"
import { s3 } from "../s3"
import { CompleteMultipartUploadCommand, CreateMultipartUploadCommand, UploadPartCommand } from "@aws-sdk/client-s3"
import { env } from "../central.config.js"
import fs from "fs"
import { Upload } from "@aws-sdk/lib-storage"

export default async function uploadBackup(fullpath: string, filename: string) {
    try {
        // create the multipart
        await new Upload({
            client: s3,
            params: {
                Bucket: env.s3.bucketName,
                Key: filename,
                Body: fs.createReadStream(fullpath),
            },
            queueSize: 4, // concurrency
            partSize: 1024 * 1024 * 5, // Set part size to 5 MB
        }).done()
        console.log(colors.green("backup:"), "Backup uploaded to S3. Keeping latest", env.backups.max_backups, "backups....")
        return true
    } catch (error) {
        console.error(colors.red("error:"), error)
        return false
    }
}