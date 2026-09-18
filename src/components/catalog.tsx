'use client';
import { useState } from 'react';
import { Box, Search, Plus, LockKeyhole, LoaderCircle, Circle, CircleDot } from 'lucide-react';
import { catalog, type Asset } from '@/data/catalog';
import { Dialog } from './dialog';
import { ModelThumbnail } from './model-thumbnail';
const categories=['Tous','Personnages','Ennemis','Objets','Démo'];
export function Catalog({open,onClose,onAdd,loading}:{open:boolean;onClose:()=>void;onAdd:(asset:Asset)=>void;loading:string|null}) {
  const [query,setQuery]=useState(''),[category,setCategory]=useState('Tous'),[detail,setDetail]=useState<Asset|null>(null);
  const filtered=catalog.filter(a=>(category==='Tous'||a.category===category)&&a.name.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr'))).sort((a,b)=>Number(a.status==='unavailable')-Number(b.status==='unavailable'));
  return <Dialog open={open} onClose={onClose} title="Éléments">
    <label className="search"><Search size={19}/><input type="search" placeholder="Rechercher un élément…" aria-label="Rechercher un élément" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="categories" aria-label="Catégories">{categories.map(c=><button key={c} aria-pressed={c===category} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <div className="catalog-scroll">
      <div className="catalog-grid">{filtered.map(a=><article key={a.id} className={`asset-card ${a.status==='unavailable'?'unavailable':''}`}>
        <button className="asset-add" onClick={()=>a.status==='unavailable'?setDetail(a):onAdd(a)} disabled={!!loading} aria-label={a.status==='unavailable'?`${a.name}, indisponible, détails`:`Ajouter ${a.name}`}>
          <div className={`asset-preview ${a.id}`}>
            {a.thumbnail?<img src={a.thumbnail} alt="" loading="lazy"/>:a.model&&a.status==='available'?<ModelThumbnail asset={a}/>:a.status==='demo'?(a.id==='demo-ring'?<Circle size={56} strokeWidth={5}/>:<CircleDot size={56} strokeWidth={1.3}/>):<Box size={36} strokeWidth={1}/>}
            <span className="asset-badge">{loading===a.id?<LoaderCircle size={16} className="spin"/>:a.status==='unavailable'?<LockKeyhole size={13}/>:<Plus size={16}/>}</span>
          </div>
          <strong>{a.name}</strong><span className="asset-status">{a.status==='available'?'Prêt à placer':a.status==='demo'?'Démo procédurale':'Modèle à ajouter'}</span>
        </button>
      </article>)}</div>
      {filtered.length===0&&<p className="empty-state">Aucun élément pour cette recherche.</p>}
      {detail&&<div className="asset-detail" role="status"><strong>{detail.name} · Indisponible</strong><p>{detail.note}</p><button className="text-button" onClick={()=>setDetail(null)}>Masquer</button></div>}
      <p className="catalog-note">Les personnages en attente de fichier restent indisponibles. Les éléments « Démo » servent à essayer les gestes.</p>
    </div>
  </Dialog>;
}
