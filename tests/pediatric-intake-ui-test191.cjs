const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { createRoot } = require("react-dom/client");
const { createPortal } = require("react-dom");
const { JSDOM } = require("jsdom");
const { act } = React;
const dom = new JSDOM('<div id="root"></div>');
global.window = dom.window;
global.document = dom.window.document;
global.IS_REACT_ACT_ENVIRONMENT = true;

function load(path, modules = {}) {
  const exports = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(path, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React },
  }).outputText, {
    exports, React, Date, document, window, fetch,
    require(name) {
      if (name in modules) return modules[name];
      throw new Error(name);
    },
  });
  return exports;
}

const row = { id: "one", patient_passport: "643", form_type: "pediatric", status: "requested", answers: {}, requested_at: new Date().toISOString() };
const writes = [];
async function fetch(_, init) {
  if (init?.method === "POST") {
    const data = JSON.parse(init.body);
    writes.push(data);
    row.answers = data.answers;
    row.status = data.submit ? "submitted" : "draft";
    return {ok:true, json:async()=>({ok:true})};
  }
  return {ok:true, json:async()=>({forms:[row]})};
}
const modules = {
  react: React, "react-dom": { createPortal },
  "lucide-react": new Proxy({}, {get:()=>()=>null}),
  "@/lib/manual-data-refresh": {useManualRefresh:()=>{}, useLocalRefreshControl:()=>{}},
  "@/lib/followup-birth-options": {formatFollowupBirthType:v=>v},
  "@/lib/pediatric-intake-form": load("src/lib/pediatric-intake-form.ts"),
};
const { PatientFollowupFormsPanel } = load("src/components/public/PatientFollowupFormsPanel.tsx", modules);
const button = (label, container = document) => [...container.querySelectorAll("button")].find(b=>b.textContent.trim()===label);
const section = title => [...document.querySelectorAll("h4")].find(h=>h.textContent===title).closest("section");

(async()=>{
  const root = createRoot(document.getElementById("root"));
  await act(async()=>root.render(React.createElement(PatientFollowupFormsPanel,{passport:"643",onSessionExpired:()=>assert.fail("expired")})));
  const openCard = [...document.querySelectorAll("article button")].find(b=>b.textContent.includes("Acompanhamento pediátrico"));
  assert(openCard);
  await act(async()=>openCard.click());
  assert.equal(document.querySelector("h3.text-lg").textContent.includes("pediátrico") || document.body.textContent.includes("Este formulário é utilizado fora do RP"),true);
  const birth = section("Histórico de nascimento");
  assert(!birth.textContent.includes("Qual foi a complicação"));
  await act(async()=>button("Sim",birth).click());
  assert(birth.textContent.includes("Qual foi a complicação"));
  const child = section("Informações da criança");
  assert.equal(child.querySelector("input[readonly]").value,"643");
  assert(child.querySelector('input[type="date"]'));
  const availability = section("Disponibilidade para consultas");
  await act(async()=>button("Manhã",availability).click());
  await act(async()=>button("Tarde",availability).click());
  await act(async()=>button("Salvar e continuar depois").click());
  assert.deepEqual(writes[0].answers.availability,["Manhã","Tarde"]);
  assert.equal(writes[0].submit,false);
  await act(async()=>button("Estou de acordo").click());
  await act(async()=>button("Enviar ao médico").click());
  assert.equal(writes[1].answers.commitment,"Estou de acordo");
  assert.equal(writes[1].submit,true);
  assert(!button("Enviar ao médico"));
  await act(async()=>[...document.querySelectorAll("article button")][0].click());
  assert(document.body.textContent.includes("somente para consulta"));
  assert(button("Estou de acordo").disabled);
  await act(async()=>root.unmount());
  dom.window.close();
  console.log("PASS React pediatric form: exact sections, conditional detail, availability, draft, submission, read-only response");
})().catch(error=>{console.error(error);process.exitCode=1;});
