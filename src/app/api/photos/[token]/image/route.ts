import { findPhoto } from '@/lib/server/photos';
import { getImage, headImage } from '@/lib/server/storage';
import { apiError } from '@/lib/server/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
const headers=(token:string,download:boolean)=>({'Content-Type':'image/jpeg','Content-Disposition':`${download?'attachment':'inline'}; filename="mario-ar-photo.jpg"`,'Cache-Control':'private, no-store, max-age=0','X-Robots-Tag':'noindex, nofollow, noarchive','X-Photo-Token':token,'X-Content-Type-Options':'nosniff'});
export async function GET(request:Request,{params}:{params:Promise<{token:string}>}){
  try{const photo=await findPhoto((await params).token),image=await getImage(photo.object_key);if(!image.Body)throw new Error('MissingImage');return new Response(image.Body.transformToWebStream(),{headers:headers(photo.token,new URL(request.url).searchParams.get('download')==='1')});}catch(error){return apiError(error);}
}
export async function HEAD(_request:Request,{params}:{params:Promise<{token:string}>}){
  try{const photo=await findPhoto((await params).token);await headImage(photo.object_key);return new Response(null,{headers:headers(photo.token,false)});}catch(error){return apiError(error);}
}
