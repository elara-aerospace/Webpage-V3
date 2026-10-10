/* Read-only browser audit. HubSpot submissions are intercepted and simulated. */
const fs = require('fs');
const path = require('path');
const http = require('http');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const root = path.resolve('dist');
const types = {'.html':'text/html','.css':'text/css','.js':'application/javascript','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.mp4':'video/mp4'};
const server = http.createServer((req,res) => {
  const target = path.resolve(root, '.' + decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  const file = fs.existsSync(target) && fs.statSync(target).isDirectory() ? path.join(target,'index.html') : target;
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file)) {res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)] || 'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async () => {
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
  try {
    const page = await browser.newPage();
    await page.route('**/*',route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
    const errors=[];page.on('pageerror',error=>errors.push(`${page.url()}: ${error.message}`));
    const html=[];const walk=dir=>{for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const f=path.join(dir,entry.name);if(entry.isDirectory())walk(f);else if(f.endsWith('.html'))html.push(path.relative(root,f));}};walk(root);
    let formCount=0;
    for (const file of html) {
      await page.goto(origin+'/'+file,{waitUntil:'load'});
      const forms=await page.locator('form').evaluateAll(forms=>forms.map(form=>({id:form.id,valid:form.checkValidity(),submit:!!form.querySelector('[type=submit]')})));
      formCount+=forms.length;
      for(const form of forms){assert.equal(form.valid,false,`${file}: empty form must be invalid`);assert.ok(form.submit,`${file}: submit button missing`);}
    }
    assert.deepEqual(errors,[]);
    const testForm=async (file,selector,statusSelector) => {
      for(const result of ['success','failure','offline']) {
        await page.goto(origin+'/'+file,{waitUntil:'load'});
        let posts=[];
        await page.route('https://forms-eu1.hubspot.com/**',route=>{
          posts.push(route.request());
          if(result==='offline')return route.abort();
          return route.fulfill({status:result==='success'?204:400,body:result==='success'?'':'invalid form',headers:{'Access-Control-Allow-Origin':'*'}});
        });
        const form=page.locator(selector);
        await form.locator('input:not([type=checkbox]):not([type=radio]):not([type=hidden]):not([type=file]),textarea').evaluateAll(nodes=>nodes.forEach(node=>node.value=node.type==='email'?'audit@example.invalid':node.type==='number'?'18':node.type==='date'?'2026-11-01':'Audit test'));
        if(await form.locator('select').count())await form.locator('select').selectOption({index:1});
        for(const checkbox of await form.locator('input[type=checkbox][required]').all())await checkbox.check();
        const radioNames = await form.locator('input[type=radio]').evaluateAll(nodes=>[...new Set(nodes.map(n=>n.name))]);
        for(const name of radioNames)await form.locator(`input[type=radio][name="${name}"]`).first().check();
        if(await form.locator('input[type=file]').count())await form.locator('input[type=file]').setInputFiles({name:'audit-cv.pdf',mimeType:'application/pdf',buffer:Buffer.from('%PDF-1.4\n% Local audit fixture; never uploaded\n')});
        assert.ok(await form.evaluate(node=>node.checkValidity()));
        await form.locator('[type=submit]').click();
        const status=page.locator(statusSelector);
        await status.filter({hasText:result==='success'?/sent|subscribed|transmitted/i:/wrong|error/i}).waitFor();
        assert.equal(posts.length,1);
        assert.equal(posts[0].method(),'POST');
        if(selector==='#student-application-form') {
          assert.match(posts[0].headers()['content-type'],/^multipart\/form-data; boundary=/);
          assert.ok(posts[0].postData().includes('audit-cv.pdf'));
        } else {
          assert.equal(posts[0].headers()['content-type'],'application/x-www-form-urlencoded');
          assert.ok(posts[0].postData().includes('email=audit%40example.invalid'));
        }
        assert.equal(await form.locator('[type=submit]').isDisabled(),result==='success');
        await page.unroute('https://forms-eu1.hubspot.com/**');
      }
    };
    await testForm('contact.html','#hubspot-contact-form','#form-status');
    await testForm('payload.html','#payload-booking-form','#form-status');
    await testForm('index.html','[data-newsletter-form]','[data-newsletter-status]');
    await testForm('team.html','#student-application-form','#student-form-status');
    // Application remains the original custom multipart form, including CV uploads.
    await page.goto(origin+'/team.html');
    const application = page.locator('#student-application-form');
    assert.equal(await application.getAttribute('enctype'), 'multipart/form-data');
    assert.equal(await application.locator('input[type=file][name=cv]').count(), 1);
    assert.equal(await application.locator('input[name="LEGAL_CONSENT.processing"][required]').count(), 1);
    for(const width of [390,1440]) {
      await page.setViewportSize({width,height:1000});await page.goto(origin+'/index.html');
      assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Homepage overflows viewport');
      await page.locator('.landing-machining').screenshot({path:`/private/tmp/ea-machining-${width}.png`});
    }
    console.log(`Passed: ${html.length} pages, ${formCount} empty-form validation checks, 12 mocked submission scenarios, custom application upload/consent structure, mobile/desktop layout. No real form submissions.`);
  } finally {await browser.close();server.close();}
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
