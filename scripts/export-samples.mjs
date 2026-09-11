import {writeFileSync,mkdirSync} from 'node:fs';
import {products,meditations} from '../lib/catalog.ts';
mkdirSync('scripts',{recursive:true});
writeFileSync('scripts/audio-scripts.json',JSON.stringify(meditations.map(({id,prompt})=>({id,prompt})),null,2));
const quote=v=>"'"+String(v).replaceAll("'","''")+"'";
writeFileSync('supabase/seed.sql','-- Sample catalog. All purchases remain disabled until explicitly reviewed.\n'+products.map(p=>`insert into public.products(id,sku,name,category,kind,price,stock,description,image,gallery,tag,published,purchasable) values(${[p.id,p.sku,p.name,p.category,p.kind].map(quote).join(',')},${p.price},${p.stock},${quote(p.description)},${quote(p.image)},${quote(JSON.stringify(p.gallery||[p.image]))}::jsonb,${p.tag?quote(p.tag):'null'},true,false) on conflict(id) do nothing;`).join('\n'));
