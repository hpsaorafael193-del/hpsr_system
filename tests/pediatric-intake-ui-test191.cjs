const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { createRoot } = require("react-dom/client");
const { renderToStaticMarkup } = require("react-dom/server");
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
  "@/lib/followup-birth-options": load("src/lib/followup-birth-options.ts"),
  "./followup-intake.module.css": {default: {answerChoices:"choices",answerSection:"answer-section"}},
  "@/lib/pediatric-intake-form": load("src/lib/pediatric-intake-form.ts"),
};
modules["@/lib/followup-intake-questions"] = load("src/lib/followup-intake-questions.ts", modules);
const { FollowupIntakeAnswers } = load("src/components/dashboard/FollowupIntakeAnswers.tsx", modules);
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

function renderAnswers(formType, answers) {
  const markup = renderToStaticMarkup(React.createElement(FollowupIntakeAnswers, {formType, answers}));
  return JSDOM.fragment(markup);
}

const gestation = renderAnswers("gestational", {
  observations: "Primeira linha\nSegunda linha",
  birthType: "Cesárea hospitalar",
  pregnancyStarted: "Sim",
  symptoms: ["Enjoos", "Azia"],
  name: "Paciente teste",
  oldField: "Resposta antiga",
});
assert.deepEqual([...gestation.querySelectorAll("h5")].map(h=>h.textContent), [
  "Identificação no RP", "Dados da gestação", "Planejamento da gestação", "Planejamento do parto", "Pós-parto", "Respostas de versões anteriores",
]);
assert.deepEqual([...gestation.querySelectorAll("dt")].map(dt=>dt.textContent), [
  "Nome", "A gestação já iniciou no RP?", "Sintomas que deseja interpretar durante a gestação",
  "Tipo de parto desejado", "Observações, ideias, dúvidas ou pedidos específicos", "Resposta adicional 1",
]);
assert.deepEqual([...gestation.querySelectorAll(".choices li")].map(li=>li.textContent), ["Enjoos", "Azia"]);
assert(gestation.textContent.includes("Primeira linha\nSegunda linha"));
assert(gestation.textContent.includes("Resposta antiga"));
assert(!gestation.textContent.includes("oldField"));
assert(renderAnswers("ivf_ropa", {geneticRh:"Positivo"}).textContent.includes("Fator Rh"));
assert(renderAnswers("pediatric", {childPassport:"643"}).textContent.includes("Passaporte da criança"));
assert(renderAnswers("gestational", {}).textContent.includes("ainda não enviou respostas"));
console.log("PASS leitura de fichas: títulos e perguntas em português, ordem original, respostas longas, seleção múltipla e dados antigos");
