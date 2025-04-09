import { env } from "../central.config.js";
import crypto from 'crypto';
import os from 'os';

export default function getConfig() {
    const tmpdir = os.tmpdir();
    const ID = crypto.randomBytes(16).toString('hex');
    const date = new Date().toISOString().split('T')[0];
    const filename = `${date}-${ID}${env.backups.file_identifier ? `.${env.backups.file_identifier}` : ""}.dump`;
    const fullpath = `${tmpdir}/${filename}`;
    return {
        tmpdir,
        ID,
        date,
        filename,
        fullpath,
    }
}