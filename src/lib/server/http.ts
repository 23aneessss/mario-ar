import { HttpError } from './validation';
export function apiError(error:unknown){
  if(error instanceof HttpError)return Response.json({error:error.message},{status:error.status,headers:{'Cache-Control':'no-store',...(error.status===429?{'Retry-After':'600'}:{})}});
  // Never log tokens, bodies, DB credentials or signed URLs.
  console.error('Photo service unavailable:',error instanceof Error?error.name:'UnknownError');
  return Response.json({error:'Le service photo est momentanément indisponible. Votre téléchargement local reste possible.'},{status:503,headers:{'Cache-Control':'no-store'}});
}
