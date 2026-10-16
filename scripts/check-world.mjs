import {readdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
for(const folder of ['halo/world','halo/shell','halo/shared']){
  let entries;try{entries=readdirSync(folder,{recursive:true});}catch{continue;}
  for(const file of entries.filter(file=>file.endsWith('.js')))execFileSync(process.execPath,['--check',`${folder}/${file}`],{stdio:'inherit'});
}
console.log('World module syntax checks passed.');
