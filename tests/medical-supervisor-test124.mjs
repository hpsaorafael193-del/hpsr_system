import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(file,imports={}){const code=ts.transpileModule(readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const box={exports:{},require:key=>imports[key]||{}};vm.runInNewContext(code,box);return box.exports;}
const specialties=load('src/lib/staff-specialties.ts');
assert.equal(specialties.specialtyForStaffRole('Médico Supervisor','Pediatra'),'Clínico Geral, Pediatra');
assert.equal(specialties.isFullAccessAdministrativeRole('Médico Supervisor'),false);
assert.deepEqual([...specialties.clinicalSpecialtyOptionsForStaffRole('Médico Supervisor','Clínico Geral',['Clínico Geral','Obstetra'])],['Clínico Geral']);
const ob=load('src/lib/obstetra-access.ts',{'@/lib/staff-specialties':specialties});
assert.equal(ob.canAccessObstetra('Médico Supervisor','Clínico Geral'),false);
assert.equal(ob.canAccessObstetra('Médico Supervisor','Obstetra'),true);
assert.equal(ob.canManageReproductivePlan('Médico Supervisor','Obstetra','in_vitro'),false);
const vaccine=load('src/lib/gestational-vaccination-access.ts',{'@/lib/staff-specialties':specialties});
assert.equal(vaccine.canManageGestationalVaccination('Médico Supervisor','Clínico Geral'),false);
assert.equal(vaccine.canManageGestationalVaccination('Médico Supervisor','Obstetra'),true);
const team=readFileSync('src/app/dashboard/direcao/page.tsx','utf8');const ast=ts.createSourceFile('team.tsx',team,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function extract(name){const node=ast.statements.find(n=>ts.isFunctionDeclaration(n)&&n.name?.text===name);assert.ok(node);return ts.transpileModule(node.getText(ast),{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText;}
const contract=vm.runInNewContext(`${extract('getContractInfo')};getContractInfo`,{daysSince:()=>45});
assert.equal(contract({hospitalRole:'Médico Supervisor',joinedAt:'2026-01-01'}),null);
assert.ok(contract({hospitalRole:'Médico Plantonista',joinedAt:'2026-01-01'}),'Plantonista must keep evaluation rules');
const perms=vm.runInNewContext(`${extract('getDefaultPermissions')};getDefaultPermissions`);
assert.ok(perms('Médico Supervisor').includes('Cadastro e gerenciamento de planos'));
assert.ok(!perms('Médico Supervisor').some(x=>x==='Gestão de equipe'||x==='Acesso total ao sistema'));
assert.ok(team.includes('Tempo de contrato')&&team.includes('daysSince(member.joinedAt)'));
console.log('PASS Supervisor keeps specialty boundaries, clinical access, plan permission and elapsed contract without evaluation; Plantonista unchanged; no general admin grant');
