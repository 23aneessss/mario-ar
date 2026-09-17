'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
export function Dialog({open,onClose,title,children,wide=false}:{open:boolean;onClose:()=>void;title:string;children:ReactNode;wide?:boolean}) {
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const dialog=ref.current;if(open&&!dialog?.open)dialog?.showModal();if(!open&&dialog?.open)dialog.close();},[open]);
  return <dialog ref={ref} className={`sheet ${wide?'result-sheet':''}`} aria-label={title} onCancel={onClose} onClose={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}>
    <div className="sheet-inner"><div className="sheet-handle"/><header className="sheet-header"><h2>{title}</h2><button className="icon-button light" onClick={onClose} aria-label="Fermer"><X size={22}/></button></header>{children}</div>
  </dialog>;
}
