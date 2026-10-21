/** Editorial presentation only. Never changes parameters, references or generation seeds. */
export function clearReportLanguage(value: string): string {
  return value
    .replace(/correlacionad([oa]s?)\s+(?:clinicamente|com a clínica)/gi, 'avaliad$1 em conjunto com os sintomas e o histórico do paciente')
    .replace(/correlação clínica/gi, 'avaliação conjunta com os sintomas e o histórico do paciente')
    .replace(/correlacionar com (?:o quadro|o contexto) clínico/gi, 'avaliar em conjunto com os sintomas e o histórico do paciente')
    .replace(/definição etiológica/gi, 'definição da causa')
    .replace(/sem definição diagnóstica isolada/gi, 'sem permitir um diagnóstico por si só')
    .replace(/de significado inespecífico isoladamente/gi, 'que, isoladamente, não indica uma causa específica')
    .replace(/conforme os resultados efetivamente informados/gi, 'conforme os resultados registrados')
    .replace(/[ \t]+/g, ' ').trim();
}

export function uniqueReportParagraphs(value: string, alreadyUsed = ''): string {
  // Exact normalized sentences only: never fuzzy-match diagnoses or negations.
  const key = (text: string) => text.toLocaleLowerCase('pt-BR').replace(/\s+/g, ' ').replace(/[.!?]+$/, '').trim();
  const sentences = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-ZÁÉÍÓÚÂÊÔÃÕÇ])/);
  const seen = new Set(sentences(alreadyUsed.replace(/\n/g, ' ')).map(key));
  return value.split('\n').map(line => sentences(line).filter(sentence => {
    const normalized = key(sentence); if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized); return true;
  }).join(' ')).filter(Boolean).join('\n');
}

export function isRepeatedEvidenceNarrative(value: string) {
  return /^(?:Os parâmetros mensurados|Os resultados principais \(|Os principais resultados \()/i.test(value.trim());
}

export function isRepeatedEvidenceConclusion(value: string) {
  return /com (?:parâmetros compatíveis com o padrão esperado, incluindo|padrão alterado, documentado por|resultado limítrofe\/inespecífico, destacando-se)/i.test(value);
}

/** Reviewed explanations complement the diagnosis; they do not repeat its row values. */
export const interpretationCopy: Record<string, Record<string, string>> = {
  lab_glicemia: {
    normal: '',
    hiperglicemia: 'A avaliação deve considerar o jejum, os sintomas e os critérios clínicos.',
    hipoglicemia: 'A avaliação deve considerar os sintomas, os medicamentos em uso e o histórico do paciente.',
    'limítrofe': 'O valor isolado não permite estabelecer um diagnóstico.',
  },
  lab_eletrolitos_completos: {
    normal: '', hiponatremia: 'A avaliação deve considerar o estado clínico e a osmolaridade, quando indicada.',
    hipernatremia: '', hipocalemia: '', hipercalemia: '',
    indefinido: 'A avaliação deve considerar a hidratação, os medicamentos em uso e os sintomas.',
  },
  lab_hemograma_completo: {
    normal: '',
    anemia: 'A definição da causa depende do histórico do paciente e dos demais exames laboratoriais.',
    infeccao: 'O padrão das células de defesa deve ser avaliado em conjunto com os sintomas.',
    indefinido: 'O resultado isolado não permite definir a causa das variações observadas.',
  },
  lab_funcao_renal_completa: {
    normal: '',
    reducao_funcao_renal: 'A avaliação deve considerar a hidratação, os medicamentos em uso, a evolução e o histórico do paciente.',
    azotemia: 'A avaliação deve considerar a hidratação e a função dos rins em exames anteriores.',
    indefinido: 'Pode ser necessária nova dosagem, conforme o histórico e a avaliação médica.',
  },
  lab_funcao_hepatica_completa: {
    normal: '',
    hepatocelular: 'A avaliação deve considerar medicamentos, infecções, consumo de álcool, gordura no fígado e os demais dados clínicos.',
    colestatico: 'A avaliação deve considerar os sintomas e os exames de imagem.',
    misto: 'A interpretação conjunta das enzimas e dos demais marcadores ajuda a definir a causa.',
    indefinido: 'Variações discretas podem ser transitórias. A evolução e o histórico ajudam a esclarecer seu significado.',
  },
  lab_metabolismo_ferro: {
    normal: '',
    deficiencia_ferro: 'A avaliação deve considerar o hemograma, possíveis perdas de sangue e o histórico do paciente.',
    sobrecarga_ferro: 'O significado das alterações depende também da presença de inflamação e de alterações metabólicas.',
    inflamatorio: 'A ferritina isolada não define diagnóstico: sua elevação pode acompanhar aumento dos estoques de ferro, inflamação ou alterações metabólicas.',
    indefinido: 'Pode ser necessária nova dosagem e comparação com o hemograma e os marcadores de inflamação.',
  },
  lab_urina_analise: {
    normal: '',
    itu: 'A avaliação deve considerar os sintomas urinários e a urocultura, quando indicada.',
    proteinuria: 'Esse achado pode estar relacionado aos rins ou a condições transitórias; o histórico e o acompanhamento ajudam a esclarecer a causa.',
    hematuria: 'Esse achado pode ter causas urinárias, renais ou transitórias, que devem ser avaliadas conforme o histórico.',
    litiase: 'A avaliação deve considerar os sintomas e os exames de imagem.',
    indefinido: 'O resultado isolado não permite identificar uma causa específica.',
  },
  lab_urocultura: {
    negativa: 'Contagens muito baixas devem ser avaliadas em conjunto com os sintomas, a coleta e o uso prévio de antimicrobianos.',
    positiva: 'A avaliação deve considerar os sintomas urinários e o exame de urina tipo I.',
    contaminacao: 'O crescimento de diferentes bactérias ou a baixa contagem pode estar relacionado à coleta. Uma nova amostra pode ser necessária, conforme avaliação médica.',
  },
  lab_feze_analise: {
    normal: '', inflamatorio: 'A avaliação deve considerar os sintomas intestinais e o histórico do paciente.',
    parasitose: 'A avaliação deve considerar os sintomas e o histórico de exposição.',
    sangramento: 'A avaliação deve considerar os sintomas, os medicamentos em uso e a investigação clínica.',
    indefinido: 'O resultado isolado não permite definir a causa das alterações.',
  },
  lab_beta_hcg_completo: {
    negativo: 'A avaliação deve considerar a data da coleta, o atraso menstrual e o uso de medicamentos, quando necessário.',
    positivo: 'A avaliação deve considerar a idade gestacional estimada, a data da última menstruação, o contexto de FIV e a evolução entre coletas.',
    indeterminado: 'A ausência de definição pode estar relacionada a uma fase muito inicial, variação da análise ou acompanhamento após um evento gestacional.',
    seguimento: 'A comparação deve considerar o intervalo entre coletas e a tendência de elevação, estabilização ou queda.',
  },
  lab_teste_dna: {
    compatibilidade: 'A interpretação considera os marcadores genéticos analisados, o método e o índice calculado.',
    exclusao: 'A interpretação considera as incompatibilidades entre os marcadores analisados e os critérios do método.',
    inconclusivo: 'A qualidade da amostra, o número de participantes, a ausência de um genitor ou um índice insuficiente podem limitar a análise.',
  },
};

/** Explain the specific measurement without restating the final diagnosis. */
const examMeaning: Record<string, string> = {
  lab_glicemia: 'A glicose indica a quantidade de açúcar no sangue no momento da coleta; alimentação recente e medicamentos podem influenciar a medida.',
  lab_hemograma_completo: 'As hemácias e a hemoglobina participam do transporte de oxigênio; os leucócitos refletem a resposta de defesa, e as plaquetas ajudam na coagulação.',
  lab_eletrolitos_completos: 'Sódio e potássio participam do equilíbrio de líquidos e da atividade dos músculos e do coração; hidratação e medicamentos podem influenciar seus níveis.',
  lab_funcao_renal_completa: 'Creatinina, ureia e estimativa de filtração ajudam a avaliar como os rins eliminam resíduos do sangue. A comparação com exames anteriores esclarece a evolução.',
  lab_funcao_hepatica_completa: 'O conjunto de enzimas e bilirrubinas ajuda a diferenciar alterações das células do fígado de alterações no fluxo da bile.',
  lab_metabolismo_ferro: 'Ferritina e demais marcadores ajudam a avaliar os estoques e a disponibilidade de ferro para a produção de hemácias.',
  lab_urina_analise: 'A análise reúne sinais de inflamação, presença de sangue, perda de proteínas e cristais. Sintomas urinários ajudam a distinguir o significado desses achados.',
  lab_urocultura: 'A cultura pesquisa crescimento de bactérias na urina. A contagem e a qualidade da coleta ajudam a distinguir infecção de contaminação.',
  lab_feze_analise: 'A análise pesquisa parasitas e sinais de inflamação ou sangramento intestinal, conforme os componentes avaliados.',
  lab_reticulocitos: 'Os reticulócitos são hemácias jovens; sua contagem ajuda a avaliar a resposta da medula à necessidade de repor células do sangue.',
  lab_gasometria_arterial: 'O conjunto de oxigênio, gás carbônico, pH e bicarbonato ajuda a avaliar a respiração e o equilíbrio ácido-base do sangue.',
  lab_eletroforese_hemoglobina: 'A distribuição dos tipos de hemoglobina auxilia na investigação de variantes hereditárias e deve ser comparada ao hemograma.',
  lab_painel_alergia: 'A sensibilização identificada pelo exame deve ser comparada às reações após contato com cada substância; sensibilização não significa, por si só, alergia clínica.',
  lab_painel_autoimune: 'Os anticorpos pesquisados auxiliam na investigação de autoimunidade; a presença isolada de um marcador não confirma uma doença.',
  lab_sorologia: 'O significado dos anticorpos e antígenos depende do agente pesquisado e da fase da exposição; marcadores de contato prévio e de atividade não são equivalentes.',
  lab_teste_coombs: 'A pesquisa identifica anticorpos relacionados às hemácias e auxilia na investigação de incompatibilidade sanguínea ou destruição dessas células, conforme o método selecionado.',
  lab_anticorpos_irregulares: 'A pesquisa identifica anticorpos contra hemácias que podem ser relevantes para compatibilidade transfusional e acompanhamento gestacional.',
  hormonal_amh: 'O AMH auxilia na estimativa da reserva ovariana. Não mede diretamente a qualidade dos óvulos nem prevê, sozinho, a chance de gestação.',
  horm_cortisol: 'O cortisol participa da resposta ao estresse e varia ao longo do dia; o horário da coleta e os medicamentos influenciam sua interpretação.',
  cardio_ecg: 'O traçado registra a atividade elétrica do coração e permite avaliar ritmo, condução e alterações de repolarização no momento do exame.',
  cardio_ecocardiograma: 'O exame avalia as câmaras, as válvulas e o bombeamento do coração; alterações de estrutura e de função são analisadas em conjunto.',
  cardio_holter_24h: 'O registro prolongado permite relacionar variações do ritmo e episódios de arritmia aos horários e sintomas registrados.',
  cardio_mapa_24h: 'As medidas ao longo do dia e do sono ajudam a avaliar a pressão fora do consultório e sua variação entre vigília e repouso.',
  cardio_teste_ergometrico: 'A resposta do coração ao esforço é avaliada pelo traçado, pela pressão, pela frequência cardíaca e pelos sintomas durante o teste.',
  func_espirometria: 'Os volumes e fluxos respiratórios ajudam a identificar limitação da passagem de ar; a resposta ao broncodilatador complementa a avaliação quando realizada.',
  func_oximetria: 'A saturação estima a oxigenação do sangue no momento da medida; movimento, perfusão reduzida e posicionamento do sensor podem interferir.',
  func_tilt_test: 'A resposta da pressão e da frequência cardíaca à mudança de posição auxilia na investigação de desmaios e intolerância ao ficar em pé.',
  neuro_eeg: 'O registro avalia a atividade elétrica cerebral durante o exame. Um traçado sem alterações não exclui episódios que ocorram fora do período registrado.',
  neuro_enmg: 'A condução nervosa e a atividade muscular ajudam a localizar alterações dos nervos periféricos e dos músculos.',
  neuro_liquor: 'A combinação de células, proteínas, glicose e testes específicos auxilia na investigação de inflamação, infecção e outras alterações do sistema nervoso.',
  neuro_doppler_transcraniano: 'As velocidades e os padrões de fluxo ajudam a avaliar a circulação nas artérias cerebrais acessíveis ao método.',
  gineco_papanicolau: 'A análise das células do colo do útero pesquisa alterações que podem exigir acompanhamento; o exame é de rastreamento e não substitui confirmação diagnóstica quando indicada.',
  gineco_colposcopia: 'A avaliação ampliada localiza áreas de alteração no colo do útero e auxilia na escolha de locais para biópsia quando necessária.',
  gineco_us_transvaginal_completo: 'A avaliação reúne medidas e aspectos do útero, do endométrio e dos ovários para localizar os achados descritos.',
  gineco_usg_monitorizacao_folicular: 'O tamanho dos folículos e o aspecto do endométrio ajudam a acompanhar a resposta ao protocolo; a evolução é melhor avaliada comparando exames seriados.',
  obst_cardiotocografia: 'O registro relaciona frequência cardíaca fetal, movimentos e contrações durante o período observado; não representa uma avaliação contínua após o exame.',
  obst_doppler_materno_fetal: 'Os padrões de fluxo nas circulações materna, placentária e fetal ajudam a avaliar a distribuição de sangue durante a gestação.',
  pediatria_crescimento_desenvolvimento: 'Peso, comprimento ou estatura e marcos do desenvolvimento devem ser acompanhados ao longo do tempo, considerando a idade e a trajetória da criança.',
  pediatria_glicemia_capilar: 'A medida capilar informa a glicose naquele momento; alimentação recente, sintomas e condições da coleta ajudam a interpretar o resultado.',
  pediatria_teste_rapido_viral: 'O teste pesquisa o agente selecionado na amostra; o momento da coleta e a qualidade da amostra influenciam a detecção.',
  neonatal_teste_coracaozinho: 'A comparação da oxigenação entre os membros auxilia na triagem de alterações cardíacas; o resultado não substitui a avaliação clínica do recém-nascido.',
  neonatal_teste_orelhinha: 'A resposta auditiva pesquisada auxilia na triagem da audição; um resultado alterado exige avaliação complementar e não define sozinho perda auditiva.',
  neonatal_teste_linguinha: 'A mobilidade da língua e o aspecto do frênulo são analisados em conjunto com a função, especialmente durante a alimentação.',
  oftalmo_acuidade_visual: 'A medida informa a capacidade de distinguir detalhes com e sem correção, conforme as condições registradas no exame.',
  oftalmo_refracao: 'A avaliação identifica a correção óptica necessária para focalização; o grau deve ser analisado junto à acuidade visual e ao conforto do paciente.',
  oftalmo_campimetria: 'O exame mapeia a sensibilidade do campo visual; a confiabilidade das respostas é importante para interpretar eventuais falhas.',
  oftalmo_fundo_olho: 'A avaliação da retina, dos vasos e do nervo óptico ajuda a localizar alterações na região posterior do olho.',
  oftalmo_biomicroscopia: 'A avaliação ampliada das estruturas do olho permite localizar alterações da superfície e do segmento anterior.',
  oftalmo_erg_pediatrico: 'As respostas elétricas à luz ajudam a avaliar a função da retina; a interpretação depende das condições e da qualidade do registro.',
};

function specificExamMeaning(modelId: string): string {
  if (examMeaning[modelId]) return examMeaning[modelId];
  if (/^img_/.test(modelId)) {
    if (modelId.includes('doppler')) return 'O padrão e a velocidade do fluxo ajudam a avaliar a circulação nos vasos examinados.';
    if (modelId.includes('morfologica')) return 'A avaliação examina a anatomia fetal visível e pesquisa alterações estruturais; algumas condições podem não ser identificáveis nesta etapa.';
    if (modelId.includes('raio_x')) return 'As projeções radiográficas permitem avaliar alinhamento, contornos ósseos e alterações visíveis da região examinada; estruturas sobrepostas podem limitar a análise.';
    if (/ressonancia|_rm_/.test(modelId)) return 'As diferentes sequências permitem comparar os tecidos e localizar alterações de sinal na região examinada; o significado depende das estruturas envolvidas.';
    if (/tomografia|_tc_/.test(modelId)) return 'A análise em cortes permite localizar alterações e avaliar sua extensão nas estruturas da região examinada.';
    return 'As imagens permitem avaliar forma, dimensões e aspecto das estruturas da região examinada; a visibilidade depende das condições técnicas do exame.';
  }
  if (/^obst_us_/.test(modelId)) return 'As medidas, a anatomia visível e a atividade cardíaca fetal são avaliadas em conjunto para acompanhar a gestação; a comparação seriada ajuda a analisar o crescimento.';
  if (/^derm_/.test(modelId)) return ({derm_biopsia_pele:'A análise microscópica da amostra de pele ajuda a caracterizar a lesão e deve ser relacionada ao local e ao aspecto clínico.',derm_micologico_direto:'A pesquisa microscópica procura estruturas de fungos na amostra; qualidade e local da coleta influenciam a detecção.',derm_patch_test:'As reações após contato com cada substância ajudam a investigar dermatite de contato; sua relevância depende da exposição habitual.',derm_teste_sensibilidade:'A resposta aos estímulos permite mapear alterações de sensibilidade nas áreas examinadas.',derm_dermatoscopia:'A ampliação permite avaliar padrões e estruturas da lesão que não são visíveis a olho nu.'} as Record<string,string>)[modelId] || 'A distribuição e o aspecto das lesões ajudam a caracterizar a alteração da pele e a orientar a investigação.';
  if (modelId==='func_potenciais_evocados') return 'As respostas aos estímulos ajudam a avaliar a condução nas vias sensoriais pesquisadas, conforme a modalidade do exame.';
  if (modelId==='func_teste_pezinho') return 'A triagem pesquisa marcadores de condições que podem se beneficiar de identificação precoce; resultados alterados precisam de confirmação específica.';
  return '';
}

export function reviewedInterpretation(modelId: string, profileId: string, original: string): string {
  if (profileId === 'personalizado') return original;
  const meaning = specificExamMeaning(modelId);
  const selected = interpretationCopy[modelId]?.[profileId];
  if (selected !== undefined) return selected || meaning;
  if (isRepeatedEvidenceNarrative(original)) return meaning;
  if (modelId === 'lab_hba1c_completa' && profileId !== 'personalizado') {
    return 'A hemoglobina glicada resume o controle da glicose nos últimos dois a três meses. A interpretação deve considerar o histórico e os critérios clínicos aplicáveis.';
  }
  if (modelId === 'genetico_sexagem_fetal') {
    if (profileId === 'feminino' || profileId === 'masculino') return 'A interpretação considera a adequação da amostra e a validade dos controles da análise.';
    if (profileId === 'inconclusivo') return 'Uma nova avaliação pode ser necessária, conforme a qualidade da amostra e o protocolo de análise.';
    // Gemelar RP limitation is deliberately retained in full.
  }
  if (/^obst_us_/.test(modelId)) {
    if (profileId === 'gestacao_normal') return meaning;
    if (profileId === 'gemelar') return 'A avaliação considera as medidas de cada feto e, quando identificável, a organização das placentas e das bolsas amnióticas.';
    if (profileId === 'primeiro_trimestre') return 'A avaliação considera o saco gestacional, o embrião ou feto e os batimentos cardíacos. O comprimento cabeça-nádegas auxilia na estimativa da idade gestacional, quando aplicável.';
    if (profileId === 'rciu') return 'As medidas do feto e o Doppler, quando realizado, devem ser avaliados conforme a idade gestacional.';
  }
  if (/^img_(?:raio_x|ressonancia|tomografia|ultrassonografia)_unic[oa]$/.test(modelId) && profileId === 'normal') return meaning;
  if (modelId === 'exame_generico') return '';
  return original;
}

/** Short equivalents keep the technical name available to the clinician. */
export function explainReportConclusion(value: string) {
  const equivalents: Array<[RegExp, string]> = [
    [/hiperglicemia laboratorial/gi, 'Glicose elevada no sangue (hiperglicemia)'],
    [/hipoglicemia laboratorial/gi, 'Glicose reduzida no sangue (hipoglicemia)'],
    [/hiponatremia laboratorial/gi, 'Sódio reduzido no sangue (hiponatremia)'],
    [/hipernatremia laboratorial/gi, 'Sódio elevado no sangue (hipernatremia)'],
    [/hipocalemia laboratorial/gi, 'Potássio reduzido no sangue (hipocalemia)'],
    [/hipercalemia laboratorial/gi, 'Potássio elevado no sangue (hipercalemia)'],
    [/proteinúria detectável/gi, 'Proteínas detectadas na urina (proteinúria)'],
    [/hematúria microscópica/gi, 'Sangue identificado na análise microscópica da urina (hematúria microscópica)'],
    [/função renal preservada/gi, 'Função dos rins preservada'],
    [/função hepática preservada/gi, 'Função do fígado preservada'],
    [/sem definição endócrina isolada/gi, 'sem permitir um diagnóstico hormonal por si só'],
    [/sem definição clínica isolada/gi, 'sem permitir uma definição clínica por si só'],
  ];
  return equivalents.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), value);
}
