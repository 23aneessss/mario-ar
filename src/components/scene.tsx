'use client';
import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Color, NoToneMapping, OrthographicCamera, type Object3D } from 'three';
import { assetById } from '@/data/catalog';
import { instanceModel } from '@/lib/models';
import type { RenderBridge } from '@/lib/capture';
import type { SceneItem } from '@/lib/composition';
function Model({item,onError}:{item:SceneItem;onError:(id:string)=>void}) {
  const asset=assetById(item.assetId), [model,setModel]=useState<Object3D|null>(null);
  const {size}=useThree();
  useEffect(()=>{let active=true; if(asset.model) instanceModel(asset.model).then(m=>{if(active)setModel(m);}).catch(()=>{if(active)onError(item.id);});return()=>{active=false;};},[asset.model,item.id,onError]);
  const aspect=size.width/size.height, scale=.68*Math.min(1,aspect)*item.scale;
  return <group position={[item.x*aspect,item.y,0]} rotation={[0,0,item.roll]} scale={scale} userData={{itemId:item.id}}>
    <group rotation={[asset.initialRotation[0],item.yaw,asset.initialRotation[2]]}>
      {model&&<primitive object={model} dispose={null}/>}
    </group>
  </group>;
}
function Bridge({bridge}:{bridge:MutableRefObject<RenderBridge|null>}) {
  const {gl,scene,size,invalidate,set}=useThree();
  const camera=useMemo(()=>new OrthographicCamera(-1,1,1,-1,.01,100),[]);
  useEffect(()=>{camera.position.set(0,0,10);camera.lookAt(0,0,0);set({camera});},[camera,set]);
  useEffect(()=>{camera.left=-size.width/size.height;camera.right=size.width/size.height;camera.top=1;camera.bottom=-1;camera.updateProjectionMatrix();invalidate();},[camera,size,invalidate]);
  useEffect(()=>{bridge.current={gl,scene,camera,render:invalidate}; return()=>{bridge.current=null;};},[gl,scene,camera,invalidate,bridge]);
  return null;
}
export default function Scene({items,bridge,onError,onContextLost}:{items:SceneItem[];bridge:MutableRefObject<RenderBridge|null>;onError:(id:string)=>void;onContextLost:()=>void}) {
  const wrapper=useRef<HTMLDivElement>(null);
  useEffect(()=>{const canvas=wrapper.current?.querySelector('canvas');const listener=(event:Event)=>{event.preventDefault();onContextLost();};canvas?.addEventListener('webglcontextlost',listener);return()=>canvas?.removeEventListener('webglcontextlost',listener);},[onContextLost]);
  return <div className="scene-canvas" ref={wrapper}><Canvas frameloop="demand" dpr={[1,2]} gl={{alpha:true,antialias:true,preserveDrawingBuffer:false,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.setClearColor(new Color('#000000'),0);gl.toneMapping=NoToneMapping;}}>
    <Bridge bridge={bridge}/><ambientLight intensity={1.6}/><directionalLight position={[3,5,8]} intensity={2}/><directionalLight position={[-4,2,4]} intensity={.7}/>
    {items.map(item=><Model key={item.id} item={item} onError={onError}/>)}
  </Canvas></div>;
}
