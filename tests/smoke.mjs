import assert from 'node:assert/strict';
const base=process.env.TEST_ORIGIN||'http://localhost:5173';
for(const route of ['/','/tienda','/producto/amatista-natural','/meditaciones','/recursos','/cursos','/carrito','/mi-cuenta','/admin','/recuperar']){const r=await fetch(base+route);assert.equal(r.status,200,route);}
const cat=await (await fetch(base+'/api/catalog')).json();assert.equal(cat.configured,false);assert.equal(cat.checkout,false);assert.equal(cat.products.length,8);
for(const [path,status] of [['checkout/orders',503],['auth/login',503],['admin/inventory',401],['assets/meditacion-descanso/access',401]]){const r=await fetch(base+'/api/'+path,{method:'POST',headers:{Origin:base,'Content-Type':'application/json'},body:'{}'});assert.equal(r.status,status,path)}
assert.equal((await fetch(base+'/api/admin/inventory',{method:'POST',headers:{Origin:'https://evil.invalid'},body:'{}'})).status,403);
assert.equal((await fetch(base+'/api/me/library')).status,401);
for(let i=1;i<=20;i++){const r=await fetch(base+`/audio/pausa-${i}.wav`,{headers:{Range:'bytes=0-43'}});assert.ok([200,206].includes(r.status));const b=Buffer.from(await r.arrayBuffer());assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,12).toString(),'WAVE');}
const pdf=Buffer.from(await (await fetch(base+'/downloads/una-pausa-con-intencion.pdf')).arrayBuffer());assert.equal(pdf.subarray(0,4).toString(),'%PDF');
console.log('PASS: 10 pages, catalog, disabled payments, 4 protected endpoints, origin protection, 20 WAVs and PDF.');
