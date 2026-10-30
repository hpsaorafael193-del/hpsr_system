const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),postcss=require('postcss');
const provider=fs.readFileSync('src/components/theme/ThemeProvider.tsx','utf8');
const bootstrap=provider.match(/themeBootstrap = `([^`]+)`/)[1];
for(const value of ['dark','light',null,'invalid']) {const document={documentElement:{dataset:{}}};vm.runInNewContext(bootstrap,{document,window:{location:{pathname:'/dashboard'}},localStorage:{getItem:()=>value}});assert.equal(document.documentElement.dataset.theme,value==='dark'?'dark':'light');}
const document={documentElement:{dataset:{}}};vm.runInNewContext(bootstrap,{document,window:{location:{pathname:'/dashboard'}},localStorage:{getItem(){throw Error('blocked')}}});assert.equal(document.documentElement.dataset.theme,'light');
const css=postcss.parse(fs.readFileSync('src/app/dark-generated.css','utf8'));let count=0;
css.walkRules(r=>{assert(r.selector.includes('data-theme="dark"'));assert(r.selector.includes('data-hpsr-document')||r.selector==='html[data-theme="dark"]');r.walkDecls(d=>assert(/color|background|shadow|fill|stroke|^--/.test(d.prop),`Layout changed: ${d.prop}`));count++;});assert(count>100);
const menu=fs.readFileSync('src/components/layout/UserMenu.tsx','utf8');assert(menu.includes('role="menuitemcheckbox"'));assert(menu.includes('onClick={toggleTheme}'));
assert.equal(JSON.parse(fs.readFileSync('package.json')).version,'1.1.16-test.175');
console.log(`PASS: startup preference, denied storage, ${count} scoped color-only rules, sheet exclusion, menu toggle, version 144.`);
const {transform}=require('../scripts/generate-dark-theme.cjs');
assert.match(transform('linear-gradient(110deg,#612d1c,#482016)','background'),/^linear-gradient/);
assert.equal(transform('linear-gradient(to right,var(--tw-gradient-stops))','background-image'),'linear-gradient(to right,var(--tw-gradient-stops))');
assert.equal(transform('#34d399','border-color'),'#34d399');
assert.equal(transform('#fbbf24','border-color'),'#fbbf24');
assert.equal(transform('#ef4444','border-color'),'#ef4444');
for(const file of ['src/components/dashboard/PharmaGuideClient.module.css','src/components/dashboard/time-clock-report.module.css','src/app/dashboard/relatorios/overview.module.css']) {
 const source=fs.readFileSync(file,'utf8');assert(source.includes('HPSR DARK MODULE PALETTE'));assert(source.includes(':global(html[data-theme="dark"])'));}
const themeCSS=fs.readFileSync('src/app/theme.css','utf8');assert(themeCSS.includes('[data-hpsr-notification-dot="true"] { background:#ef4444'));
assert(fs.readFileSync('src/app/dashboard/traumatologia/page.tsx','utf8').includes('data-cast-status={statusKey}'));
console.log('PASS: gradient structure preserved, original semantic borders, reports and pharmacy module coverage, red notification dot.');

assert(fs.readFileSync('src/app/dashboard/page.tsx','utf8').includes('data-hpsr-home-overlay="true"'));
assert(fs.readFileSync('src/components/layout/Sidebar.tsx','utf8').includes('data-hpsr-sidebar="true"'));
assert(themeCSS.includes('rgba(103,38,20,.66)'));
assert(themeCSS.includes('linear-gradient(180deg,#612314'));
console.log('PASS: hospital image gradient and warm navigation restored by explicit scopes.');

assert(!themeCSS.includes('button:not(:where(.hpsr-render-page *,[data-hpsr-document] *)) { border-color:#9d7e67; }'));
const preserved=transform('radial-gradient(circle,rgba(255,255,255,0.12),transparent)','background');
assert(preserved.includes('radial-gradient'));assert(preserved.includes('0.12'));assert(preserved.includes('transparent'));
assert.notEqual(transform('#612d1c','background'),transform('#260600','background'));
console.log('PASS: decorative gradients, transparency and depth retained; extra button outlines removed.');

assert(themeCSS.includes('#612314 0%,#43120b 54%,#250700 100%'));
assert(themeCSS.includes('.hpsr-dark-section-header'));
assert(themeCSS.includes('linear-gradient(110deg,#672614 0%,#48160c 65%,#2a0700 100%)'));
assert(!themeCSS.includes('#59301e'));
console.log('PASS: original institutional wine restored in navigation and branded headers.');

for(const pathname of ['/','/login','/paciente','/paciente/documentos','/dashboard-login','/dashboardexterno','/trabalhe-conosco']) {
 const document={documentElement:{dataset:{}}};vm.runInNewContext(bootstrap,{document,window:{location:{pathname}},localStorage:{getItem:()=> 'dark'}});assert.equal(document.documentElement.dataset.theme,'light',pathname);
}
for(const pathname of ['/dashboard','/dashboard/','/dashboard/perfil','/dashboard/exames']) {
 const document={documentElement:{dataset:{}}};vm.runInNewContext(bootstrap,{document,window:{location:{pathname}},localStorage:{getItem:()=> 'dark'}});assert.equal(document.documentElement.dataset.theme,'dark',pathname);
}
console.log('PASS: saved dark preference is applied only to exact dashboard routes; public and patient routes stay light.');

assert.equal(transform('0 0 24px rgba(239,68,68,0.4)','box-shadow'),'0 0 24px rgb(239 68 68 / 0.4)');
assert.equal(transform('0 0 16px #10b98180','--tw-shadow'),'0 0 16px #10b98180');
assert.equal(transform('#ef4444','background-color'),'#481d25');
assert.equal(transform('#fbbf24','color'),'#fcd34d');
assert(fs.readFileSync('src/app/dashboard/gestao-de-leitos/page.tsx','utf8').includes('data-bed-status={bed.status}'));
console.log('PASS: red and amber statuses, original colored glow and explicit bed status hooks.');
