'use client';
import { useRef, type MutableRefObject, type PointerEvent } from 'react';
import { Raycaster, Vector2, type Object3D } from 'three';
import { applyGesture, gesture, type Point, type SceneItem, type Transform } from './composition';
import type { RenderBridge } from './capture';
export function useManipulation(bridge:MutableRefObject<RenderBridge|null>,items:SceneItem[],selected:string|null,select:(id:string|null)=>void,update:(id:string,t:Partial<Transform>)=>void) {
  const points=useRef(new Map<number,Point>()), session=useRef<{id:string;base:Transform;start:ReturnType<typeof gesture>}|null>(null);
  const latest=useRef(items);latest.current=items;
  const hit=(event:PointerEvent)=>{
    if(!bridge.current)return null;
    const rect=event.currentTarget.getBoundingClientRect(),ray=new Raycaster();
    bridge.current.scene.updateMatrixWorld(true);
    ray.setFromCamera(new Vector2((event.clientX-rect.left)/rect.width*2-1,1-(event.clientY-rect.top)/rect.height*2),bridge.current.camera);
    for(const hit of ray.intersectObjects(bridge.current.scene.children,true)) {
      let o:Object3D|null=hit.object;while(o) {if(o.userData.itemId)return o.userData.itemId as string;o=o.parent;}
    }
    return null;
  };
  const rebase=(id:string|null)=>{const item=latest.current.find(i=>i.id===id);session.current=item&&points.current.size?{id:item.id,base:{...item},start:gesture([...points.current.values()])}:null;};
  const down=(e:PointerEvent<HTMLDivElement>)=>{
    if(points.current.size>=2)return;
    e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);
    points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const id=points.current.size===1?hit(e):(session.current?.id??selected);
    if(points.current.size===1)select(id);rebase(id);
  };
  const move=(e:PointerEvent<HTMLDivElement>)=>{
    if(!points.current.has(e.pointerId))return;
    points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(!session.current)return;
    const rect=e.currentTarget.getBoundingClientRect(),s=session.current;
    const transform=applyGesture(s.base,s.start,gesture([...points.current.values()]),rect.width,rect.height);
    latest.current=latest.current.map(i=>i.id===s.id?{...i,...transform}:i);update(s.id,transform);
  };
  const up=(e:PointerEvent<HTMLDivElement>)=>{points.current.delete(e.pointerId);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);rebase(session.current?.id??null);};
  return {onPointerDown:down,onPointerMove:move,onPointerUp:up,onPointerCancel:up,onLostPointerCapture:up};
}
