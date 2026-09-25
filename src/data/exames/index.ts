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
  img_raio_x_unicoModel
];


const CATALOG_EXAM_PRESENTATION: Record<string, { nome?: string; descricao: string }> = {
  img_ultrassonografia_unica: {
    nome: "Ultrassonografia (USG)",
    descricao: "Examina órgãos e estruturas com ultrassom. Escolha o tipo do exame na próxima etapa.",
  },
  img_tomografia_unica: {
    nome: "Tomografia",
    descricao: "Cria imagens detalhadas da região escolhida, com ou sem contraste.",
  },
  img_ressonancia_unica: {
    nome: "Ressonância Magnética",
    descricao: "Mostra tecidos, órgãos e articulações com alto nível de detalhe.",
  },
  img_raio_x_unico: {
    nome: "Raio-X",
    descricao: "Radiografia simples da região escolhida, principalmente para ossos e tórax.",
  },
  lab_beta_hcg_completo: {
    nome: "Beta-hCG",
    descricao: "Confirma ou acompanha uma gestação pelo hormônio beta-hCG.",
  },
  lab_hemograma_completo: {
    descricao: "Avalia glóbulos vermelhos, glóbulos brancos e plaquetas.",
  },
  lab_teste_coombs: {
    descricao: "Pesquisa anticorpos que podem reagir contra as células do sangue.",
  },
  lab_sorologia: {
    descricao: "Pesquisa anticorpos ou sinais de infecções no sangue.",
  },
  lab_painel_alergia: {
    descricao: "Ajuda a investigar possíveis alergias e sensibilizações.",
  },
  lab_glicemia: {
    descricao: "Mede a quantidade de açúcar no sangue.",
  },
  lab_urina_analise: {
    nome: "Urina Tipo I",
    descricao: "Avalia a urina em busca de infecção e outras alterações.",
  },
  lab_feze_analise: {
    nome: "Análise de Fezes",
    descricao: "Pesquisa parasitas e outras alterações nas fezes.",
  },
  lab_urocultura: {
    descricao: "Identifica bactérias na urina e ajuda a orientar o antibiótico.",
  },
  lab_anticorpos_irregulares: {
    nome: "Pesquisa de Anticorpos Irregulares",
    descricao: "Pesquisa anticorpos importantes em transfusões e durante a gestação.",
  },
  lab_funcao_renal_completa: {
    descricao: "Mostra como os rins estão funcionando.",
  },
  lab_funcao_hepatica_completa: {
    descricao: "Mostra como o fígado e as vias biliares estão funcionando.",
  },
  lab_eletrolitos_completos: {
    nome: "Eletrólitos",
    descricao: "Mede sais do sangue, como sódio e potássio.",
  },
  lab_hba1c_completa: {
    nome: "Hemoglobina Glicada",
    descricao: "Mostra a média da glicose dos últimos dois a três meses.",
  },
  lab_dtpa: {
    nome: "dTpa — Imunização",
    descricao: "Registra ou avalia a proteção contra difteria, tétano e coqueluche.",
  },
  lab_painel_autoimune: {
    descricao: "Ajuda a investigar doenças em que o sistema imune reage contra o próprio corpo.",
  },
  lab_metabolismo_ferro: {
    nome: "Painel de Ferro",
    descricao: "Avalia ferro, ferritina e como o organismo transporta esse mineral.",
  },
  lab_reticulocitos: {
    nome: "Reticulócitos",
    descricao: "Mostra como a medula está produzindo novas células vermelhas do sangue.",
  },
  lab_eletroforese_hemoglobina: {
    descricao: "Identifica diferentes tipos de hemoglobina no sangue.",
  },
  lab_gasometria_arterial: {
    descricao: "Mede oxigênio, gás carbônico e o equilíbrio ácido-base do sangue.",
  },
  cardio_ecg: {
    nome: "Eletrocardiograma (ECG)",
    descricao: "Registra o ritmo e a atividade elétrica do coração.",
  },
  cardio_ecocardiograma: {
    nome: "Ecocardiograma",
    descricao: "Ultrassom do coração para avaliar estrutura, movimento e funcionamento.",
  },
  cardio_holter_24h: {
    descricao: "Registra o ritmo do coração continuamente durante 24 horas.",
  },
  cardio_teste_ergometrico: {
    nome: "Teste de Esforço (Ergométrico)",
    descricao: "Avalia como o coração responde durante o esforço físico.",
  },
  cardio_mapa_24h: {
    descricao: "Mede a pressão arterial várias vezes ao longo de 24 horas.",
  },
  neuro_eeg: {
    nome: "Eletroencefalograma (EEG)",
    descricao: "Registra a atividade elétrica do cérebro.",
  },
  neuro_enmg: {
    nome: "Eletroneuromiografia (ENMG)",
    descricao: "Avalia o funcionamento dos nervos e dos músculos.",
  },
  neuro_doppler_transcraniano: {
    descricao: "Avalia o fluxo de sangue nas principais artérias do cérebro.",
  },
  neuro_liquor: {
    nome: "Análise do Líquor",
    descricao: "Avalia o líquido que circula ao redor do cérebro e da medula.",
  },
  gineco_papanicolau: {
    nome: "Papanicolau",
    descricao: "Avalia células do colo do útero para rastreamento e prevenção.",
  },
  gineco_colposcopia: {
    descricao: "Examina o colo do útero e a vagina com aumento para procurar alterações.",
  },
  gineco_usg_monitorizacao_folicular: {
    nome: "Monitorização Folicular (Transvaginal)",
    descricao: "Acompanha os folículos ou o endométrio em avaliações seriadas, conforme o foco escolhido no exame.",
  },
  obst_doppler_materno_fetal: {
    nome: "Doppler Obstétrico",
    descricao: "Avalia a circulação entre gestante, placenta e bebê.",
  },
  obst_cardiotocografia: {
    nome: "Cardiotocografia (CTG)",
    descricao: "Acompanha os batimentos do bebê e as contrações uterinas.",
  },
  img_us_morfologica: {
    nome: "Ultrassonografia Morfológica",
    descricao: "Avalia detalhadamente a formação e o desenvolvimento do bebê.",
  },
  pediatria_crescimento_desenvolvimento: {
    nome: "Crescimento e Desenvolvimento",
    descricao: "Acompanha peso, altura e marcos do desenvolvimento da criança.",
  },
  pediatria_glicemia_capilar: {
    nome: "Glicemia Capilar",
    descricao: "Mede rapidamente o açúcar no sangue da criança.",
  },
  pediatria_teste_rapido_viral: {
    descricao: "Pesquisa rapidamente vírus respiratórios comuns em crianças.",
  },
  func_espirometria: {
    descricao: "Mede quanto ar a pessoa consegue inspirar e expirar e como os pulmões funcionam.",
  },
  func_oximetria: {
    descricao: "Mede de forma rápida a quantidade de oxigênio no sangue.",
  },
  func_potenciais_evocados: {
    descricao: "Avalia como estímulos visuais, auditivos ou sensitivos chegam ao cérebro.",
  },
  func_tilt_test: {
    nome: "Teste de Inclinação (Tilt Test)",
    descricao: "Ajuda a investigar desmaios, tonturas e alterações da pressão ao mudar de posição.",
  },
  func_teste_pezinho: {
    descricao: "Triagem do recém-nascido para algumas doenças metabólicas e genéticas.",
  },
  neonatal_teste_orelhinha: {
    descricao: "Triagem rápida da audição do recém-nascido.",
  },
  neonatal_teste_coracaozinho: {
    descricao: "Mede a oxigenação do recém-nascido para rastrear alterações do coração.",
  },
  neonatal_teste_linguinha: {
    descricao: "Avalia o frênulo da língua e possíveis limitações de movimento.",
  },
  oftalmo_acuidade_visual: {
    descricao: "Mede o quanto a pessoa consegue enxergar de perto e de longe.",
  },
  oftalmo_biomicroscopia: {
    descricao: "Examina em detalhe as estruturas da parte da frente do olho.",
  },
  oftalmo_fundo_olho: {
    descricao: "Avalia retina, mácula, vasos e nervo óptico.",
  },
  oftalmo_refracao: {
    descricao: "Mede grau de miopia, hipermetropia e astigmatismo.",
  },
  oftalmo_campimetria: {
    descricao: "Avalia a visão central e periférica, mostrando possíveis falhas no campo visual.",
  },
  oftalmo_erg_pediatrico: {
    nome: "Eletrorretinograma (ERG)",
    descricao: "Avalia como a retina responde à luz, inclusive em crianças.",
  },
  derm_exame_clinico: {
    nome: "Exame Dermatológico",
    descricao: "Avalia manchas, feridas, lesões e outras alterações da pele.",
  },
  derm_dermatoscopia: {
    descricao: "Amplia pintas e lesões da pele para uma avaliação mais detalhada.",
  },
  derm_micologico_direto: {
    nome: "Exame Micológico",
    descricao: "Pesquisa fungos em pele, unhas ou cabelos.",
  },
  derm_biopsia_pele: {
    descricao: "Analisa uma pequena amostra da pele para identificar alterações.",
  },
  derm_patch_test: {
    nome: "Teste de Contato",
    descricao: "Ajuda a descobrir substâncias que provocam alergia na pele.",
  },
  derm_teste_sensibilidade: {
    nome: "Sensibilidade Cutânea",
    descricao: "Avalia a sensibilidade da pele ao toque e a outros estímulos.",
  },
  hormonal_painel_hormonal_completo: {
    nome: "Painel Hormonal",
    descricao: "Reúne hormônios usados para avaliar ciclo, fertilidade e equilíbrio hormonal.",
  },
  horm_cortisol: {
    descricao: "Mede o cortisol para avaliar a resposta hormonal das glândulas adrenais.",
  },
  hormonal_amh: {
    nome: "AMH — Reserva Ovariana",
    descricao: "Ajuda a estimar a reserva ovariana e a resposta esperada em tratamentos de fertilidade.",
  },
  genetico_sexagem_fetal: {
    descricao: "Pesquisa DNA fetal no sangue materno para indicar o sexo do bebê.",
  },
  lab_teste_dna: {
    descricao: "Compara material genético para investigar vínculo biológico ou outras análises genéticas.",
  },
  psiquiatria_psicotecnico: {
    nome: "Psicotécnico",
    descricao: "Avalia atenção, reação, julgamento, segurança e condições para a finalidade escolhida.",
  },
  geral_exame_toxicologico: {
    descricao: "Pesquisa presença de drogas, medicamentos ou outras substâncias no organismo.",
  },
};

function withCatalogPresentation(model: IntelligentExamModel): IntelligentExamModel {
  const presentation = CATALOG_EXAM_PRESENTATION[model.id];
  if (!presentation) return model;
  return {
    ...model,
    nome: presentation.nome || model.nome,
    descricao: presentation.descricao || model.descricao,
  };
}

export const intelligentExamModels: IntelligentExamModel[] = [
  imgUltrassonografiaUnicaModel,
  imgTomografiaUnicaModel,
  imgRessonanciaUnicaModel,
  ...baseExamModels.filter((model) => !UNIQUE_IMAGE_VARIANT_IDS.has(model.id)),
].map(withCatalogPresentation);

export const hiddenUniqueImageVariantModels: IntelligentExamModel[] = baseExamModels.filter((model) => UNIQUE_IMAGE_VARIANT_IDS.has(model.id));

const ADAPTIVE_VARIANT_BY_SELECTION: Record<string, Record<string, string>> = {
  img_ultrassonografia_unica: {
    "Abdome Total": "img_us_abdome_total",
    "Pélvica": "img_us_pelvica",
    "Obstétrica": "obst_us_rotina_completo",
    "Obstétrica inicial": "obst_us_abdominal_gestacao_inicial",
    "Obstétrica 3D": "obst_us_3d",
    "Obstétrica 4D": "obst_us_4d",
    "Transvaginal": "gineco_us_transvaginal_completo",
    "Doppler": "img_us_doppler_vascular",
  },
  img_tomografia_unica: {
    "Crânio": "img_tc_cranio",
    "Tórax": "img_tc_torax",
    "Abdome e Pelve": "img_tc_abdome_pelve",
    "Coluna": "img_tc_coluna",
  },
  img_ressonancia_unica: {
    "Crânio": "img_rm_cranio",
    "Coluna": "img_rm_coluna",
    "Articulação": "img_rm_articulacao",
    "Joelho": "img_rm_articulacao",
    "Ombro": "img_rm_articulacao",
    "Cardíaca": "img_rm_cardiaca",
  },
};

/**
 * Mantém um único item no catálogo para US/TC/RM, mas usa por trás o modelo
 * detalhado correspondente à região/tipo selecionado. O id público permanece
 * o do modelo consolidado para que rascunhos e configurações antigas continuem
 * compatíveis.
 */
export function resolveIntelligentExamModel(model: IntelligentExamModel, adapterValue?: string | null): IntelligentExamModel {
  const selectedVariantId = ADAPTIVE_VARIANT_BY_SELECTION[model.id]?.[String(adapterValue || "").trim()];
  if (!selectedVariantId) return model;

  const variant = hiddenUniqueImageVariantModels.find((item) => item.id === selectedVariantId);
  if (!variant) return model;

  return {
    ...variant,
    id: model.id,
    categoria: model.categoria,
    icone: model.icone || variant.icone,
    adapter: model.adapter,
    // O catálogo continua com um único item, mas o motor recebe os contextos
    // clínicos do modelo detalhado para adaptar método, achados e conclusão.
    clinicalContexts: variant.clinicalContexts?.length ? variant.clinicalContexts : model.clinicalContexts,
  };
}

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
