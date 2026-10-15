import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);const ts=require('typescript');
function source(file){return ts.createSourceFile(file,readFileSync(file,'utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);}
function find(root,predicate){let match;function visit(node){if(predicate(node)){match=node;return;}if(!match)ts.forEachChild(node,visit);}visit(root);assert.ok(match,'expected source node');return match;}
function fn(file,name,context){const ast=source(file);const node=find(ast,n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);const code=ts.transpileModule(node.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;return vm.runInNewContext(`${code};${name}`,context);}
function setup(configured,approved=true){
 const events=[];const storage={removeItem:key=>events.push(['remove',key]),setItem:(key,value)=>events.push(['store',key,value]),getItem:()=>JSON.stringify({approved:true,systemRole:'Administrador do Sistema'})};
 const client={auth:{getSession:async()=>({data:{session:{user:{id:'real-user'}}}}),signInWithPassword:async()=>({data:{user:{id:'real-user'}},error:null}),signOut:async()=>events.push(['signOut'])},from:()=>({select(){return this;},eq(){return this;},maybeSingle:async()=>({data:{access_status:approved?'Aprovado':'Pendente'},error:null})})};
 return {events,client,context:{active:true,isSupabaseConfigured:()=>configured,supabaseConfigured:configured,createClient:()=>client,window:{localStorage:storage},localStorage:storage,router:{push:path=>events.push(['push',path]),replace:path=>events.push(['replace',path])},setState:value=>events.push(['state',value]),setAuthMessage:msg=>events.push(['message',msg]),setAuthLoading:()=>{},getAuthContext:()=> 'professional',hasValidLoginPersistence:()=>true,loginForm:{email:'real@example.test',password:'real-password'},onClose:()=>events.push(['close']),rememberEmail:true,setAuthContext:()=>{},setLoginPersistence:()=>{},fetch:async()=>({})}};
}
const login='src/components/public/LoginModal.tsx';const gate='src/components/auth/DashboardAccessGate.tsx';
let t=setup(false);
await fn(login,'handleLogin',t.context)({preventDefault(){}});
assert.ok(t.events.some(e=>e[0]==='message'&&e[1].includes('indisponível')));
assert.ok(!t.events.some(e=>['push','store','close'].includes(e[0])),'missing Supabase must not create sessions or navigate');
t=setup(false);await fn(gate,'validateAccess',t.context)();
assert.ok(t.events.some(e=>e[0]==='state'&&e[1]==='unavailable'),'forged legacy local admin must be rejected');
assert.ok(!t.events.some(e=>e[0]==='state'&&e[1]==='approved'));
t=setup(true);await fn(gate,'validateAccess',t.context)();assert.ok(t.events.some(e=>e[0]==='state'&&e[1]==='approved'),'real approved Supabase identity must still work');
t=setup(true,false);await fn(gate,'validateAccess',t.context)();assert.ok(!t.events.some(e=>e[0]==='state'&&e[1]==='approved'));assert.ok(t.events.some(e=>e[0]==='signOut'),'pending staff must be signed out');
t=setup(true);t.context.createClient=()=>null;await fn(gate,'validateAccess',t.context)();assert.ok(!t.events.some(e=>e[0]==='state'&&e[1]==='approved'));
t=setup(true);t.client.auth.getSession=async()=>({data:{session:null}});await fn(gate,'validateAccess',t.context)();assert.ok(t.events.some(e=>e[0]==='replace'&&e[1].includes('required')));
t=setup(true);await fn(login,'handleLogin',t.context)({preventDefault(){}});assert.ok(t.events.some(e=>e[0]==='push'&&e[1]==='/dashboard'));assert.ok(!t.events.some(e=>e[0]==='store'&&e[1]==='hpsr-local-auth-session'));
const provider=source('src/components/auth/CurrentUserProfileProvider.tsx');
const unavail=find(provider,n=>ts.isVariableDeclaration(n)&&n.name.getText(provider)==='unavailableProfile');
const expression=ts.transpileModule(`const value=${unavail.initializer.getText(provider)};value;`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;
const profile=vm.runInNewContext(expression,{localDevProfile:{id:'local-dev',systemRole:'Administrador do Sistema',accessLevel:'Total'}});
assert.equal(profile.id,'');assert.equal(profile.accessLevel,'Padrão');assert.equal(profile.systemRole,'Não autenticado');
const update=find(provider,n=>ts.isVariableDeclaration(n)&&n.name.getText(provider)==='updateProfile').initializer.arguments[0];
const updateFn=vm.runInNewContext(ts.transpileModule(`const run=${update.getText(provider)};run;`,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,{isSupabaseConfigured:()=>false,setProfile:()=>{throw Error('must not persist locally');}});
assert.equal((await updateFn({characterName:'fake'})).ok,false);
assert.equal(existsSync('src/lib/local-auth.ts'),false);
console.log('PASS no Supabase denies login/dashboard/local profile saves; forged legacy admin rejected; real approved login preserved; missing session and pending staff blocked');
