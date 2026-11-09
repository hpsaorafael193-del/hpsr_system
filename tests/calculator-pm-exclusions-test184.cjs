const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('src/app/dashboard/calculadora/page.tsx','utf8');
const array=name=>source.match(new RegExp('const '+name+': Product\\[\\] = (\\[[\\s\\S]*?\\n\\]);'))[1];
const pricing=fs.readFileSync('src/data/service-pricing.ts','utf8').match(/export const servicePricing = (\{[\s\S]*?\}) as const/)[1];
const products=vm.runInNewContext(`const servicePricing=${pricing}; [...${array('medicamentos')},...${array('procedimentos')}]`);
const calculation=source.slice(source.indexOf('  const selectedConvenio ='),source.indexOf('\n  function updateQuantity')).replace(/: Product/g,'');
function calculate(isPmSale,convenio,cart){return vm.runInNewContext(calculation+';({selectedItems,total,tabletHpTotal,doctorTotal})',{isPmSale,convenio,cart,allProducts:products,convenioOptions:[{id:'sem',discount:0},{id:'plano',discount:.2},{id:'parceria',discount:.15}],tabletHpProductIds:new Set(['p2','p3','p4','p8']),useMemo:fn=>fn()});}
const cart=Object.fromEntries(products.map(p=>[p.id,1]));
const civil=calculate(false,'sem',cart),pm=calculate(true,'sem',cart);
const excluded=new Set(['p1','p10','p6','p12','p8','p11','p13','p14','p15']);assert.equal(products.length,22);
for(const item of pm.selectedItems){const original=civil.selectedItems.find(i=>i.product.id===item.product.id);assert.equal(item.unitPrice,excluded.has(item.product.id)?original.unitPrice:Math.round(original.unitPrice*.9),item.product.nome);}
const transport=calculate(true,'sem',{p1:2,p10:1});assert.equal(transport.total,740000);assert.equal(transport.doctorTotal,740000);assert.equal(transport.tabletHpTotal,0);
assert.equal(transport.selectedItems.find(i=>i.product.id==='p1').unitPrice,180000);assert.equal(transport.selectedItems.find(i=>i.product.id==='p10').unitPrice,380000);
for(const convenio of ['plano','parceria']){assert.equal(calculate(true,convenio,cart).total,calculate(false,convenio,cart).total);assert.equal(calculate(true,convenio,{p1:2,p10:1}).total,740000);}
assert.equal(calculate(true,'sem',{m0:2,p4:1,p6:1}).total,3236000,'existing mixed receipt total');
const procedures=calculate(true,'sem',{p2:1,p8:1,p11:1});assert.equal(procedures.total,29432000);assert.equal(procedures.tabletHpTotal,4432000);assert.equal(procedures.doctorTotal,25000000);
for (const convenio of ['sem','plano','parceria']) {
  for (const pm of [false,true]) {
    const psych = calculate(pm,convenio,{p12:2});
    assert.equal(psych.total,8000000);
    assert.equal(psych.tabletHpTotal,3000000);
    assert.equal(psych.doctorTotal,5000000);
  }
}
const mixed = calculate(true,'plano',{p12:1,p2:1,m0:1});
assert.equal(mixed.total,4568000);
assert.equal(mixed.tabletHpTotal,1884000);
assert.equal(mixed.doctorTotal,2684000);
for (const [id, price] of [['p13',25000000],['p14',30000000],['p15',32000000]]) {
  for (const convenio of ['sem','plano','parceria']) {
    for (const pm of [false,true]) {
      const birth = calculate(pm,convenio,{[id]:2});
      assert.equal(birth.total,price*2);
      assert.equal(birth.tabletHpTotal,(price-2500000)*2);
      assert.equal(birth.doctorTotal,5000000);
    }
  }
}
const birthAndExam = calculate(true,'sem',{p13:1,p14:1,p15:1,p4:1});
assert.equal(birthAndExam.total,87342000);
assert.equal(birthAndExam.tabletHpTotal,79842000);
assert.equal(birthAndExam.doctorTotal,7500000);
console.log('PASS actual calculator: 22 prices; PM eligibility; fixed psychotechnical split; noncumulative plan and partnership');
