import { Vector2, type Camera, type Scene, type WebGLRenderer } from 'three';
import { coverCrop, outputSize } from './composition';
export type RenderBridge = { gl: WebGLRenderer; scene: Scene; camera: Camera; render:()=>void };
export async function capturePhoto(video: HTMLVideoElement, bridge: RenderBridge, mirror: boolean, width: number, height: number) {
  if(video.readyState<2 || !video.videoWidth || video.paused) throw new Error('La caméra n’est pas encore prête.');
  const crop=coverCrop(video.videoWidth,video.videoHeight,width,height);
  const maxScale=Math.min(crop.width/width,crop.height/height);
  const out=outputSize(width*maxScale,height*maxScale);
  const canvas=document.createElement('canvas');canvas.width=out.width;canvas.height=out.height;
  const ctx=canvas.getContext('2d'); if(!ctx)throw new Error('Capture indisponible.');
  ctx.save(); if(mirror) {ctx.translate(out.width,0);ctx.scale(-1,1);}
  ctx.drawImage(video,crop.x,crop.y,crop.width,crop.height,0,0,out.width,out.height);ctx.restore();
  const {gl,scene,camera}=bridge, originalSize=gl.getSize(new Vector2()), ratio=gl.getPixelRatio();
  try {
    gl.setPixelRatio(1);gl.setSize(out.width,out.height,false);
    scene.updateMatrixWorld(true);gl.render(scene,camera);
    ctx.drawImage(gl.domElement,0,0,out.width,out.height);
  } finally {gl.setPixelRatio(ratio);gl.setSize(originalSize.x,originalSize.y,false);bridge.render();}
  return new Promise<Blob>((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('La photo n’a pas pu être créée.')),'image/jpeg',.92));
}
