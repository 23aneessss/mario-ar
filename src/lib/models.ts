import { legacyMaterials } from './legacy-materials';
import { Box3, Group, Vector3 } from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
const cache = new Map<string, Promise<Group>>();
export function loadModel(path: string): Promise<Group> {
  if (!cache.has(path)) {
    const promise = new GLTFLoader().register(legacyMaterials).loadAsync(path).then(gltf => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const box = new Box3().setFromObject(model), size = box.getSize(new Vector3()), center = box.getCenter(new Vector3());
      const max = Math.max(size.x,size.y,size.z);
      if (!Number.isFinite(max) || max <= 0) throw new Error('Modèle vide');
      const normalized = new Group();
      normalized.add(model); model.position.sub(center); normalized.scale.setScalar(1/max);
      return normalized;
    }).catch(error => { cache.delete(path); throw error; });
    cache.set(path,promise);
  }
  return cache.get(path)!;
}
export async function instanceModel(path: string) { return clone(await loadModel(path)); }
