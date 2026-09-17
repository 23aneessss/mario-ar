import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import sharp from 'sharp';
import { publicBaseUrl, retentionDays } from '../src/lib/server/config';
import { ensureOrigin, HttpError, idempotencyKey, readLimitedBody, sanitizeJpeg } from '../src/lib/server/validation';
test('share URLs reject local, private, non-HTTPS and credential-bearing origins',()=>{
  for(const url of ['http://camera.example.com','https://localhost','https://192.168.1.5','https://[::1]','https://cam.local','https://user:pass@camera.example.com','https://camera.example.com/path','blob:https://camera.example.com/abc'])assert.equal(publicBaseUrl(url),null,url);
  assert.equal(publicBaseUrl('https://camera.example.com/'),'https://camera.example.com');
});
test('retention uses bounded days and safe default',()=>{assert.equal(retentionDays('14'),14);assert.equal(retentionDays('0'),7);assert.equal(retentionDays('garbage'),7);assert.equal(retentionDays('31'),7);});
test('origin and retry key validation',()=>{assert.equal(idempotencyKey(randomUUID()).length,36);assert.throws(()=>idempotencyKey('../../hi'));assert.throws(()=>ensureOrigin(new Request('https://app.example.com/api/photos',{headers:{origin:'https://evil.example.com'}}),'https://app.example.com'));ensureOrigin(new Request('https://app.example.com/api/photos',{headers:{origin:'https://app.example.com'}}),'https://app.example.com');});
test('upload validates actual bytes, not just MIME',async()=>{await assert.rejects(sanitizeJpeg(Buffer.from('<script>hi</script>')),HttpError);await assert.rejects(readLimitedBody(new Request('https://app.example.com',{method:'POST',body:'fake',headers:{'content-type':'image/png'}})),HttpError);});
test('valid JPEG is decoded, resized and stripped of metadata',async()=>{const bytes=await sharp({create:{width:2500,height:1250,channels:3,background:'#dd3355'}}).jpeg().withMetadata().toBuffer();const clean=await sanitizeJpeg(bytes),m=await sharp(clean).metadata();assert.equal(m.width,1920);assert.equal(m.height,960);assert.equal(m.exif,undefined);assert.equal(m.format,'jpeg');});
test('declared oversized body is rejected before buffering',async()=>{await assert.rejects(readLimitedBody(new Request('https://app.example.com',{method:'POST',body:'abc',headers:{'content-type':'image/jpeg','content-length':String(9*1024*1024)}})),(e:unknown)=>e instanceof HttpError&&e.status===413);});
