import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as uuid from 'uuid';

const AWSClient = new S3Client({
  region: 'ap-southeast-1',
  credentials: {
    accessKeyId: process.env.AWS_IAM_ID,
    secretAccessKey: process.env.AWS_IAM_SECRET_KEY,
  },
});

const CloudFlareClient = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUD_FLARE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.CLOUD_FLARE_ACCESS_KEY,
    secretAccessKey: process.env.CLOUD_FLARE_SECRET_KEY,
  },
});

export const uploadS3 = async (file, folderName = '') => {
  const fileName = uuid.v4();
  const fileKey = `assets/${folderName}/${fileName}.${file.mimetype.split('/')[1]}`;

  // Read file as buffer instead of stream for reliability in Lambda
  const fileContent = fs.readFileSync(file.path);

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: `${fileKey}`,
    Body: fileContent,
    ContentType: file.mimetype,
  });

  try {
    await AWSClient.send(command);

    // Clean up temp file after successful upload
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    return {
      key: fileKey,
      uri: `${process.env.AWS_CDN}/${fileKey}`
    };
  } catch (err) {
    // Clean up temp file even on error
    fs.unlink(file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
    });
    throw err;
  }
};

export const uploadCloudFlare = async (file, folderName = '') => {
  const fileName = uuid.v4();
  const fileKey = `${folderName}/${fileName}.${file.mimetype.split('/')[1]}`;

  // Read file as buffer instead of stream for reliability in Lambda
  const fileContent = fs.readFileSync(file.path);

  const command = new PutObjectCommand({
    Bucket: process.env.CLOUD_FLARE_BUCKET,
    Key: `${fileKey}`,
    Body: fileContent,
    ContentType: file.mimetype,
  });

  try {
    await CloudFlareClient.send(command);

    // Clean up temp file after successful upload
    fs.unlink(file.path, (err) => {
      if (err) console.error('Error deleting temp file:', err);
    });

    return fileKey;
  } catch (err) {
    // Clean up temp file even on error
    fs.unlink(file.path, (unlinkErr) => {
      if (unlinkErr) console.error('Error deleting temp file:', unlinkErr);
    });
    throw err;
  }
};
export const uploadBase64ToCloudFlare = async (base64String, folderName = '') => {
  const fileName = uuid.v4();
  const base64Data = base64String.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Data, 'base64');
  const fileType = base64String.substring(base64String.indexOf('/') + 1, base64String.indexOf(';'));

  const command = new PutObjectCommand({
    Bucket: process.env.CLOUD_FLARE_BUCKET,
    Key: `${folderName}/${fileName}.${fileType}`,
    Body: buffer,
    ContentType: `image/${fileType}`,
  });

  try {
    await CloudFlareClient.send(command);
    return `${folderName}/${fileName}.${fileType}`;
  } catch (err) {
    throw err;
  }
};
