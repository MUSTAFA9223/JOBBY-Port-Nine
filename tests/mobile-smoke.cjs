const { chromium } = require('playwright-core');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../site');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.glb':'model/gltf-binary','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end(pathname+' not found');return;}
    res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'});
    res.end(data);
  });
});
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 let browser;
 try{
   browser=await chromium.launch({
    executablePath:'/usr/bin/google-chrome',
    headless:true,
    args:['--no-sandbox','--enable-webgl','--enable-unsafe-swiftshader','--use-angle=swiftshader']
   });
   const page=await browser.newPage({viewport:{width:412,height:915},deviceScaleFactor:1,hasTouch:true,isMobile:true});
   const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   const port=server.address().port;
   await page.goto('http://127.0.0.1:'+port+'/#backrooms',{waitUntil:'domcontentloaded',timeout:30000});
   const result=await page.evaluate(()=>({maps:document.querySelector('#arena').options.length,characters:document.querySelector('#character').options.length}));
   if(result.maps!==12||result.characters<50)throw new Error('Menus did not populate: '+JSON.stringify(result));
   await page.waitForFunction(()=>{
     const s=document.querySelector('#status')?.textContent||'';
     return s.startsWith('Ready')||s.startsWith('ERROR')||!document.querySelector('#error').hidden;
   },null,{timeout:90000});
   const status=await page.locator('#status').textContent();
   const err=await page.locator('#errorText').textContent();
   await page.screenshot({path:'/tmp/jobby-maps-mobile-smoke.png'});
   console.log(JSON.stringify({status,err,errors,menus:result,screenshot:'/tmp/jobby-maps-mobile-smoke.png'}));
   if(!status.startsWith('Ready'))throw new Error('3D startup failed: '+status+' / '+err);
   if(errors.length)throw new Error('Browser console errors: '+errors.join(' | '));
 }finally{if(browser)await browser.close();server.close();}
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});