# Auditoria de espaço — HP São Rafael

Levantamento de 29/10/2026, no projeto `hpn são rafael`. Apenas consultas de leitura: nenhum registro, arquivo, índice ou usuário foi excluído; não foi executado VACUUM nem alteração de permissões.

## Resultado principal

O banco PostgreSQL está com **342,94 MiB** (o PostgreSQL exibe aproximadamente 343 MB). A maior oportunidade é **compactar espaço antigo da tabela de registros clínicos**, e não apagar pacientes ou atendimentos. Há também imagens antigas embutidas nas cópias de auditoria de exclusão que podem ser migradas, preservando o histórico.

| Área | Espaço físico, com índices e TOAST | Evidência e prioridade |
|---|---:|---|
| `public.clinical_records` | 244,65 MiB | 222 registros. JSON principal e versão liberada somam cerca de 1,00 MiB; leitura direta do TOAST encontrou 0,98 MiB de dados grandes vivos. Nenhum payload principal tem imagem `data:image/`. Prioridade máxima: avaliar compactação do espaço antigo. |
| `public.clinical_record_deletion_audit` | 59,79 MiB | 22 cópias de registros excluídos; 21 ainda contêm imagens embutidas. O conteúdo grande vivo ocupa 57,48 MiB. Prioridade seguinte: migrar imagens e preservar o comprovante da exclusão. |
| `public.profiles` | 7,22 MiB | Conteúdo grande vivo em torno de 2,48 MiB. Revisar assinaturas/metadados e espaço antigo; não apagar perfis para economizar. |
| `cron.job_run_details` | 4,09 MiB | Histórico de execução. Contagem estimada das estatísticas não é prova de tabela vazia; verificar retenção antes de limpar. |
| `public.document_editor_drafts` | 3,66 MiB | 6 rascunhos; um ainda contém imagem embutida. Payloads atuais somam aproximadamente 0,27 MiB. Preservar trabalho não concluído. |
| `public.exam_editor_drafts` | 0,90 MiB | 8 rascunhos, sem imagem embutida identificada. Benefício pequeno. |
| `public.patient_portal_sessions` | 0,28 MiB | 248 sessões, sendo 212 expiradas ou revogadas. Limpeza por retenção é possível, mas a economia é muito pequena. |

Os números foram coletados em consultas sucessivas e podem variar com o uso do sistema. Estatísticas de tuplas do PostgreSQL são estimativas; por isso também foram contados os blocos TOAST vivos. Espaço físico inclui estruturas e páginas internas, não somente conteúdo útil. A diferença entre espaço físico e conteúdo vivo indica folga/bloat, mas **não é uma promessa exata de economia**.

## Como liberar espaço, na ordem recomendada

**1. Recuperar o espaço antigo de `clinical_records`.** A tabela tem cerca de 245 MiB alocados e aproximadamente 1 MiB de conteúdo JSON atual. O primeiro passo é fazer backup, conferir a restauração e agendar uma janela sem atendimentos. Um `VACUUM FULL` da tabela reescreve os dados vivos e pode devolver grande parte do espaço antigo ao PostgreSQL. O potencial é alto, possivelmente centenas de MiB, mas o valor final só pode ser confirmado depois da execução. Não é necessário excluir os 222 registros para fazer essa manutenção.

O `VACUUM` comum marca espaço para reutilização e normalmente não reduz o arquivo físico. O `VACUUM FULL` reduz o arquivo, mas exige espaço temporário e bloqueia leituras e gravações na tabela enquanto executa. Não deve ser disparado automaticamente durante o uso do HP. Uma alternativa a avaliar é `pg_repack`, dependendo da disponibilidade e das condições do projeto.

Exemplo para uma janela de manutenção aprovada, **não executado nesta auditoria**; rodar como comando independente, fora de transação:

```sql
VACUUM (FULL, ANALYZE) public.clinical_records;
```

Antes e depois, comparar a quantidade de registros, o tamanho da tabela e abrir alguns exames/documentos e suas imagens nos portais. Após um grande volume de alterações, conferir também folga de disco e crescimento temporário de WAL. O tamanho do banco e o tamanho total do disco são métricas diferentes.

**2. Tratar as imagens das cópias de exclusão.** `clinical_record_deletion_audit` guarda snapshots completos, incluindo imagens em Base64. Isso preserva a prova do que foi excluído, mas custa cerca de 60 MiB no banco. O caminho mais conservador é migrar essas imagens para um bucket privado e substituir o conteúdo embutido por referências, mantendo autoria, motivo, datas e texto. Antes da substituição, validar integridade e acesso de cada imagem e manter backup restaurável. Depois, compactar a tabela em outra janela de manutenção, se necessário. Excluir prontuários pelo fluxo normal não é uma estratégia de economia: o snapshot de auditoria pode continuar guardando o conteúdo.

Mover imagens para Storage diminui o banco, mas não elimina os bytes dos arquivos: eles passam a consumir a cota de Storage. A decisão de excluir snapshots antigos exige uma política de retenção explícita; nenhuma data de corte foi inventada nesta revisão.

**3. Rascunhos e assinaturas.** Verificar com os médicos quais rascunhos são abandonados e migrar a imagem ainda embutida no rascunho de documento. Não limpar rascunhos apenas por serem antigos. Depois revisar assinaturas antigas ou substituídas, cruzando os arquivos com registros liberados e referências atuais antes de remover qualquer imagem. O ganho é menor que a compactação dos registros clínicos.

**4. Limpeza rotineira pequena.** Sessões de paciente expiradas/revogadas e códigos já inutilizados podem receber retenção e limpeza periódica. Foram encontrados 212 registros de sessão inativos e 3 códigos inativos. Isso melhora a organização, mas não resolve o principal consumo. Não remover diretamente tabelas internas de `auth` para ganhar espaço; usar os fluxos suportados de autenticação.

## Storage é uma conta separada

| Bucket | Arquivos cadastrados | Soma dos tamanhos nos metadados |
|---|---:|---:|
| `clinical-assets` | 178 | 38,84 MiB |
| `vaccination-cards` | 8 | 17,38 MiB |
| `signatures` | 3 | 1,29 MiB |
| **Total** | **189** | **57,50 MiB** |

Essa soma vem de `storage.objects.metadata.size`; não inclui objetos órfãos sem metadados, versões não contabilizadas ou métricas de faturamento. Não é somada aos 342,94 MiB do banco como se fosse uma tabela de imagens. `storage.objects` contém metadados e índices, não o conteúdo dos arquivos.

Só remover objetos comprovadamente sem referência em prontuários, versões liberadas, rascunhos, cadernetas, assinaturas e aliases. A auditoria não classificou nenhum desses 189 arquivos como descartável. Remoções devem usar o painel de Storage ou a Storage API; `DELETE` em `storage.objects` pode apagar apenas metadados e deixar o arquivo órfão.

## Índices e verificações adicionais

Os assessores apontam índices sem uso registrado e políticas sobrepostas. Isso não prova que os índices sejam desnecessários: estatísticas podem ter sido reiniciadas e funções pouco usadas ainda podem precisar deles. Os índices dos maiores consumidores são pequenos em comparação com o TOAST; removê-los não é a prioridade. Não foram alterados índices nem políticas.

Também há alertas de segurança a revisar separadamente: funções com `search_path` mutável e funções `SECURITY DEFINER` executáveis por `anon`. O alerta isolado não demonstra acesso indevido, pois as funções podem validar a identidade internamente. Esses itens não são uma causa de consumo de espaço e não foram modificados nesta auditoria.

## Consultas para acompanhar

Somente leitura; não mostram nomes, documentos, tokens ou conteúdo clínico:

```sql
SELECT pg_size_pretty(pg_database_size(current_database())) AS tamanho_do_banco;

SELECT schemaname, relname,
       pg_size_pretty(pg_total_relation_size(relid)) AS total,
       pg_size_pretty(pg_indexes_size(relid)) AS indices,
       n_live_tup, n_dead_tup, last_autovacuum
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 20;

SELECT count(*) AS registros,
       pg_size_pretty(sum(pg_column_size(payload))::bigint) AS json_principal,
       pg_size_pretty(sum(coalesce(pg_column_size(released_render_payload),0))::bigint) AS json_liberado
FROM public.clinical_records;
```

**Recomendação prática:** começar com backup e compactação planejada de `clinical_records`; depois migrar as imagens da auditoria de exclusão. Limpar sessões ou apagar pacientes antes disso traria pouco benefício ou perda de histórico. O resultado desta auditoria é um plano de manutenção; nenhuma economia foi aplicada ao banco.

## Fontes

- [Tamanho do banco e do disco — Supabase](https://supabase.com/docs/guides/platform/database-size)
- [Exclusão e recuperação de espaço — Supabase](https://supabase.com/docs/guides/database/postgres/data-deletion)
- [Remover objetos de Storage — Supabase](https://supabase.com/docs/guides/storage/management/delete-objects)
- [Assessor: funções SECURITY DEFINER públicas](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)
- [Assessor: search_path mutável](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
