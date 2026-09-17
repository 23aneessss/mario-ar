import sharp from 'sharp';
export class HttpError extends Error {constructor(public status:number,message:string){super(message);}}
export const MAX_UPLOAD_BYTES=8*1024*1024;
export const tokenPattern=/^[A-Za-z0-9_-]{43}$/;
export function idempotencyKey(raw:string|null){if(!raw||!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(raw))throw new HttpError(400,'Identifiant de capture invalide.');return raw;}
export async function readLimitedBody(request:Request){
  const length=Number(request.headers.get('content-length')||0);
  if(length>MAX_UPLOAD_BYTES)throw new HttpError(413,'La photo dépasse 8 Mo.');
  if(request.headers.get('content-type')?.split(';')[0]!=='image/jpeg')throw new HttpError(415,'Seules les photos JPEG sont acceptées.');
  if(!request.body)throw new HttpError(400,'Photo manquante.');
  const reader=request.body.getReader(),parts:Uint8Array[]=[];let count=0;
  for(;;){const {done,value}=await reader.read();if(done)break;count+=value.length;if(count>MAX_UPLOAD_BYTES){await reader.cancel();throw new HttpError(413,'La photo dépasse 8 Mo.');}parts.push(value);}
  if(count<4)throw new HttpError(400,'Photo vide.');
  return Buffer.concat(parts);
}
export async function sanitizeJpeg(body:Buffer){
  if(body[0]!==255||body[1]!==216||body[2]!==255)throw new HttpError(415,'Ce fichier n’est pas une photo JPEG.');
  try{const image=sharp(body,{limitInputPixels:16_000_000,failOn:'warning'}),meta=await image.metadata();
    if(meta.format!=='jpeg'||!meta.width||!meta.height)throw new Error();
    // Decode and re-encode, strip metadata (including GPS), and bound stored resolution.
    return await image.rotate().resize({width:1920,height:1920,fit:'inside',withoutEnlargement:true}).jpeg({quality:92}).toBuffer();
  }catch{throw new HttpError(422,'La photo est illisible ou trop grande.');}
}
export function ensureOrigin(request:Request,publicUrl:string|null){
  const origin=request.headers.get('origin');
  const same=new URL(request.url).origin;
  if(!origin||(origin!==same&&origin!==publicUrl))throw new HttpError(403,'Origine de la requête non autorisée.');
}
