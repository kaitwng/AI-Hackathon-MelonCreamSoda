import {readdirSync} from 'node:fs';import {spawnSync} from 'node:child_process';
for(const file of readdirSync(new URL('../tests/',import.meta.url)).filter(f=>/\.test\.(cjs|mjs)$/.test(f)).sort()){const result=spawnSync(process.execPath,[new URL('../tests/'+file,import.meta.url).pathname],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
