import colors from "@colors/colors"
import { s3 } from "../s3"
import { DeleteObjectCommand, ListObjectsV2Command, ListObjectVersionsCommand } from "@aws-sdk/client-s3"
import { env } from "../central.config.js"

export default async function deleteOldBackups() {
    try {
        // list objects
        const list = await s3.send(new ListObjectsV2Command({
            Bucket: env.s3.bucketName
        }))
        if (!list.Contents) {
            console.log(colors.red("error:"), "No backups found....")
            return false
        }
        // delete old backups
        const sortedTmstpDesc = list.Contents!.filter(b => b.Key!.includes(`${env.backups.file_identifier ? `.${env.backups.file_identifier}` : ""}.dump`)).sort((a, b) => {
            return (a.LastModified!.getTime() > b.LastModified!.getTime()) ? -1 : 1
        })
        const toDelete = sortedTmstpDesc.slice(env.backups.max_backups)
        
        const deletePromises = toDelete.map(async object => {
            try {
                const fileVersions = await s3.send(new ListObjectVersionsCommand({
                    Bucket: env.s3.bucketName,
                    Prefix: object.Key!
                }))
                for await (const version of fileVersions.Versions!) {
                    await s3.send(new DeleteObjectCommand({
                        Bucket: env.s3.bucketName,
                        Key: object.Key!,
                        VersionId: version.VersionId
                    }))
                }
                
            } catch (error) {
                await s3.send(new DeleteObjectCommand({
                    Bucket: env.s3.bucketName,
                    Key: object.Key!
                }))
            }

            
             
            console.log(colors.green("backup:"), "Deleted old backup", object.Key)
        })
        await Promise.all(deletePromises)
        return true
    } catch (error) {
        console.error(colors.red("error:"), error)
        return false
    }
}