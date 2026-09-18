import type { GLTFParser } from 'three/addons/loaders/GLTFLoader.js';

// Older Sketchfab exports use this removed glTF extension. Preserve their
// diffuse maps and alpha while approximating glossiness with roughness.
export function legacyMaterials(parser: GLTFParser) {
  return {
    name: 'KHR_materials_pbrSpecularGlossiness',
    beforeRoot() {
      for (const material of parser.json.materials ?? []) {
        const legacy = material.extensions?.KHR_materials_pbrSpecularGlossiness;
        if (!legacy) continue;
        material.pbrMetallicRoughness = {
          baseColorFactor: legacy.diffuseFactor ?? [1, 1, 1, 1],
          ...(legacy.diffuseTexture ? { baseColorTexture: legacy.diffuseTexture } : {}),
          metallicFactor: 0,
          roughnessFactor: Math.max(.08, 1 - (legacy.glossinessFactor ?? 1)),
        };
        delete material.extensions.KHR_materials_pbrSpecularGlossiness;
      }
      return null;
    },
  };
}
