# Caméra 3D

Application Next.js / React / Three.js, avec PostgreSQL et SeaweedFS dans Docker. Aucune dépendance à Supabase.

L’interface contient uniquement la caméra, l’ajout d’éléments, les réglages de l’objet sélectionné, la capture et le partage. Les objets restent positionnés dans le cadre de l’écran : il n’y a pas de suivi spatial.

## Lancer en développement

Node.js 22 ou plus récent et Docker Compose sont requis.

```sh
npm install
npm run setup:env
docker compose up -d db storage
npm run dev
```

Ouvrir l’adresse indiquée par Next.js, généralement http://localhost:3000. Si ce port est occupé, Next.js en choisit un autre. La caméra est autorisée sur localhost ; une adresse HTTP du réseau local ne suffit pas sur un téléphone.

Sans Docker ou sans configuration de partage, la caméra, les éléments 3D, la capture et le téléchargement local restent utilisables. Le partage est explicitement indisponible.

## Lancer toute l’application avec Docker

```sh
npm run setup:env
docker compose up -d --build
```

`APP_PORT` dans `.env` permet de changer le port HTTP local. PostgreSQL utilise le port local 5434 ; le stockage S3 utilise 8333. Les volumes `postgres_data` et `storage_data` conservent les données après un redémarrage. Le service `cleanup` supprime les photos expirées toutes les heures. Ne pas supprimer les volumes pour une mise à jour.

Le script `setup:env` génère les secrets locaux sans les afficher. Il ne remplace jamais un `.env` existant. Les variables serveur ne sont pas exposées au navigateur.

## Activer le partage HTTPS

Sur un serveur accessible publiquement, faire pointer un domaine vers ce serveur et ouvrir les ports 80/443. Compléter `.env` :

```dotenv
PUBLIC_BASE_URL=https://photos.votre-domaine.fr
APP_DOMAIN=photos.votre-domaine.fr
ACME_EMAIL=votre-adresse@example.com
TRUST_PROXY=true
PHOTO_RETENTION_DAYS=7
```

Puis :

```sh
docker compose --profile https up -d --build
```

Caddy sert l’application avec HTTPS. Il remplace les en-têtes d’adresse cliente utilisés pour la limitation des envois. Garder `TRUST_PROXY=false` en accès direct ; dans ce cas, la limite est partagée entre les clients. La limite est de 30 envois par fenêtre de 10 minutes. La durée des photos est configurable entre 1 et 30 jours.

Le QR code est généré seulement après l’enregistrement et une vérification HTTP de l’image par son adresse publique. Aucun QR code localhost, blob ou de démonstration n’est affiché. Le serveur doit pouvoir joindre son propre domaine public.

Les fichiers sont privés dans le stockage. Le serveur contrôle l’expiration avant de servir une image. Les liens contiennent 256 bits aléatoires ; leur possession donne accès à la photo. Les routes photo portent des directives noindex et no-store. Les JPEG sont limités à 8 Mo, décodés et réencodés côté serveur, avec suppression des métadonnées et résolution maximale de 1920 px. Une même capture réenvoyée conserve le même identifiant.

## Modèles et catalogue

La recherche externe a été arrêtée à votre demande. Le Mario cubique a été retiré. 15 modèles fournis sont désormais intégrés, avec leurs crédits dans `src/data/imported-models.json`. Le Mario principal est celui de votre référence (`mario_obj.glb`). Les éléments non fournis restent indisponibles.

1. Placer le GLB dans `public/models/mario.glb` et sa miniature dans `public/thumbnails/mario.webp`, par exemple.
2. Dans `src/data/imported-models.json`, ajouter ou modifier l’entrée correspondante (les entrées sont fusionnées automatiquement avec le catalogue) :

```ts
mario: {
  status: 'available',
  model: '/models/mario.glb',
  thumbnail: '/thumbnails/mario.webp',
  source: 'URL de la source du modèle',
  author: 'Auteur du modèle',
  license: 'Licence applicable',
  licenseUrl: 'URL de la licence',
  initialScale: 1,
  initialRotation: [0, 0, 0],
  note: 'Attribution requise et modifications éventuelles.'
}
```

Les crédits sont affichés dans l’aide. Ne déclarer un modèle disponible qu’après avoir ajouté son fichier et vérifié les droits nécessaires. Aucun composant d’interface n’a besoin d’être modifié. Pour étendre le catalogue, ajouter une entrée dans `groups`, puis ses métadonnées dans `overrides`.

GLB autonome recommandé, avec textures embarquées. glTF fonctionne si ses fichiers `.bin` et textures sont placés à côté et si `model` pointe vers le `.gltf`. Réduire les textures à 1024 ou 2048 px et viser quelques Mo par modèle. Cette version ne configure pas de décodeur Draco/KTX2 : fournir des modèles sans ces extensions de compression. Les modèles sont chargés à la demande, mis en cache, clonés pour chaque instance et normalisés sans modifier le fichier d’origine. Les animations embarquées ne sont pas jouées.

## Organisation

- `src/lib/use-camera.ts` : permissions, flux, changement de caméra, arrêt des pistes.
- `src/data/catalog.ts` : catalogue et licences.
- `src/components/scene.tsx` et `src/lib/models.ts` : rendu 3D et chargement.
- `src/lib/use-manipulation.ts` : sélection par raycast et gestes.
- `src/lib/composition.ts` et `src/lib/capture.ts` : cadrage, miroir, export JPEG.
- `src/components/photo-result.tsx` : téléchargement, envoi, reprise, QR code.
- `src/lib/server` et `src/app/api` : validation, stockage, partage et nettoyage.
- `src/app/p/[token]` : consultation sans compte ni caméra.
- `docker/001-init.sql` : schéma de base de données.
- `compose.yaml` et `docker/Caddyfile` : auto-hébergement.

## État de validation

Avant votre demande d’arrêter les builds et tests : compilation production réussie, TypeScript réussi et 14 tests unitaires réussis (cadrage, gestes, validation des uploads, URLs). Aucun build ni test supplémentaire n’a été lancé après cette demande. La simplification finale de l’interface n’a donc pas été revalidée par ces commandes.

PostgreSQL et SeaweedFS ont été démarrés localement. Le test d’intégration stockage est fourni dans `tests/storage.integration.ts` mais n’a pas été exécuté. Aucun test sur iPhone/Android physique, aucun scan QR depuis un second appareil et aucun déploiement HTTPS public n’ont été effectués.

Commandes disponibles si vous souhaitez les utiliser plus tard :

```sh
npm test
npm run test:storage
npm run assets:check
npm run typecheck
npm run build
```

La sonde HTTPS publique du test d’intégration est simulée ; les écritures PostgreSQL et S3 de ce test sont réelles. Elle ne remplace pas un test depuis un autre téléphone.

À vérifier sur appareils réels après configuration : autorisation/refus caméra, caméra avant/arrière, gestes à un/deux doigts, rotation portrait/paysage, fidélité photo/cadrage, téléchargement Safari/Chrome, coupure réseau puis réessai, scan QR, téléchargement sans compte et expiration. Les photos en aperçu sont conservées en mémoire jusqu’au rechargement de la page ; les télécharger avant de quitter si l’envoi a échoué.

## Stockage

SeaweedFS remplace le choix initial MinIO : la version communautaire MinIO est désormais archivée. Le client S3 de l’application reste compatible avec d’autres stockages S3 privés. Images Docker fixées pour SeaweedFS et version majeure fixée pour PostgreSQL ; mettre à jour ces images selon votre politique de maintenance.

- SeaweedFS : https://github.com/seaweedfs/seaweedfs
- État de MinIO : https://github.com/minio/minio
