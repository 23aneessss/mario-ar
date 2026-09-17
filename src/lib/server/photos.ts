import { createHash, createHmac, randomBytes } from 'node:crypto';
import { db } from './db';
import { deleteImage, headImage, putImage } from './storage';
import { publicBaseUrl, retentionDays } from './config';
import { HttpError, tokenPattern } from './validation';
export type PhotoRow={token:string;object_key:string;expires_at:Date;created_at:Date;content_hash:string;state:string};
export async function rateLimit(request:Request){
  // Only enable this behind a proxy that overwrites X-Forwarded-For; otherwise use a shared bucket.
  const ip=process.env.TRUST_PROXY==='true'?(request.headers.get('x-forwarded-for')?.split(',').at(-1)?.trim()||'unknown'):'untrusted';
  const key=createHmac('sha256',process.env.RATE_LIMIT_SECRET!).update(ip).digest('hex');
  const window=new Date(Math.floor(Date.now()/600000)*600000);
  const result=await db().query<{count:number}>('INSERT INTO upload_limits (key,window_start,count) VALUES ($1,$2,1) ON CONFLICT (key,window_start) DO UPDATE SET count=upload_limits.count+1 RETURNING count',[key,window]);
  if(result.rows[0].count>30)throw new HttpError(429,'Trop d’envois. Réessayez dans 10 minutes.');
}
export async function findPhoto(token:string,includePending=false):Promise<PhotoRow>{
  if(!tokenPattern.test(token))throw new HttpError(404,'Ce lien photo n’existe pas.');
  const result=await db().query<PhotoRow>('SELECT * FROM photos WHERE token=$1',[token]);
  const photo=result.rows[0];if(!photo)throw new HttpError(404,'Ce lien photo n’existe pas.');
  if(photo.expires_at.getTime()<=Date.now())throw new HttpError(410,'Cette photo a expiré et n’est plus disponible.');
  if(!includePending&&photo.state!=='ready')throw new HttpError(404,'Cette photo n’est pas encore disponible.');
  return photo;
}
export async function savePhoto(body:Buffer,idempotency:string){
  const key=createHash('sha256').update(idempotency).digest('hex'),hash=createHash('sha256').update(body).digest('hex');
  const conn=await db().connect();let committed=false;
  try {
    await conn.query('BEGIN');
    await conn.query('SELECT pg_advisory_xact_lock(hashtextextended($1,0))',[key]);
    let photo=(await conn.query<PhotoRow>('SELECT * FROM photos WHERE idempotency_hash=$1',[key])).rows[0];
    if(photo){if(photo.content_hash!==hash)throw new HttpError(409,'Cette capture a déjà été envoyée avec un contenu différent.');if(photo.expires_at.getTime()<=Date.now())throw new HttpError(410,'Cette capture a expiré. Prenez une nouvelle photo.');}
    else {
      const token=randomBytes(32).toString('base64url'),expires=new Date(Date.now()+retentionDays()*86400000);
      photo=(await conn.query<PhotoRow>('INSERT INTO photos (token,idempotency_hash,object_key,content_hash,expires_at,state) VALUES ($1,$2,$3,$4,$5,\'pending\') RETURNING *',[token,key,`photos/${token}.jpg`,hash,expires])).rows[0];
    }
    // Persist a pending row before S3: failed uploads and crashes remain tracked for cleanup.
    await conn.query('COMMIT');committed=true;
    await putImage(photo.object_key,body);
    await headImage(photo.object_key);
    await db().query("UPDATE photos SET state='ready' WHERE token=$1",[photo.token]);
    return photo;
  }catch(error){if(!committed)await conn.query('ROLLBACK');throw error;}finally{conn.release();}
}
export async function verifyPublicPhoto(token:string){
  const base=publicBaseUrl();if(!base)throw new HttpError(503,'Le partage nécessite une adresse HTTPS publique.');
  try{
    const result=await fetch(`${base}/api/photos/${token}/image`,{method:'HEAD',redirect:'error',cache:'no-store',signal:AbortSignal.timeout(8000)});
    if(!result.ok||result.headers.get('x-photo-token')!==token)throw new Error();
  }catch{throw new HttpError(503,'La photo est enregistrée, mais son adresse publique n’est pas accessible. Réessayez lorsque le serveur HTTPS sera disponible.');}
  return `${base}/p/${token}`;
}
export async function cleanupExpired(){
  const conn=await db().connect();let deleted=0;
  try{
    await conn.query('BEGIN');
    const {rows}=await conn.query<PhotoRow>("SELECT * FROM photos WHERE expires_at<=now() OR (state='pending' AND created_at<now()-interval '1 day') ORDER BY expires_at LIMIT 500 FOR UPDATE SKIP LOCKED");
    for(const photo of rows){await deleteImage(photo.object_key);await conn.query('DELETE FROM photos WHERE token=$1',[photo.token]);deleted++;}
    await conn.query("DELETE FROM upload_limits WHERE window_start<now()-interval '1 day'");await conn.query('COMMIT');return deleted;
  }catch(error){await conn.query('ROLLBACK');throw error;}finally{conn.release();}
}
