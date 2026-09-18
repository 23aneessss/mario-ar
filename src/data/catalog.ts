import importedModels from './imported-models.json';
export type Asset = {
  id: string; name: string; category: 'Personnages'|'Ennemis'|'Objets'; model: string; thumbnail: string|null;
  initialScale: number; initialRotation: [number,number,number];
  source: string; author: string; license: string; licenseUrl: string; note: string;
};
export const catalog: Asset[] = importedModels as Asset[];
export const assetById = (id: string) => catalog.find(a => a.id === id)!;
