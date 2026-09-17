import test,{after} from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import { savePhoto,findPhoto,cleanupExpired,verifyPublicPhoto } from '../src/lib/server/photos';
import { getImage,deleteImage } from '../src/lib/server/storage';
import {db,closeDb} from '../src/lib/server/db';
import {HttpError} from '../src/lib/server/validation';
import {POST} from '../src/app/api/photos/route';
import {GET as imageGET} from '../src/app/api/photos/[token]/image/route';
const tokens:string[]=[];
after(async()=>{for(const token of tokens){await deleteImage(`photos/${token}.jpg`);await db().query('DELETE FROM photos WHERE token=$1',[token]);}await closeDb();});
test('real PostgreSQL and SeaweedFS: concurrent retries create one private photo',async()=>{
  const bytes=await sharp({create:{width:400,height:800,channels:3,background:'#ee4455'}}).jpeg().toBuffer(),key=randomUUID();
  const results=await Promise.all([savePhoto(bytes,key),savePhoto(bytes,key),savePhoto(bytes,key)]);
  const token=results[0].token;tokens.push(token);assert.ok(results.every(p=>p.token===token));assert.equal(token.length,43);
  const stored=await findPhoto(token);assert.equal(stored.state,'ready');assert.ok(stored.expires_at.getTime()>Date.now()+6.9*86400000);
  const image=await getImage(stored.object_key);assert.deepEqual(Buffer.from(await image.Body!.transformToByteArray()),bytes);
  const response=await fetch(`${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET}/${stored.object_key}`);assert.equal(response.status,403);
  const route=await imageGET(new Request(`http://localhost/api/photos/${token}/image?download=1`),{params:Promise.resolve({token})});assert.equal(route.status,200);assert.equal(route.headers.get('content-type'),'image/jpeg');assert.match(route.headers.get('content-disposition')!,/attachment/);assert.match(route.headers.get('cache-control')!,/no-store/);assert.deepEqual(Buffer.from(await route.arrayBuffer()),bytes);
  await assert.rejects(savePhoto(Buffer.from('different'),key),(e:unknown)=>e instanceof HttpError&&e.status===409);
});
test('expired links are denied before cleanup, then object and metadata are removed',async()=>{
  const bytes=await sharp({create:{width:20,height:20,channels:3,background:'#abcdef'}}).jpeg().toBuffer(),photo=await savePhoto(bytes,randomUUID());tokens.push(photo.token);
  await db().query("UPDATE photos SET expires_at=now()-interval '1 second' WHERE token=$1",[photo.token]);
  await assert.rejects(findPhoto(photo.token),(e:unknown)=>e instanceof HttpError&&e.status===410);
  assert.ok(await cleanupExpired()>=1);await assert.rejects(findPhoto(photo.token),(e:unknown)=>e instanceof HttpError&&e.status===404);
  await assert.rejects(getImage(photo.object_key));
});
test('public HTTPS verification failure prevents issuing a share URL',async()=>{
  const before=process.env.PUBLIC_BASE_URL;process.env.PUBLIC_BASE_URL='https://camera.example.com';
  const originalFetch=globalThis.fetch;globalThis.fetch=async()=>{throw new Error('simulated public network outage');};
  try{await assert.rejects(verifyPublicPhoto('a'.repeat(43)),(e:unknown)=>e instanceof HttpError&&e.status===503);}finally{globalThis.fetch=originalFetch;process.env.PUBLIC_BASE_URL=before;}
});
test('upload route: real storage, simulated public probe, retries return same URL',async()=>{
  const before=process.env.PUBLIC_BASE_URL;process.env.PUBLIC_BASE_URL='https://camera.example.com';
  const originalFetch=globalThis.fetch;
  // Only the public HEAD probe is simulated: the DB, upload, object and API routes are real.
  globalThis.fetch=async(input,init)=>{const url=String(input);if(url.startsWith('https://camera.example.com/api/photos/')){const token=url.split('/')[5];await findPhoto(token);return new Response(null,{status:200,headers:{'x-photo-token':token}});}return originalFetch(input,init);};
  try{
    const bytes=await sharp({create:{width:30,height:60,channels:3,background:'#223344'}}).jpeg().toBuffer(),key=randomUUID();
    const send=()=>POST(new Request('https://camera.example.com/api/photos',{method:'POST',body:bytes,headers:{origin:'https://camera.example.com','content-type':'image/jpeg','x-idempotency-key':key}}));
    const first=await send(),data=await first.json();assert.equal(first.status,201,JSON.stringify(data));tokens.push(data.token);assert.equal(data.url,`https://camera.example.com/p/${data.token}`);
    const retry=await send();assert.deepEqual(await retry.json(),data);
  }finally{globalThis.fetch=originalFetch;process.env.PUBLIC_BASE_URL=before;}
});
