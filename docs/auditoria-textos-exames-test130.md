# Revisão dos laudos de exames — test.130

Base: test.129. Alteração editorial e apresentação do conteúdo; separada da versão 1.2.

## Organização do laudo

- Método: técnica e contexto de realização.
- Resultados/achados: parâmetros e valores com suas referências, sem alteração na geração.
- Leitura clínica: explicações e limitações que acrescentam informação. Omitida quando seria apenas outra forma de repetir a conclusão.
- Conclusão: síntese técnica, aproveitando a impressão diagnóstica já existente no perfil, sem copiar as primeiras linhas da tabela.

Removidos os acréscimos automáticos “Principais resultados”, “Resumo principal” e comentários sobre reamostragem. Os perfis com narrativa padronizada que copiava valores passaram a usar a impressão registrada. Não foi introduzido diagnóstico novo nem alterada classificação numérica.

Os textos específicos de glicemia, eletrólitos, hemograma, urina, urocultura, função renal/hepática, ferro, fezes, β-hCG e DNA foram separados entre explicação e conclusão. HbA1c deixou de repetir valores fixos dentro da interpretação. Mantidas as limitações de sexagem gemelar no cenário de RP, amostras inconclusivas e interpretação funcional do toxicológico.

## Apresentação

Títulos de seções geradas recebem uma faixa creme suave com divisor fino. Cabeçalhos das tabelas recebem fundo discreto. A decoração está registrada no HTML do laudo e é desenhada pelo mesmo motor que mede o conteúdo. Títulos manuais continuam neutros; cores e marca-texto do editor são preservados. Não houve alteração nas alturas dos painéis, no cabeçalho institucional, na assinatura ou no rodapé.

## Validação

- 86 modelos, incluindo variantes internas de imagem; 373 perfis; sementes 0, 1 e 7: 1.119 cenários.
- Comparação executada contra o motor original extraído do ZIP test.129: objetos resolvidos e todas as células de resultados/referências idênticos.
- Teste de decoração explícita, cores manuais, igualdade entre medida e desenho e respeito à área útil da paginação.
- Regressões do editor, TypeScript, auditorias de portal e compilação de produção.
- Inspeção de uma amostra rasterizada pelo motor Canvas. A interação e a aparência com fontes do navegador do usuário ainda precisam de conferência nesse ambiente.

A revisão se aplica ao reaplicar os modelos. Laudos já salvos e textos digitados manualmente não são reescritos. Trata-se de revisão editorial do catálogo existente, não de validação clínica independente dos modelos ou de alteração dos algoritmos de resultados.

Referência de linguagem e limites de interpretação: [MedlinePlus — How to Understand Your Lab Results](https://medlineplus.gov/lab-tests/how-to-understand-your-lab-results/).

## Cobertura

| Modelo | Perfis examinados |
| --- | ---: |
| cardio_ecg | 4 |
| cardio_ecocardiograma | 4 |
| cardio_holter_24h | 4 |
| cardio_mapa_24h | 4 |
| cardio_teste_ergometrico | 4 |
| derm_biopsia_pele | 4 |
| derm_dermatoscopia | 4 |
| derm_exame_clinico | 4 |
| derm_micologico_direto | 4 |
| derm_patch_test | 4 |
| derm_teste_sensibilidade | 4 |
| exame_generico | 4 |
| func_espirometria | 4 |
| func_oximetria | 4 |
| func_potenciais_evocados | 4 |
| func_teste_pezinho | 4 |
| func_tilt_test | 4 |
| genetico_sexagem_fetal | 7 |
| geral_exame_toxicologico | 4 |
| gineco_colposcopia | 4 |
| gineco_papanicolau | 4 |
| gineco_us_transvaginal_completo | 4 |
| gineco_usg_monitorizacao_folicular | 4 |
| horm_cortisol | 4 |
| hormonal_amh | 4 |
| hormonal_painel_hormonal_completo | 6 |
| img_raio_x_unico | 8 |
| img_ressonancia_unica | 4 |
| img_rm_articulacao | 4 |
| img_rm_cardiaca | 4 |
| img_rm_coluna | 4 |
| img_rm_cranio | 4 |
| img_tc_abdome_pelve | 4 |
| img_tc_coluna | 4 |
| img_tc_cranio | 4 |
| img_tc_torax | 4 |
| img_tomografia_unica | 4 |
| img_ultrassonografia_unica | 4 |
| img_us_abdome_total | 4 |
| img_us_doppler_vascular | 4 |
| img_us_morfologica | 4 |
| img_us_pelvica | 4 |
| lab_anticorpos_irregulares | 4 |
| lab_beta_hcg_completo | 5 |
| lab_dtpa | 4 |
| lab_eletroforese_hemoglobina | 4 |
| lab_eletrolitos_completos | 7 |
| lab_feze_analise | 6 |
| lab_funcao_hepatica_completa | 6 |
| lab_funcao_renal_completa | 5 |
| lab_gasometria_arterial | 4 |
| lab_glicemia | 5 |
| lab_hba1c_completa | 4 |
| lab_hemograma_completo | 5 |
| lab_metabolismo_ferro | 6 |
| lab_painel_alergia | 4 |
| lab_painel_autoimune | 4 |
| lab_reticulocitos | 4 |
| lab_sorologia | 4 |
| lab_teste_coombs | 4 |
| lab_teste_dna | 4 |
| lab_urina_analise | 7 |
| lab_urocultura | 4 |
| neonatal_teste_coracaozinho | 4 |
| neonatal_teste_linguinha | 4 |
| neonatal_teste_orelhinha | 4 |
| neuro_doppler_transcraniano | 4 |
| neuro_eeg | 4 |
| neuro_enmg | 4 |
| neuro_liquor | 4 |
| obst_cardiotocografia | 4 |
| obst_doppler_materno_fetal | 4 |
| obst_us_3d | 5 |
| obst_us_4d | 5 |
| obst_us_abdominal_gestacao_inicial | 5 |
| obst_us_rotina_completo | 5 |
| oftalmo_acuidade_visual | 4 |
| oftalmo_biomicroscopia | 4 |
| oftalmo_campimetria | 4 |
| oftalmo_erg_pediatrico | 4 |
| oftalmo_fundo_olho | 4 |
| oftalmo_refracao | 4 |
| pediatria_crescimento_desenvolvimento | 4 |
| pediatria_glicemia_capilar | 4 |
| pediatria_teste_rapido_viral | 4 |
| psiquiatria_psicotecnico | 4 |
