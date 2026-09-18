import { readFile,stat } from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {catalog} from '../src/data/catalog';
// gltf-validator ships no TS declarations.
// @ts-expect-error third-party validator
import validator from 'gltf-validator';
async function main(){let failures=0;const ids=new Set<string>();for(const asset of catalog){if(ids.has(asset.id))throw new Error(`Duplicate ID ${asset.id}`);ids.add(asset.id);
  try {const path=`public${asset.model}`,bytes=await readFile(path);if(asset.thumbnail)await stat(`public${asset.thumbnail}`);
    const result=await validator.validateBytes(new Uint8Array(bytes),{uri:asset.model,maxIssues:30});
    if(result.issues.numErrors)throw new Error(JSON.stringify(result.issues.messages));
    console.log(`${asset.id}: ${(bytes.length/1024).toFixed(0)} Ko, glTF valide, ${result.issues.numWarnings} avertissements, SHA256 ${createHash('sha256').update(bytes).digest('hex')}`);
  }catch(error){failures++;console.error(asset.id,error);}
}console.log(`${catalog.length} modèles intégrés.`);if(failures)process.exitCode=1;}
main();
