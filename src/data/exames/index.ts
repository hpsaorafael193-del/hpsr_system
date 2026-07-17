import type { IntelligentExamModel } from "./types";
import { imgUltrassonografiaUnicaModel } from "./models/img_ultrassonografia_unica";
import { imgTomografiaUnicaModel } from "./models/img_tomografia_unica";
import { imgRessonanciaUnicaModel } from "./models/img_ressonancia_unica";
import { lab_beta_hcg_completoModel } from "./models/lab_beta_hcg_completo";
import { lab_hemograma_completoModel } from "./models/lab_hemograma_completo";
import { lab_teste_coombsModel } from "./models/lab_teste_coombs";
import { lab_sorologiaModel } from "./models/lab_sorologia";
import { lab_painel_alergiaModel } from "./models/lab_painel_alergia";
import { lab_glicemiaModel } from "./models/lab_glicemia";
import { lab_urina_analiseModel } from "./models/lab_urina_analise";
import { lab_feze_analiseModel } from "./models/lab_feze_analise";
import { lab_uroculturaModel } from "./models/lab_urocultura";
import { lab_anticorpos_irregularesModel } from "./models/lab_anticorpos_irregulares";
import { lab_funcao_renal_completaModel } from "./models/lab_funcao_renal_completa";
import { lab_funcao_hepatica_completaModel } from "./models/lab_funcao_hepatica_completa";
import { lab_eletrolitos_completosModel } from "./models/lab_eletrolitos_completos";
import { lab_hba1c_completaModel } from "./models/lab_hba1c_completa";
import { lab_dtpaModel } from "./models/lab_dtpa";
import { lab_painel_autoimuneModel } from "./models/lab_painel_autoimune";
import { lab_metabolismo_ferroModel } from "./models/lab_metabolismo_ferro";
import { lab_reticulocitosModel } from "./models/lab_reticulocitos";
import { lab_eletroforese_hemoglobinaModel } from "./models/lab_eletroforese_hemoglobina";
import { lab_gasometria_arterialModel } from "./models/lab_gasometria_arterial";
import { img_us_abdome_totalModel } from "./models/img_us_abdome_total";
import { img_us_pelvicaModel } from "./models/img_us_pelvica";
import { img_us_doppler_vascularModel } from "./models/img_us_doppler_vascular";
import { img_tc_cranioModel } from "./models/img_tc_cranio";
import { img_tc_toraxModel } from "./models/img_tc_torax";
import { img_tc_abdome_pelveModel } from "./models/img_tc_abdome_pelve";
import { img_tc_colunaModel } from "./models/img_tc_coluna";
import { img_rm_cranioModel } from "./models/img_rm_cranio";
import { img_rm_colunaModel } from "./models/img_rm_coluna";
import { img_rm_articulacaoModel } from "./models/img_rm_articulacao";
import { img_rm_cardiacaModel } from "./models/img_rm_cardiaca";
import { cardio_ecgModel } from "./models/cardio_ecg";
import { cardio_ecocardiogramaModel } from "./models/cardio_ecocardiograma";
import { cardio_holter_24hModel } from "./models/cardio_holter_24h";
import { cardio_teste_ergometricoModel } from "./models/cardio_teste_ergometrico";
import { cardio_mapa_24hModel } from "./models/cardio_mapa_24h";
import { neuro_eegModel } from "./models/neuro_eeg";
import { neuro_enmgModel } from "./models/neuro_enmg";
import { neuro_doppler_transcranianoModel } from "./models/neuro_doppler_transcraniano";
import { neuro_liquorModel } from "./models/neuro_liquor";
import { gineco_papanicolauModel } from "./models/gineco_papanicolau";
import { gineco_colposcopiaModel } from "./models/gineco_colposcopia";
import { gineco_us_transvaginal_completoModel } from "./models/gineco_us_transvaginal_completo";
import { gineco_usg_monitorizacao_folicularModel } from "./models/gineco_usg_monitorizacao_folicular";
import { obst_us_rotina_completoModel } from "./models/obst_us_rotina_completo";
import { obst_doppler_materno_fetalModel } from "./models/obst_doppler_materno_fetal";
import { obst_cardiotocografiaModel } from "./models/obst_cardiotocografia";
import { obst_us_3dModel } from "./models/obst_us_3d";
import { obst_us_4dModel } from "./models/obst_us_4d";
import { img_us_morfologicaModel } from "./models/img_us_morfologica";
import { obst_us_abdominal_gestacao_inicialModel } from "./models/obst_us_abdominal_gestacao_inicial";
import { pediatria_crescimento_desenvolvimentoModel } from "./models/pediatria_crescimento_desenvolvimento";
import { func_espirometriaModel } from "./models/func_espirometria";
import { func_oximetriaModel } from "./models/func_oximetria";
import { func_potenciais_evocadosModel } from "./models/func_potenciais_evocados";
import { func_tilt_testModel } from "./models/func_tilt_test";
import { func_teste_pezinhoModel } from "./models/func_teste_pezinho";
import { neonatal_teste_orelhinhaModel } from "./models/neonatal_teste_orelhinha";
import { neonatal_teste_coracaozinhoModel } from "./models/neonatal_teste_coracaozinho";
import { neonatal_teste_linguinhaModel } from "./models/neonatal_teste_linguinha";
import { pediatria_glicemia_capilarModel } from "./models/pediatria_glicemia_capilar";
import { pediatria_teste_rapido_viralModel } from "./models/pediatria_teste_rapido_viral";
import { oftalmo_acuidade_visualModel } from "./models/oftalmo_acuidade_visual";
import { oftalmo_biomicroscopiaModel } from "./models/oftalmo_biomicroscopia";
import { oftalmo_fundo_olhoModel } from "./models/oftalmo_fundo_olho";
import { oftalmo_refracaoModel } from "./models/oftalmo_refracao";
import { oftalmo_campimetriaModel } from "./models/oftalmo_campimetria";
import { oftalmo_erg_pediatricoModel } from "./models/oftalmo_erg_pediatrico";
import { derm_exame_clinicoModel } from "./models/derm_exame_clinico";
import { derm_dermatoscopiaModel } from "./models/derm_dermatoscopia";
import { derm_micologico_diretoModel } from "./models/derm_micologico_direto";
import { derm_biopsia_peleModel } from "./models/derm_biopsia_pele";
import { derm_patch_testModel } from "./models/derm_patch_test";
import { derm_teste_sensibilidadeModel } from "./models/derm_teste_sensibilidade";
import { hormonal_painel_hormonal_completoModel } from "./models/hormonal_painel_hormonal_completo";
import { horm_cortisolModel } from "./models/horm_cortisol";
import { hormonal_amhModel } from "./models/hormonal_amh";
import { genetico_sexagem_fetalModel } from "./models/genetico_sexagem_fetal";
import { lab_teste_dnaModel } from "./models/lab_teste_dna";
import { psiquiatria_psicotecnicoModel } from "./models/psiquiatria_psicotecnico";
import { geral_exame_toxicologicoModel } from "./models/geral_exame_toxicologico";
import { exame_genericoModel } from "./models/exame_generico";
import { img_raio_x_unicoModel } from "./models/img_raio_x_unico";

export type { IntelligentExamModel } from "./types";

const UNIQUE_IMAGE_VARIANT_IDS = new Set([
  "gineco_us_transvaginal_completo",
  "img_us_abdome_total",
  "img_us_pelvica",
  "img_us_doppler_vascular",
  "obst_us_3d",
  "obst_us_4d",
  "obst_us_abdominal_gestacao_inicial",
  "obst_us_rotina_completo",
  "img_tc_cranio",
  "img_tc_torax",
  "img_tc_abdome_pelve",
  "img_tc_coluna",
  "img_rm_cranio",
  "img_rm_coluna",
  "img_rm_articulacao",
  "img_rm_cardiaca",
]);

const baseExamModels: IntelligentExamModel[] = [
  lab_beta_hcg_completoModel,
  lab_hemograma_completoModel,
  lab_teste_coombsModel,
  lab_sorologiaModel,
  lab_painel_alergiaModel,
  lab_glicemiaModel,
  lab_urina_analiseModel,
  lab_feze_analiseModel,
  lab_uroculturaModel,
  lab_anticorpos_irregularesModel,
  lab_funcao_renal_completaModel,
  lab_funcao_hepatica_completaModel,
  lab_eletrolitos_completosModel,
  lab_hba1c_completaModel,
  lab_dtpaModel,
  lab_painel_autoimuneModel,
  lab_metabolismo_ferroModel,
  lab_reticulocitosModel,
  lab_eletroforese_hemoglobinaModel,
  lab_gasometria_arterialModel,
  img_us_abdome_totalModel,
  img_us_pelvicaModel,
  img_us_doppler_vascularModel,
  img_tc_cranioModel,
  img_tc_toraxModel,
  img_tc_abdome_pelveModel,
  img_tc_colunaModel,
  img_rm_cranioModel,
  img_rm_colunaModel,
  img_rm_articulacaoModel,
  img_rm_cardiacaModel,
  cardio_ecgModel,
  cardio_ecocardiogramaModel,
  cardio_holter_24hModel,
  cardio_teste_ergometricoModel,
  cardio_mapa_24hModel,
  neuro_eegModel,
  neuro_enmgModel,
  neuro_doppler_transcranianoModel,
  neuro_liquorModel,
  gineco_papanicolauModel,
  gineco_colposcopiaModel,
  gineco_us_transvaginal_completoModel,
  gineco_usg_monitorizacao_folicularModel,
  obst_us_rotina_completoModel,
  obst_doppler_materno_fetalModel,
  obst_cardiotocografiaModel,
  obst_us_3dModel,
  obst_us_4dModel,
  img_us_morfologicaModel,
  obst_us_abdominal_gestacao_inicialModel,
  pediatria_crescimento_desenvolvimentoModel,
  func_espirometriaModel,
  func_oximetriaModel,
  func_potenciais_evocadosModel,
  func_tilt_testModel,
  func_teste_pezinhoModel,
  neonatal_teste_orelhinhaModel,
  neonatal_teste_coracaozinhoModel,
  neonatal_teste_linguinhaModel,
  pediatria_glicemia_capilarModel,
  pediatria_teste_rapido_viralModel,
  oftalmo_acuidade_visualModel,
  oftalmo_biomicroscopiaModel,
  oftalmo_fundo_olhoModel,
  oftalmo_refracaoModel,
  oftalmo_campimetriaModel,
  oftalmo_erg_pediatricoModel,
  derm_exame_clinicoModel,
  derm_dermatoscopiaModel,
  derm_micologico_diretoModel,
  derm_biopsia_peleModel,
  derm_patch_testModel,
  derm_teste_sensibilidadeModel,
  hormonal_painel_hormonal_completoModel,
  horm_cortisolModel,
  hormonal_amhModel,
  genetico_sexagem_fetalModel,
  lab_teste_dnaModel,
  psiquiatria_psicotecnicoModel,
  geral_exame_toxicologicoModel,
  exame_genericoModel,
  img_raio_x_unicoModel
];


const COMPACT_EXAM_NAMES: Record<string, string> = {
  derm_exame_clinico: "Exame Dermatológico",
  derm_micologico_direto: "Exame Micológico Direto",
  derm_patch_test: "Teste de Contato",
  derm_teste_sensibilidade: "Sensibilidade Cutânea",
  gineco_papanicolau: "Papanicolau",
  gineco_usg_monitorizacao_folicular: "Monitorização Folicular",
  img_tomografia_unica: "Tomografia",
  img_ressonancia_unica: "Ressonância Magnética",
  lab_dtpa: "Sorologia dTpa",
  lab_feze_analise: "Análise de Fezes",
  lab_hba1c_completa: "Hemoglobina Glicada",
  lab_urina_analise: "Urina Tipo I",
  neuro_eeg: "Eletroencefalograma",
  neuro_enmg: "Eletroneuromiografia",
  neuro_liquor: "Análise do Líquor",
  obst_doppler_materno_fetal: "Doppler Materno-Fetal",
  obst_us_abdominal_gestacao_inicial: "US Obstétrica Inicial",
  pediatria_crescimento_desenvolvimento: "Crescimento e Desenvolvimento",
  pediatria_glicemia_capilar: "Glicemia Capilar",
};

function withCompactExamName(model: IntelligentExamModel): IntelligentExamModel {
  const compactName = COMPACT_EXAM_NAMES[model.id];
  return compactName ? { ...model, nome: compactName } : model;
}

export const intelligentExamModels: IntelligentExamModel[] = [
  imgUltrassonografiaUnicaModel,
  imgTomografiaUnicaModel,
  imgRessonanciaUnicaModel,
  ...baseExamModels.filter((model) => !UNIQUE_IMAGE_VARIANT_IDS.has(model.id)),
].map(withCompactExamName);

export const hiddenUniqueImageVariantModels: IntelligentExamModel[] = baseExamModels.filter((model) => UNIQUE_IMAGE_VARIANT_IDS.has(model.id));

export const examCatalogV244 = intelligentExamModels.map((model) => ({
  id: model.id,
  nome: model.nome,
  descricao: model.descricao,
  categoria: model.categoria,
  icone: model.icone,
  campos: model.campos,
}));

export function getIntelligentExamModel(id: string) {
  return intelligentExamModels.find((model) => model.id === id);
}
