const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const { NextRequest, NextResponse } = require('next/server');
const source = ts.transpileModule(fs.readFileSync('src/middleware.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
let closed = false, failed = false;
const exportsObject = {};
vm.runInNewContext(source,{
  exports:exportsObject,
  require(id) {
    if(id==='next/server') return {NextResponse};
    if(id==='@/lib/closure-status') return {readClosureStatus:async()=>{if(failed) throw Error('network'); return closed;}};
    if(id==='@/lib/hospital-closure') return {CLOSURE_MESSAGE:'encerramento'};
    throw Error(id);
  }
});
const call=(route,method)=>exportsObject.middleware(new NextRequest('https://hpsr.example/api/'+route,{method}));
(async()=>{
  assert.equal((await call('paciente/agendar','POST')).headers.get('x-middleware-next'),'1');
  closed=true;
  for(const [route,method] of [
    ['agendar','POST'],['exames-solicitacoes','POST'],['fichas-acompanhamento','POST'],
    ['reservar-horario','POST'],['consultas','PATCH'],['cadastrar','POST'],['dependentes','POST'],['perfil','PATCH'],
  ]) assert.equal((await call('paciente/'+route,method)).status,403,route);
  for(const [route,method] of [
    ['registros','GET'],['sessao','GET'],['estabelecer-sessao','POST'],
    ['alterar-senha','POST'],['recuperar-sem-email','POST'],['sair','POST'],
  ]) assert.equal((await call('paciente/'+route,method)).headers.get('x-middleware-next'),'1',route);
  failed=true;
  assert.equal((await call('paciente/agendar','POST')).status,503);
  assert.equal((await call('paciente/registros','GET')).headers.get('x-middleware-next'),'1');
  console.log('PASS archive middleware: reads and account access survive; writes fail closed');
})().catch(error=>{console.error(error);process.exitCode=1;});
