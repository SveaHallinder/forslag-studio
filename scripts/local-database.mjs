import {DatabaseSync} from 'node:sqlite';
import {readFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');

// Apply the committed schema at startup, never during an HTTP request.
export function createLocalDatabase(filename=path.join(root,'.sites-runtime/studio.sqlite')) {
  if(filename!==':memory:')mkdirSync(path.dirname(filename),{recursive:true});
  const sqlite=new DatabaseSync(filename);sqlite.exec('PRAGMA foreign_keys=ON; CREATE TABLE IF NOT EXISTS _studio_migrations(tag TEXT PRIMARY KEY,hash TEXT NOT NULL)');
  for(const entry of JSON.parse(readFileSync(path.join(root,'drizzle/meta/_journal.json'),'utf8')).entries){
    const sql=readFileSync(path.join(root,'drizzle',entry.tag+'.sql'),'utf8'),hash=createHash('sha256').update(sql).digest('hex'),old=sqlite.prepare('SELECT hash FROM _studio_migrations WHERE tag=?').get(entry.tag);
    if(old){if(old.hash!==hash)throw new Error('[studio cloud] An applied migration changed. Append a new migration.');continue;}
    sqlite.exec('BEGIN');try{sqlite.exec(sql);sqlite.prepare('INSERT INTO _studio_migrations(tag,hash) VALUES(?,?)').run(entry.tag,hash);sqlite.exec('COMMIT');}catch(error){sqlite.exec('ROLLBACK');throw error;}
  }
  const execute=(sql,values,kind)=>{const statement=sqlite.prepare(sql);return kind==='first'?(statement.get(...values)||null):kind==='all'?{results:statement.all(...values)}:{meta:{changes:Number(statement.run(...values).changes)}};};
  const prepare=(sql,values=[])=>({bind(...next){return prepare(sql,next);},async first(){return execute(sql,values,'first');},async all(){return execute(sql,values,'all');},async run(){return execute(sql,values,'run');},execute(){return execute(sql,values,'run');}});
  return {prepare,async batch(statements){sqlite.exec('BEGIN');try{const results=statements.map(stmt=>stmt.execute());sqlite.exec('COMMIT');return results;}catch(error){sqlite.exec('ROLLBACK');throw error;}},close(){sqlite.close();}};
}
