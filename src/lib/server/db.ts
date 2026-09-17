import { Pool } from 'pg';
const globalPg=globalThis as unknown as {marioPool?:Pool};
export function db(){return globalPg.marioPool??=new Pool({connectionString:process.env.DATABASE_URL,max:8,connectionTimeoutMillis:4000,idleTimeoutMillis:30000,statement_timeout:15000});}
export async function closeDb(){await globalPg.marioPool?.end();globalPg.marioPool=undefined;}
