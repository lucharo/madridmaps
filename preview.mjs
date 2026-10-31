import { resolve, sep } from 'node:path';
const root = resolve(import.meta.dir, 'dist');
const server = Bun.serve({hostname:'127.0.0.1',port:18894,async fetch(request){
  const url = new URL(request.url);
  if (url.host !== '127.0.0.1:18894' || (request.headers.get('origin') && request.headers.get('origin') !== url.origin)) return new Response('Forbidden',{status:403});
  if (!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405});
  let pathname;try{pathname=decodeURIComponent(url.pathname);}catch{return new Response('Bad path',{status:400});}
  const filePath=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!filePath.startsWith(root+sep))return new Response('Forbidden',{status:403});
  const file=Bun.file(filePath);
  return await file.exists()?new Response(file,{headers:{'Cache-Control':'no-store'}}):new Response('Not found',{status:404});
}});
console.log(`Local: ${server.url}`);
