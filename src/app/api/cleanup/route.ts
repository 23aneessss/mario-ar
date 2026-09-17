import { timingSafeEqual } from 'node:crypto';
import { cleanupExpired } from '@/lib/server/photos';
import { apiError } from '@/lib/server/http';
export const runtime='nodejs';
export async function POST(request:Request){
  const secret=process.env.CLEANUP_SECRET,provided=request.headers.get('authorization')||'';
  if(!secret||provided.length!==`Bearer ${secret}`.length||!timingSafeEqual(Buffer.from(provided),Buffer.from(`Bearer ${secret}`)))return new Response(null,{status:401});
  try{return Response.json({deleted:await cleanupExpired()},{headers:{'Cache-Control':'no-store'}});}catch(error){return apiError(error);}
}
