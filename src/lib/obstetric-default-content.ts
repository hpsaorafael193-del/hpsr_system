/** Textos iniciais do RP, inspirados nos modelos oficiais enviados pelo hospital.
 * São sugestões EDITÁVEIS; não substituem o julgamento clínico do médico.
 * Preencher somente campos vazios no editor; nunca alterar publicações ou texto existente.
 */
import type { PlanningKind } from "@/lib/obstetric-planning";

export const DEFAULT_GESTATIONAL_CONTENT = [
  "Confirmação da gestação, cálculo da DPP e abertura do cartão gestacional.\nHemograma completo; tipagem sanguínea; fator Rh; urina tipo I; sorologias: HIV, sífilis, hepatite B e C e toxoplasmose.\nVACINAS: NENHUMA.",
  "Avaliação inicial do crescimento fetal e atualização vacinal.\nResultados da 1ª consulta; avaliação inicial do crescimento fetal e atualização vacinal; ultrassom obstétrico (1º trimestre).\nVACINAS: Hepatite B (1ª dose).",
  "Avaliação anatômica fetal, escuta dos batimentos e análise uterina.\nUltrassom morfológico.\nVACINAS: Influenza e Hepatite B (2ª dose).",
  "Rastreamento de diabetes gestacional e acompanhamento materno.\nUltrassom morfológico e vacinas anteriores; glicemia de jejum; urina tipo I; urocultura.\nVACINAS: NENHUMA.",
  "Avaliação do crescimento fetal, movimentação e possível reforço de ferro.\nResultados de glicemia e urina; sorologias (repetição); teste de Coombs indireto (se Rh negativo); urina tipo I.\nVACINAS: NENHUMA.",
  "Avaliação do líquido amniótico e bem-estar fetal.\nResultados da 5ª consulta; ultrassom obstétrico (3º trimestre).\nVACINAS: Hepatite B (3ª dose).",
  "Planejamento do parto e orientação sobre sinais de alerta.\nUltrassom do 3º trimestre; cardiotocografia.\nVACINAS: dTpa (tríplice bacteriana).",
  "Definição de via de parto e preparo para internação.\nExames para levar: cardiotocografia, hemograma final e glicemia.\nVACINAS: NENHUMA.",
  "Avaliação final, liberação hospitalar e condução do parto.\nTodos os exames anteriores; exames adicionais: teste de Coombs indireto (se Rh negativo); urina tipo I na admissão para internação; parto.\nVACINAS: NENHUMA.",
] as const;

export const DEFAULT_IVF_CONTENT = [
  "Avaliação inicial e início hormonal.\nAvaliação clínica da paciente gestante; ultrassonografia transvaginal basal; exames laboratoriais hormonais e sorológicos; definição do protocolo rápido de FIV.\nOrientação para autoaplicação subcutânea; 1ª injeção diária de cada.\nINJEÇÃO: Gonal-F / Puregon (FSH) - Menopur.",
  "Monitoramento e bloqueio ovulatório.\nUltrassonografia para contagem e crescimento folicular; exames hormonais (estradiol e LH).\nMudar dosagem; bloqueio da ovulação precoce.\nINJEÇÃO: Gonal-F / Puregon - Menopur - Cetrotide / Orgalutran.",
  "Gatilho e punção folicular.\nPunção folicular transvaginal; sedação leve; coleta dos óvulos; fertilização em laboratório (ICSI).\nObservação hospitalar breve; início do preparo uterino.\nINJEÇÃO: Ovidrel (hCG) - aplicada 36h antes.",
  "Preparo uterino e transferência embrionária.\nAvaliação do endométrio por ultrassom; transferência embrionária guiada.\n1 aplicação diária e suporte endometrial; repouso relativo por 48h.\nINJEÇÃO: Progesterona - Estradiol.",
  "Exame BETA-HCG e confirmação.\nExame de sangue BETA-HCG.\nConfirmação da gestação (após 1h), conforme resultado do exame.\nINJEÇÃO: NENHUM.",
] as const;

export function defaultPlanningContent(kind: PlanningKind, index: number) {
  return (kind === "in_vitro" ? DEFAULT_IVF_CONTENT : DEFAULT_GESTATIONAL_CONTENT)[index] || "";
}
