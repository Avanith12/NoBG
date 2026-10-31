// PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs node src/inference/validation/browser.mjs /path/to/photo.png
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome', headless: true, args: ['--no-sandbox', ...(process.env.TEST_WEBGPU ? ['--enable-unsafe-webgpu', '--use-angle=vulkan', '--enable-features=Vulkan'] : ['--disable-gpu'])] })
console.log('Browser', browser.version())
const context = await browser.newContext()
const page = await context.newPage()
const requests = []
context.on('request', r => { requests.push({ method: r.method(), url: r.url(), body: r.postData() }); assert.equal(r.method(), 'GET'); assert.equal(r.postData(), null) })
page.on('console', async msg => console.log('console', ...(await Promise.all(msg.args().map(a=>a.jsonValue())))))
page.on('pageerror', err => console.log('pageerror', String(err)))
const url = (process.env.HARNESS_ORIGIN || 'http://127.0.0.1:5173') + '/src/inference/validation/harness.html'
await page.goto(url)
console.log('GPU adapter', await page.evaluate(async()=> { const a=await navigator.gpu?.requestAdapter(); return a ? {vendor:a.info.vendor,architecture:a.info.architecture,device:a.info.device,description:a.info.description} : null }))
const errors = await page.evaluate(async () => {
 const errors = []
 for (const f of [new File([], 'empty.png', {type:'image/png'}),new File(['x'],'x.gif',{type:'image/gif'}),new File(['broken'],'x.png',{type:'image/png'})]) {
  try { await window.removeBackground(f); errors.push('UNEXPECTED SUCCESS') } catch(e) { errors.push(e.message) }
 }
 return errors
}); console.log('Errors',errors); assert.ok(errors[0].includes('empty')); assert.ok(errors[1].includes('Unsupported')); assert.ok(errors[2].includes('decoded'));
await context.route('https://huggingface.co/**', route=>route.abort());
await page.locator('#file').setInputFiles(process.argv[2]);
const downloadError = await page.evaluate(async()=> { try { await window.removeBackground(document.querySelector('#file').files[0]); return 'FAILED' } catch(e) { return e.message } });
console.log('Download error',downloadError); assert.ok(downloadError.includes('could not be downloaded'));
await context.unrouteAll(); await page.reload();
for(let run=0;run<2;run++) {
 if(run) { await context.route('https://huggingface.co/**', route=>route.abort()); await context.route('https://*.hf.co/**', route=>route.abort()); await page.reload() }
 await page.locator('#file').setInputFiles(process.argv[2])
 await page.locator('#run').click()
 await page.waitForFunction(() => document.querySelector('#log').textContent.length > 0, {timeout:300000})
 const stats = await page.locator('#log').textContent(); console.log('run',run,stats)
 assert.ok(!stats.startsWith('Error'))
 const result=JSON.parse(stats); assert.equal(result.maskLength,result.width*result.height); assert.equal(result.min,0); assert.equal(result.max,255)
 await page.locator('#preview').screenshot({path:`/tmp/nobg-mask-${run}.png`})
}
const formats = await page.evaluate(async () => {
 const photo=await createImageBitmap(document.querySelector('#file').files[0]);
 const canvas=document.createElement('canvas'); canvas.width=384; canvas.height=256;
 canvas.getContext('2d').drawImage(photo,0,0,384,256); photo.close();
 const results=[];
 for(const type of ['image/jpeg','image/webp']) {
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,type));
  const result=await window.removeBackground(new File([blob],'photo',{type}));
  results.push({type,width:result.width,height:result.height,length:result.mask.length});
 }
 return results;
}); console.log('Formats',formats); for (const f of formats) { assert.equal(f.width,384); assert.equal(f.height,256); assert.equal(f.length,384*256) }
const abortName = await page.evaluate(async () => {
 const controller = new AbortController(); const file=document.querySelector('#file').files[0];
 const pending=window.removeBackground(file,controller.signal); setTimeout(()=>controller.abort(),10);
 try { await pending; return 'FAILED' } catch(e) { return e.name }
}); console.log('Abort',abortName); assert.equal(abortName,'AbortError');
console.log('Abort recovery', await page.evaluate(async()=> { const r=await window.removeBackground(document.querySelector('#file').files[0]); return {width:r.width,height:r.height,length:r.mask.length} }));
console.log('Cache', await page.evaluate(async()=>Promise.all((await caches.keys()).map(async key=>({key,urls:(await (await caches.open(key)).keys()).map(x=>x.url)})))))
console.log('Requests', JSON.stringify(requests.map(r=>({...r,url:r.url.split('?')[0]})))); await browser.close()
