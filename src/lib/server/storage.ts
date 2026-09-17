import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { bucket } from './config';
let client:S3Client;
export function storage(){return client??=new S3Client({endpoint:process.env.S3_ENDPOINT,region:process.env.S3_REGION||'us-east-1',forcePathStyle:true,credentials:{accessKeyId:process.env.S3_ACCESS_KEY!,secretAccessKey:process.env.S3_SECRET_KEY!},maxAttempts:2,requestHandler:{connectionTimeout:4000,requestTimeout:12000}});}
export const putImage=(key:string,body:Buffer)=>storage().send(new PutObjectCommand({Bucket:bucket(),Key:key,Body:body,ContentType:'image/jpeg',CacheControl:'private, no-store'}));
export const headImage=(key:string)=>storage().send(new HeadObjectCommand({Bucket:bucket(),Key:key}));
export const getImage=(key:string)=>storage().send(new GetObjectCommand({Bucket:bucket(),Key:key}));
export const deleteImage=(key:string)=>storage().send(new DeleteObjectCommand({Bucket:bucket(),Key:key}));
