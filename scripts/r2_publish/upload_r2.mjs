import fs from 'node:fs';
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';

const [bucket, key, filePath, contentType = 'application/octet-stream'] = process.argv.slice(2);
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!bucket || !key || !filePath || !accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('Usage: upload_r2.mjs <bucket> <key> <file> [content-type] with R2 credentials configured');
}

const client = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
});

const upload = new Upload({
    client,
    params: {
        Bucket: bucket,
        Key: key,
        Body: fs.createReadStream(filePath),
        ContentType: contentType
    },
    partSize: 64 * 1024 * 1024,
    queueSize: 4,
    leavePartsOnError: false
});

upload.on('httpUploadProgress', progress => {
    if (progress.loaded && progress.total) {
        process.stdout.write(`\r${key}: ${((progress.loaded / progress.total) * 100).toFixed(1)}%`);
    }
});

await upload.done();
process.stdout.write(`\nUploaded ${key}\n`);

const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
console.log(`Verified ${key}: ${head.ContentLength} bytes`);
