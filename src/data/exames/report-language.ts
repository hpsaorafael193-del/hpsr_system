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

export function reviewedInterpretation(modelId: string, profileId: string, original: string): string {
  const selected = interpretationCopy[modelId]?.[profileId];
  if (selected !== undefined) return selected;
  if (modelId === 'lab_hba1c_completa' && profileId !== 'personalizado') {
    return 'A hemoglobina glicada resume o controle da glicose nos últimos dois a três meses. A interpretação deve considerar o histórico e os critérios clínicos aplicáveis.';
  }
  if (modelId === 'genetico_sexagem_fetal') {
    if (profileId === 'feminino' || profileId === 'masculino') return 'A interpretação considera a adequação da amostra e a validade dos controles da análise.';
    if (profileId === 'inconclusivo') return 'Uma nova avaliação pode ser necessária, conforme a qualidade da amostra e o protocolo de análise.';
    // Gemelar RP limitation is deliberately retained in full.
  }
  if (/^obst_us_/.test(modelId)) {
    if (profileId === 'gestacao_normal') return '';
    if (profileId === 'gemelar') return 'A avaliação considera as medidas de cada feto e, quando identificável, a organização das placentas e das bolsas amnióticas.';
    if (profileId === 'primeiro_trimestre') return 'A avaliação considera o saco gestacional, o embrião ou feto e os batimentos cardíacos. O comprimento cabeça-nádegas auxilia na estimativa da idade gestacional, quando aplicável.';
    if (profileId === 'rciu') return 'As medidas do feto e o Doppler, quando realizado, devem ser avaliados conforme a idade gestacional.';
  }
  if (/^img_(?:raio_x|ressonancia|tomografia|ultrassonografia)_unic[oa]$/.test(modelId) && profileId === 'normal') return '';
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
