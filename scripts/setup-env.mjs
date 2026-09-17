import { randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
if(existsSync('.env')){console.log('.env existe déjà, aucun secret modifié.');process.exit(0);}
const secret=()=>randomBytes(32).toString('hex'),pg=secret(),s3=secret();
const values={POSTGRES_PASSWORD:pg,DATABASE_URL:`postgres://mario:${pg}@127.0.0.1:5434/mario`,S3_SECRET_KEY:s3,RATE_LIMIT_SECRET:secret(),CLEANUP_SECRET:secret()};
const text=readFileSync('.env.example','utf8').split('\n').map(line=>{const key=line.split('=')[0];return key in values?`${key}=${values[key]}`:line;}).join('\n');
writeFileSync('.env',text,{mode:0o600});console.log('.env créé avec des secrets aléatoires.');
