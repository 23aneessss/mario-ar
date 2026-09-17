import { AmbientLight, DirectionalLight, NoToneMapping, OrthographicCamera, Scene, WebGLRenderer } from 'three';
import { instanceModel } from './models';
import type { Asset } from '@/data/catalog';
const previews = new Map<string, Promise<string>>();
let queue: Promise<unknown> = Promise.resolve();
let renderer: WebGLRenderer | null = null;
export function modelThumbnail(asset: Asset): Promise<string> {
  const path = asset.model!;
  if (!previews.has(path)) {
    const job = queue.then(async () => {
      const model = await instanceModel(path);
      renderer ??= new WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(256, 256, false);
      renderer.setClearColor(0, 0);
      renderer.toneMapping = NoToneMapping;
      const scene = new Scene();
      const camera = new OrthographicCamera(-.7, .7, .7, -.7, .01, 100);
      camera.position.set(0, .08, 5);
      camera.lookAt(0, 0, 0);
      model.rotation.set(...asset.initialRotation);
      scene.add(model, new AmbientLight(0xffffff, 1.6));
      const key = new DirectionalLight(0xffffff, 2);
      key.position.set(3, 5, 8);
      scene.add(key);
      renderer.render(scene, camera);
      return renderer.domElement.toDataURL('image/png');
    }).catch(error => { previews.delete(path); throw error; });
    queue = job.catch(() => undefined);
    previews.set(path, job);
  }
  return previews.get(path)!;
}
