import { ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { env } from './central.config';


export const s3 = new S3Client({
    region: env.s3.region,
    ...(env.s3.endpoint ? {endpoint: env.s3.endpoint} : {}),
    credentials: {
      accessKeyId: env.s3.accessKeyId,
      secretAccessKey: env.s3.secretAccessKey,
    },
  });

