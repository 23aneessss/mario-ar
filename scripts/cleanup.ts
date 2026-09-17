import { cleanupExpired } from '../src/lib/server/photos';
import { closeDb } from '../src/lib/server/db';
async function main(){try{console.log('Photos supprimées :',await cleanupExpired());}finally{await closeDb();}}
main().catch(()=>{console.error('Nettoyage impossible. Vérifiez les services Docker et les variables serveur.');process.exitCode=1;});
