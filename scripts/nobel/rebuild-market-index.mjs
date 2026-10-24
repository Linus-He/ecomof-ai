import {readFile,readdir,writeFile} from 'node:fs/promises'
const root=new URL('../../public/data/nobel-odds/',import.meta.url)
const files=(await readdir(root)).filter(file=>/^\d{4}(?:-[a-z]+)?\.json$/.test(file)).sort()
const editions=[]
for(const file of files){const data=JSON.parse(await readFile(new URL(file,root),'utf8'));if(!data.candidates?.length || !['Polymarket','Manifold','Kalshi'].includes(data.source))throw Error(`Invalid market: ${file}`);editions.push({year:data.year,source:data.source,file})}
const years=[...new Set(editions.map(e=>e.year))].sort((a,b)=>a-b)
await writeFile(new URL('index.json',root),JSON.stringify({years,latestYear:years[years.length-1],editions},null,2)+'\n')
