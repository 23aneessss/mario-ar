import { isIP } from 'node:net';
export function publicBaseUrl(raw=process.env.PUBLIC_BASE_URL): string|null {
  if(!raw)return null;
  try {const u=new URL(raw),host=u.hostname.toLowerCase();
    if(u.protocol!=='https:'||u.username||u.password||u.port&&u.port!=='443'||u.pathname!=='/'||u.search||u.hash||isIP(host)||host.includes(':')||!host.includes('.')||/^(localhost|127\.)/.test(host)||/\.(localhost|local|internal|test|invalid)$/.test(host))return null;
    return u.origin;
  }catch{return null;}
}
export function retentionDays(raw=process.env.PHOTO_RETENTION_DAYS) {const n=Number(raw??7);return Number.isInteger(n)&&n>=1&&n<=30?n:7;}
export function storageConfigured() {return ['DATABASE_URL','S3_ENDPOINT','S3_ACCESS_KEY','S3_SECRET_KEY','RATE_LIMIT_SECRET'].every(k=>!!process.env[k]);}
export function configStatus() {
  if(!storageConfigured())return {available:false,days:retentionDays(),reason:'Le stockage Docker n’est pas encore configuré.'};
  if(!publicBaseUrl())return {available:false,days:retentionDays(),reason:'Une adresse HTTPS publique est nécessaire pour partager sur un autre appareil.'};
  return {available:true,days:retentionDays()};
}
export const bucket=()=>process.env.S3_BUCKET||'mario-photos';
