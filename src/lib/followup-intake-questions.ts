import { pediatricIntakeSections, type FollowupFormType, type IntakeSection } from "@/lib/pediatric-intake-form";

const gestationalSections: IntakeSection[] = [
  { title: "Identificação no RP", questions: [
    { key:"name", label:"Nome" }, { key:"passport", label:"Passaporte" }, { key:"age", label:"Idade da personagem" }, { key:"contact", label:"Contato" },
    { key:"bloodType", label:"Tipo sanguíneo" }, { key:"weight", label:"Peso da mãe" },
    { key:"relationship", label:"Estado civil / relacionamento no RP", type:"single", options:["Solteira","Relacionamento estável","Casada"] },
    { key:"partnerName", label:"Nome do(a) parceiro(a) no RP" }, { key:"partnerPassport", label:"Passaporte do(a) parceiro(a)" },
  ]},
  { title: "Dados da gestação", questions: [
    { key:"pregnancyStarted", label:"A gestação já iniciou no RP?", type:"yesno" },
    { key:"currentPregnancyTime", label:"Tempo atual de gestação (semanas ou meses)", showIf:["pregnancyStarted","Sim"] },
    { key:"pregnancyType", label:"Tipo de gestação", type:"single", options:["Única","Gemelar"] },
    { key:"babySex", label:"Sexo do bebê", type:"single", options:["Menino","Menina"] },
    { key:"babyName", label:"Nome do bebê (se já definido)" }, { key:"dueDate", label:"Data prevista para o parto" },
    { key:"plannedPregnancy", label:"A gestação foi", type:"single", options:["Planejada","Não planejada"] },
  ]},
  { title: "Histórico obstétrico", questions: [
    { key:"firstPregnancy", label:"Esta é a primeira gestação da personagem?", type:"yesno" },
    { key:"previousPregnancies", label:"Quantas gestações anteriores?", showIf:["firstPregnancy","Não"] },
    { key:"previousEvents", label:"Já ocorreu no RP", type:"multi", options:["Aborto","Parto prematuro","Complicações na gestação","Nenhuma ocorrência"] },
    { key:"previousEventsDetails", label:"Explique brevemente, se necessário", type:"textarea" },
  ]},
  { title: "Planejamento da gestação", questions: [
    { key:"prenatalHpsr", label:"Pretende realizar acompanhamento pré-natal no Hospital São Rafael?", type:"yesno" },
    { key:"includeComplications", label:"Deseja incluir complicações na gestação?", type:"yesno" },
    { key:"complications", label:"Se sim, quais?", type:"textarea", hint:"Ex.: pressão alta gestacional, sangramento, diabetes gestacional, descolamento de placenta.", showIf:["includeComplications","Sim"] },
    { key:"symptoms", label:"Sintomas que deseja interpretar durante a gestação", type:"multi", options:["Enjoos","Azia","Dor lombar","Inchaço","Contrações de treinamento","Cansaço excessivo"] },
  ]},
  { title: "Planejamento do parto", questions: [
    { key:"birthType", label:"Tipo de parto desejado", type:"single", options:["Normal hospitalar","Cesárea hospitalar","Humanizado (Jacuzzi)"], hint:"Partos normal, cesárea e humanizado são realizados no Hospital São Rafael." },
    { key:"birthStyle", label:"Estilo do parto no RP", type:"single", options:["Rápido (cenas resumidas)","Detalhado (procedimento médico completo)"] },
    { key:"birthCompanion", label:"Quem estará presente no parto?", hint:"Apenas um acompanhante dentro da sala." },
    { key:"birthComplications", label:"Deseja incluir intercorrências no parto?", type:"yesno" },
    { key:"birthComplicationsDetails", label:"Se sim, quais?", type:"textarea", hint:"Ex.: cordão umbilical enrolado, sofrimento fetal, trabalho de parto prolongado, hemorragia pós-parto.", showIf:["birthComplications","Sim"] },
  ]},
  { title: "Pós-parto", questions: [
    { key:"breastfeeding", label:"Deseja incluir amamentação no RP?", type:"yesno" },
    { key:"pediatricFollowup", label:"Deseja acompanhamento pediátrico para o bebê?", type:"yesno" },
    { key:"postpartumGynecology", label:"Deseja consulta ginecológica pós-parto?", type:"yesno" },
    { key:"observations", label:"Observações, ideias, dúvidas ou pedidos específicos", type:"textarea" },
  ]},
];

const ivfSections: IntakeSection[] = [
  { title:"Mãe genética — doadora do óvulo", questions:[
    {key:"geneticName",label:"Nome"},{key:"geneticPassport",label:"Passaporte"},{key:"geneticAge",label:"Idade da personagem"},{key:"geneticContact",label:"Contato na cidade"},{key:"geneticRh",label:"Fator Rh"},
    {key:"geneticChildren",label:"Possui filhos no RP?",type:"yesno"},{key:"geneticCondition",label:"Possui condição médica relevante no RP?",type:"yesno"},{key:"geneticConditionDetails",label:"Se sim, qual?",showIf:["geneticCondition","Sim"]},{key:"previousFertility",label:"Já realizou tratamento de fertilidade antes no RP?",type:"yesno"},
  ]},
  { title:"Mãe gestante", questions:[
    {key:"gestationalName",label:"Nome"},{key:"gestationalPassport",label:"Passaporte"},{key:"gestationalAge",label:"Idade da personagem"},{key:"gestationalContact",label:"Contato na cidade"},{key:"gestationalRh",label:"Fator Rh"},
    {key:"priorPregnancy",label:"Já teve alguma gestação no RP?",type:"yesno"},{key:"priorPregnancyCount",label:"Quantas gestações?",showIf:["priorPregnancy","Sim"]},
  ]},
  { title:"Informações do casal", questions:[
    {key:"relationshipDuration",label:"Há quanto tempo as personagens estão juntas no RP?"},{key:"fullFivHpsr",label:"Pretendem realizar todo o processo de FIV com acompanhamento médico do Hospital São Rafael?",type:"yesno"},
  ]},
  { title:"Planejamento da gestação", questions:[
    {key:"pregnancyType",label:"A gestação será",type:"single",options:["Única","Gemelar (gêmeos)"]},{key:"prenatalHpsr",label:"Pretendem realizar acompanhamento pré-natal completo no Hospital São Rafael?",type:"yesno"},
  ]},
  { title:"Acordos sobre o procedimento no RP", questions:[
    {key:"storyAgreement",label:"Ambas estão de acordo com o enredo e com o vínculo emocional que isso pode gerar no RP?",type:"yesno"},
    {key:"sceneStyle",label:"Como preferem que as cenas médicas sejam?",type:"single",options:["Realistas e detalhadas","Resumidas (comandos básicos)"]},
    {key:"humanDialogue",label:"Desejam incluir emoção e diálogo humano nas consultas?",type:"yesno"},
    {key:"sensitiveLimits",label:"Alguma das partes possui limite de exposição corporal ou descrição sensível?",type:"yesno"},
    {key:"sensitiveLimitsDetails",label:"Se sim, qual limite?",type:"textarea",hint:"Ex.: exame transvaginal, coleta de material, punção ovariana.",showIf:["sensitiveLimits","Sim"]},
  ]},
  { title:"Desenvolvimento da história", questions:[
    {key:"embryoResult",label:"Resultado desejado da transferência embrionária",type:"single",options:["Beta-HCG positivo (gravidez confirmada)","Beta-HCG negativo"]},
    {key:"storyTone",label:"Preferem que o RP tenha",type:"single",options:["História leve","História emocional"]},
    {key:"narrativeElements",label:"Desejam incluir algum elemento narrativo no RP?",type:"yesno"},
    {key:"narrativeElementsDetails",label:"Quais elementos?",type:"textarea",hint:"Ex.: ansiedade, preparação do quarto, revelação da gravidez, apoio familiar.",showIf:["narrativeElements","Sim"]},
    {key:"negativeResultPlan",label:"Caso o Beta-HCG seja negativo, pretendem",type:"single",options:["Repetir o processo de FIV no RP","Encerrar a história","Decidir posteriormente"]},
  ]},
  { title:"Compromisso com o RP", questions:[
    {key:"commitment",label:"Declaro que compreendo que o processo de FIV no RP exige planejamento prévio, respeito ao RP médico e desenvolvimento gradual da história.",type:"single",options:["Estou de acordo"]},
    {key:"observations",label:"Observações, dúvidas, ideias de RP e detalhes importantes",type:"textarea"},
  ]},
];

export const followupIntakeSections: Record<FollowupFormType, IntakeSection[]> = {
  gestational: gestationalSections,
  ivf_ropa: ivfSections,
  pediatric: pediatricIntakeSections,
};
