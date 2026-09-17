'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export type CameraStatus = 'idle'|'loading'|'ready'|'error';
export function cameraError(error: unknown) {
  const name = error instanceof Error ? error.name : '';
  if (name === 'NotAllowedError' || name === 'PermissionDeniedError') return 'Accès refusé. Autorisez la caméra dans les réglages du navigateur, puis réessayez.';
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') return 'Aucune caméra détectée. Branchez une webcam ou utilisez votre téléphone.';
  if (name === 'NotReadableError' || name === 'TrackStartError') return 'La caméra est occupée. Fermez les autres applications qui l’utilisent, puis réessayez.';
  return 'Impossible de démarrer la caméra. Vérifiez les autorisations puis réessayez.';
}
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null), stream = useRef<MediaStream|null>(null), requestId = useRef(0);
  const [status,setStatus] = useState<CameraStatus>('idle'), [message,setMessage] = useState('');
  const [facing,setFacing] = useState<'user'|'environment'>('environment');
  const stop = useCallback(() => { stream.current?.getTracks().forEach(t=>t.stop()); stream.current=null; },[]);
  const start = useCallback(async (direction: 'user'|'environment' = 'environment') => {
    const ticket = ++requestId.current;
    stop(); setStatus('loading'); setMessage('');
    if (!window.isSecureContext) { setStatus('error'); setMessage('La caméra nécessite HTTPS, ou localhost sur cet ordinateur.'); return; }
    if (!navigator.mediaDevices?.getUserMedia) { setStatus('error'); setMessage('Ce navigateur ne permet pas l’accès à la caméra. Essayez Safari ou Chrome récent.'); return; }
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio:false, video:{facingMode:{ideal:direction},width:{ideal:1920},height:{ideal:1080}} });
      if(ticket!==requestId.current) {media.getTracks().forEach(t=>t.stop());return;}
      stream.current=media;
      const video=videoRef.current;
      if(!video) {stop();return;}
      video.srcObject=media;
      await video.play();
      if(ticket!==requestId.current)return;
      setFacing(media.getVideoTracks()[0].getSettings().facingMode==='user'?'user':direction);
      media.getVideoTracks()[0].onended=()=>{ if(ticket===requestId.current) {setStatus('error');setMessage('La caméra a été interrompue. Activez-la à nouveau.');} };
      setStatus('ready');
    } catch(error) { if(ticket===requestId.current) {stop();setStatus('error');setMessage(cameraError(error));} }
  },[stop]);
  useEffect(()=>()=>{++requestId.current;stop();},[stop]);
  return {videoRef,status,message,facing,start,switchCamera:()=>start(facing==='user'?'environment':'user')};
}
