'use client';
import { useState } from 'react';
import { Search, Plus, LoaderCircle } from 'lucide-react';
import { catalog, type Asset } from '@/data/catalog';
import { Dialog } from './dialog';
import { ModelThumbnail } from './model-thumbnail';
const categories=['Tous','Personnages','Ennemis','Objets'];
export function Catalog({open,onClose,onAdd,loading}:{open:boolean;onClose:()=>void;onAdd:(asset:Asset)=>void;loading:string|null}) {
  const [query,setQuery]=useState(''),[category,setCategory]=useState('Tous');
  const filtered=catalog.filter(a=>(category==='Tous'||a.category===category)&&a.name.toLocaleLowerCase('fr').includes(query.toLocaleLowerCase('fr')));
  return <Dialog open={open} onClose={onClose} title="Éléments">
    <label className="search"><Search size={19}/><input type="search" placeholder="Rechercher un élément…" aria-label="Rechercher un élément" value={query} onChange={e=>setQuery(e.target.value)}/></label>
    <div className="categories" aria-label="Catégories">{categories.map(c=><button key={c} aria-pressed={c===category} onClick={()=>setCategory(c)}>{c}</button>)}</div>
    <div className="catalog-scroll">
      <div className="catalog-grid">{filtered.map(a=><article key={a.id} className="asset-card">
        <button className="asset-add" onClick={()=>onAdd(a)} disabled={!!loading} aria-label={`Ajouter ${a.name}`}>
          <div className={`asset-preview ${a.id}`}>
            {a.thumbnail?<img src={a.thumbnail} alt="" loading="lazy"/>:<ModelThumbnail asset={a}/>}
            <span className="asset-badge">{loading===a.id?<LoaderCircle size={16} className="spin"/>:<Plus size={16}/>}</span>
          </div>
          <strong>{a.name}</strong><span className="asset-status">Prêt à placer</span>
        </button>
      </article>)}</div>
      {filtered.length===0&&<p className="empty-state">Aucun élément pour cette recherche.</p>}
    </div>
  </Dialog>;
}
