import { findPhoto } from '@/lib/server/photos';
import { apiError } from '@/lib/server/http';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(_request:Request,{params}:{params:Promise<{token:string}>}){try{const photo=await findPhoto((await params).token);return Response.json({expiresAt:photo.expires_at.toISOString(),image:`/api/photos/${photo.token}/image`},{headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow'}});}catch(error){return apiError(error);}}
