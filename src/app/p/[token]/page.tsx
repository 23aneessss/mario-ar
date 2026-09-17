import type { Metadata } from 'next';
import { findPhoto } from '@/lib/server/photos';
import { HttpError } from '@/lib/server/validation';
import { SharedPhotoView } from '@/components/shared-photo';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Votre photo',robots:{index:false,follow:false,noarchive:true}};
export default async function PhotoPage({params}:{params:Promise<{token:string}>}){
  const {token}=await params;
  try{const photo=await findPhoto(token);return <SharedPhotoView token={token} expiresAt={photo.expires_at.toISOString()}/>;}
  catch(error){return <SharedPhotoView error={error instanceof HttpError?error.message:'Le service photo est momentanément indisponible. Réessayez plus tard.'}/>;}
}
