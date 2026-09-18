import importedModels from './imported-models.json';
export type Asset = {
  id: string; name: string; category: 'Personnages'|'Ennemis'|'Objets'|'Démo'; model: string|null; thumbnail: string|null;
  initialScale: number; initialRotation: [number,number,number]; status: 'available'|'unavailable'|'demo';
  source: string|null; author: string|null; license: string|null; licenseUrl: string|null; note: string;
};
const groups = {
  Personnages: [['mario','Mario'],['luigi','Luigi'],['peach','Peach'],['daisy','Daisy'],['yoshi','Yoshi'],['toad','Toad'],['toadette','Toadette'],['wario','Wario'],['waluigi','Waluigi'],['bowser','Bowser'],['bowser-jr','Bowser Jr.'],['rosalina','Rosalina'],['donkey-kong','Donkey Kong'],['diddy-kong','Diddy Kong']],
  Ennemis: [['goomba','Goomba'],['koopa-troopa','Koopa Troopa'],['boo','Boo'],['shy-guy','Shy Guy'],['piranha-plant','Plante Piranha'],['bob-omb','Bob-omb'],['bullet-bill','Bullet Bill'],['lakitu','Lakitu']],
  Objets: [['coin','Pièce'],['super-mushroom','Super Mushroom'],['1up-mushroom','Champignon 1-UP'],['super-star','Super Star'],['fire-flower','Fleur de feu'],['question-block','Bloc « ? »'],['brick-block','Bloc de briques'],['green-pipe','Tuyau vert'],['green-shell','Carapace verte'],['red-shell','Carapace rouge'],['finish-flag','Drapeau d’arrivée']]
};
const suppliedModels = importedModels as Asset[];
const overrides: Record<string, Asset> = Object.fromEntries(suppliedModels.map(asset => [asset.id, asset]));
const baseIds = new Set(Object.values(groups).flatMap(entries => entries.map(([id]) => id)));
export const catalog: Asset[] = Object.entries(groups).flatMap(([category, entries]) => entries.map(([id,name]) => overrides[id] ?? ({
  id,name,category:category as Asset['category'],model:null,thumbnail:null,initialScale:1,initialRotation:[0,0,0] as [number,number,number],status:'unavailable' as const,source:null,author:null,license:null,licenseUrl:null,
  note:`Modèle conforme et redistribuable non intégré. Fichier attendu : public/models/${id}.glb. Ajoutez le fichier et sa miniature pour activer cet élément.`
}))).concat(suppliedModels.filter(asset => !baseIds.has(asset.id))).concat([
  {id:'demo-orb',name:'Bulle studio',category:'Démo',model:null,thumbnail:null,initialScale:1,initialRotation:[0,0,0],status:'demo',source:null,author:'Mario AR Camera',license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',note:'Objet procédural de démonstration, aucun personnage remplacé.'},
  {id:'demo-ring',name:'Anneau studio',category:'Démo',model:null,thumbnail:null,initialScale:1,initialRotation:[0,0,0],status:'demo',source:null,author:'Mario AR Camera',license:'CC0',licenseUrl:'https://creativecommons.org/publicdomain/zero/1.0/',note:'Objet procédural de démonstration, aucun personnage remplacé.'}
] as Asset[]);
export const assetById = (id: string) => catalog.find(a => a.id === id)!;
