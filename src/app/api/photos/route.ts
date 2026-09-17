import { configStatus, publicBaseUrl } from '@/lib/server/config';
import { ensureOrigin, HttpError, idempotencyKey, readLimitedBody, sanitizeJpeg } from '@/lib/server/validation';
import { rateLimit, savePhoto, verifyPublicPhoto } from '@/lib/server/photos';
import { apiError } from '@/lib/server/http';
export const runtime='nodejs';
export async function POST(request:Request){
  try{
    const config=configStatus();if(!config.available)throw new HttpError(503,config.reason!);
    ensureOrigin(request,publicBaseUrl());
    const key=idempotencyKey(request.headers.get('x-idempotency-key'));
    await rateLimit(request);
    const body=await sanitizeJpeg(await readLimitedBody(request)),photo=await savePhoto(body,key);
    const url=await verifyPublicPhoto(photo.token);
    return Response.json({token:photo.token,url,expiresAt:photo.expires_at.toISOString()},{status:201,headers:{'Cache-Control':'no-store'}});
  }catch(error){return apiError(error);}
}
