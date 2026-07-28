export type AdministrativeMember = { name: string; passport?: string; crm?: string; hospitalRole?: string; specialty?: string; department?: string; joinedAt?: string; history?: string[]; };

export type ReportRecord = Record<string, any>;

export type AdministrativeReportData = {
  periodLabel: string;
  generatedBy?: string;
  warnings?: string[];
  profiles?: ReportRecord[];
  activities: ReportRecord[];
  teamMembers: ReportRecord[];
  applications: ReportRecord[];
  registrationRequests: ReportRecord[];
  patients: ReportRecord[];
  appointments: ReportRecord[];
  clinicalRecords: ReportRecord[];
  receipts: ReportRecord[];
  planEntries: ReportRecord[];
  timeEntries: ReportRecord[];
  timeAudits: ReportRecord[];
  extraSections?: Array<{ name: string; title: string; rows: ReportRecord[] }>;
};

const asRecord = (value: unknown): ReportRecord => value && typeof value === "object" && !Array.isArray(value) ? value as ReportRecord : {};
const text = (...values: unknown[]) => values.find((value) => value !== undefined && value !== null && String(value).trim() !== "") ?? "";
const listText = (value: unknown) => Array.isArray(value) ? value.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join(" | ") : String(value ?? "");
const dateText = (value: unknown) => { if (!value) return ""; const date = new Date(String(value)); return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("pt-BR"); };
const moneyText = (value: unknown) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const durationText = (from: unknown, to?: unknown) => {
  if (!from) return "";
  const start = new Date(String(from)); const end = to ? new Date(String(to)) : new Date();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return "";
  const days = Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86400000));
  const years = Math.floor(days / 365); const months = Math.floor((days % 365) / 30); const remaining = days - years * 365 - months * 30;
  return [years ? `${years} ano(s)` : "", months ? `${months} mês(es)` : "", `${remaining} dia(s)`].filter(Boolean).join(", ");
};
const normalize = (value: unknown) => String(value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const countBy = (items: ReportRecord[], getter: (item: ReportRecord) => unknown): Array<[string, number]> => {
  const counts = new Map<string, number>();
  items.forEach((item) => { const key = String(getter(item) || "Não informado"); counts.set(key, (counts.get(key) || 0) + 1); });
  return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
};

export function exportAdministrativeReport(data: AdministrativeReportData) {
  const generatedAt = new Date();
  const generatedLabel = generatedAt.toLocaleString("pt-BR");
  const payload = (row: ReportRecord) => asRecord(row.payload);

  const teamRows = data.teamMembers.map((row) => {
    const p = payload(row); const history = Array.isArray(p.history) ? p.history : [];
    const termination = history.slice().reverse().find((item: unknown) => /demit|deslig|encerr/i.test(String(item)));
    const joinedAt = text(p.joinedAt, p.joined_at, row.created_at);
    return {
      Nome: text(row.name, p.name), Passaporte: text(row.passport, p.passport), CRM: text(p.crm), Cargo: text(row.hospital_role, p.hospitalRole, p.role),
      Especialidade: text(p.specialty), Departamento: text(p.department), Status: text(row.status, p.status, "Ativo"), "Data de entrada": dateText(joinedAt),
      "Tempo de contrato": durationText(joinedAt, termination ? row.updated_at : undefined), "Última atualização": dateText(row.updated_at),
      Promoções: history.filter((item: unknown) => /promov/i.test(String(item))).join(" | "), Rebaixamentos: history.filter((item: unknown) => /rebaix/i.test(String(item))).join(" | "),
      "Demissões / desligamentos": history.filter((item: unknown) => /demit|deslig|encerr/i.test(String(item))).join(" | "), "Histórico completo": history.join(" | "),
    };
  });

  const applicationRows = data.applications.map((row) => {
    const p = payload(row); const status = text(row.status, p.status, "Pendente");
    return {
      Protocolo: row.id, Nome: text(row.name, p.name), Passaporte: text(row.passport, p.passport), Discord: text(p.discord), Telefone: text(p.cityPhone, p.city_phone),
      "Cargo pretendido": text(row.desired_role, p.desiredRole), "Área de interesse": text(p.interestArea), Disponibilidade: text(p.availability),
      "Data da candidatura": dateText(row.created_at), Status: status, "Resultado da triagem": text(p.triageDecision, status === "Recusado" ? "Recusado" : "Pendente"),
      "Data da decisão": dateText(p.decisionAt), "Entrevista": text(p.interviewStatus, "Não agendada"), "Data da entrevista": dateText(p.interviewAt),
      Comparecimento: /realizada|compareceu/i.test(normalize(text(p.interviewStatus, p.interviewNotes))) ? "Compareceu" : /faltou|nao compareceu/i.test(normalize(text(p.interviewStatus, p.interviewNotes))) ? "Faltou" : "Não informado",
      "Tentativas de contato": listText(text(p.contactAttempts, p.contactHistory, p.contactNotes, p.interviewNotes)), "Resultado final": text(p.interviewResult, status),
      "Contratado": /contratado/i.test(normalize(text(p.interviewResult, status))) && !/nao contratado/i.test(normalize(text(p.interviewResult, status))) ? "Sim" : "Não",
      Observações: text(p.interviewNotes, p.notes), Motivação: text(p.motivation), Experiência: text(p.experience, p.priorExperience),
    };
  });

  const requestRows = data.registrationRequests.map((row) => { const p = payload(row); return {
    Protocolo: row.id, Nome: text(row.name, p.name), Passaporte: text(row.passport, p.passport), "Cargo solicitado": text(row.requested_role, p.requestedRole),
    Status: text(row.status, p.status, "Pendente"), "Data da solicitação": dateText(row.created_at), "Última atualização": dateText(row.updated_at),
    Discord: text(p.discord), Telefone: text(p.cityPhone), CRM: text(p.crm), Especialidade: text(p.specialty), Observações: text(p.notes, p.reason),
  }; });

  const patientRows = data.patients.map((row) => ({
    Nome: row.name, Passaporte: row.passport, "Data de nascimento": dateText(row.birth_date), Idade: row.age, "Tipo sanguíneo": row.blood_type,
    Telefone: row.city_phone, Email: row.email, "Cadastrado em": dateText(row.created_at), "Última atualização": dateText(row.updated_at), "Cadastrado por": row.created_by,
  }));

  const appointmentRows = data.appointments.map((row) => { const p = payload(row); return {
    Protocolo: row.id, Paciente: text(row.patient, p.patientName, p.name), Passaporte: text(row.passport, p.passport), Status: text(row.status, p.status),
    Tipo: text(p.type, p.specialty, p.service), Médico: text(p.doctorName, p.doctor), "Data solicitada": dateText(text(p.requestedAt, p.date, row.created_at)),
    "Data agendada": dateText(text(p.scheduledAt, p.appointmentAt)), "Comparecimento": text(p.attendanceStatus, p.attendance, /nao compareceu/i.test(normalize(row.status)) ? "Não compareceu" : ""),
    Motivo: text(p.reason, p.complaint), Observações: text(p.notes, p.observation), "Última atualização": dateText(row.updated_at),
  }; });

  const clinicalRows = data.clinicalRecords.map((row) => { const p = payload(row); return {
    ID: row.id, "Passaporte do paciente": row.patient_passport, "Tipo de registro": row.record_type, Título: text(p.title, p.examName, p.documentType, p.name),
    Resultado: text(p.result, p.status, p.conclusion), Profissional: text(p.doctorName, p.createdByName, row.created_by), "Data do registro": dateText(row.created_at),
    "Última atualização": dateText(row.updated_at), Observações: text(p.notes, p.description, p.findings), "Dados complementares": JSON.stringify(p),
  }; });

  const receiptRows = data.receipts.map((row) => { const p = payload(row); return {
    Recibo: text(row.number, p.number), "Data de emissão": dateText(text(p.createdAt, row.created_at)), "Emitido por": text(p.issuedBy), CRM: text(p.issuerCrm),
    Convênio: text(p.convenio), Itens: Array.isArray(p.items) ? p.items.map((item: ReportRecord) => `${item.name} (${item.quantity} × ${moneyText(item.unitPrice)})`).join(" | ") : "",
    "Total de itens": Array.isArray(p.items) ? p.items.length : 0, Unidades: Number(p.totalUnits || 0), Subtotal: moneyText(p.subtotal), Desconto: moneyText(p.discountValue), Total: moneyText(text(row.total, p.total)),
  }; });

  const receiptItemRows = data.receipts.flatMap((row) => { const p = payload(row); return (Array.isArray(p.items) ? p.items : []).map((item: ReportRecord) => ({
    Recibo: text(row.number, p.number), Data: dateText(text(p.createdAt, row.created_at)), Item: item.name, Quantidade: item.quantity, "Valor unitário": moneyText(item.unitPrice), Total: moneyText(item.total), Convênio: p.convenio,
  })); });

  const planRows = data.planEntries.map((row) => { const p = payload(row); return {
    Plano: text(row.plan_name, p.planName), Titular: text(p.holderName), "Passaporte do titular": text(row.holder_passport, p.holderPassport), Valor: moneyText(text(row.value, p.value)),
    "Ativação": dateText(p.activatedAt), "Validade": dateText(p.expiresAt), Dependentes: Number(p.dependentsCount || 0), "Registrado por": text(p.registeredBy), "Data do registro": dateText(row.created_at),
  }; });

  const activityRows = data.activities.map((row) => ({ Data: dateText(text(row.created_at, row.createdAt)), Módulo: row.module, Ação: row.action, Descrição: row.description, Responsável: row.actor, Referência: row.reference }));
  const movementRows = activityRows.filter((row) => /equipe|membro|cargo|promoc|rebaix|demiss|deslig|contrat|cadastro/i.test(normalize(`${row.Módulo} ${row.Ação} ${row.Descrição}`)));
  const profileNames = new Map((data.profiles || []).map((row) => [String(row.id), text(row.name, row.passport, row.id)]));
  const timeRows = data.timeEntries.map((row) => ({ Profissional: text(row.profile_name, row.user_name, profileNames.get(String(row.user_id)), row.user_id), Status: row.status, Entrada: dateText(row.opened_at), Saída: dateText(row.closed_at), "Tempo trabalhado": secondsText(row.worked_seconds), "Data do registro": dateText(row.created_at) }));
  const auditRows = data.timeAudits.map((row) => ({ Data: dateText(row.created_at), Ação: row.action, Motivo: row.reason, "Profissional afetado": text(profileNames.get(String(row.target_user_id)), row.target_user_id), Responsável: text(profileNames.get(String(row.actor_user_id)), row.actor_user_id), "Dados anteriores": JSON.stringify(row.previous_data || {}), "Novos dados": JSON.stringify(row.new_data || {}) }));

  const examRecords = clinicalRows.filter((row) => /exame|laudo|laborat|imagem|psicotecn/i.test(normalize(`${row["Tipo de registro"]} ${row.Título}`)));
  const examRanking = countBy(examRecords, (row) => text(row.Título, row["Tipo de registro"])).map(([name, count], index) => ({ Posição: index + 1, Exame: name, Quantidade: count }));
  const serviceRanking = countBy(receiptItemRows, (row) => row.Item).map(([name, count], index) => ({ Posição: index + 1, Serviço: name, Quantidade: count }));
  const financialSummary = [
    { Indicador: "Recibos emitidos", Valor: data.receipts.length },
    { Indicador: "Receita bruta registrada", Valor: moneyText(data.receipts.reduce((sum, row) => sum + Number(text(row.total, payload(row).total) || 0), 0)) },
    { Indicador: "Descontos concedidos", Valor: moneyText(data.receipts.reduce((sum, row) => sum + Number(payload(row).discountValue || 0), 0)) },
    { Indicador: "Planos cadastrados", Valor: data.planEntries.length },
    { Indicador: "Valor dos planos", Valor: moneyText(data.planEntries.reduce((sum, row) => sum + Number(text(row.value, payload(row).value) || 0), 0)) },
  ];

  const statusCount = (pattern: RegExp) => applicationRows.filter((row) => pattern.test(normalize(`${row.Status} ${row["Resultado da triagem"]} ${row.Entrevista} ${row.Comparecimento} ${row["Resultado final"]}`))).length;
  const kpis = [
    ["Atividades", data.activities.length], ["Equipe", data.teamMembers.length], ["Pacientes", data.patients.length], ["Candidaturas", data.applications.length],
    ["Aprovados", statusCount(/aprovado/)], ["Recusados", statusCount(/recusado/)], ["Entrevistas agendadas", statusCount(/agendada/)], ["Compareceram", statusCount(/compareceu/)],
    ["Faltaram", statusCount(/faltou|nao compareceu/)], ["Sem resposta", statusCount(/sem resposta/)], ["Contratados", statusCount(/contratado/) - statusCount(/nao contratado/)], ["Não contratados", statusCount(/nao contratado/)],
    ["Agendamentos", data.appointments.length], ["Registros clínicos", data.clinicalRecords.length], ["Recibos", data.receipts.length], ["Receita", moneyText(data.receipts.reduce((sum, row) => sum + Number(text(row.total, payload(row).total) || 0), 0))],
  ];

  const escapeXml = (value: unknown) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");
  const cell = (value: unknown, style = "Body") => `<Cell ss:StyleID="${style}"><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`;
  const numberCell = (value: number, style = "KpiValue") => `<Cell ss:StyleID="${style}"><Data ss:Type="Number">${Number(value || 0)}</Data></Cell>`;
  const statusStyle = (value: unknown) => /aprov|contrat|ativo|realiz|compareceu|confirm/i.test(normalize(value)) && !/nao contratado|não contratado/.test(normalize(value)) ? "StatusSuccess" : /recus|demit|deslig|faltou|nao compareceu|não compareceu/.test(normalize(value)) ? "StatusDanger" : /pendente|agendada|sem resposta|nao inform/.test(normalize(value)) ? "StatusWarning" : "Body";
  const columnWidth = (header: string) => /descri|observ|hist|dados|itens|motivo|experi|tentativas/i.test(header) ? 260 : /nome|cargo|especial|depart|servi|exame|titulo/i.test(header) ? 160 : /data|entrada|saida|atualiza/i.test(header) ? 125 : /status|resultado|entrevista|comparecimento/i.test(header) ? 135 : 110;
  const worksheet = (name: string, title: string, rows: ReportRecord[]) => {
    const headers = rows.length ? Array.from(new Set(rows.flatMap((row) => Object.keys(row)))) : ["Informação"];
    const columns = headers.map((header) => `<Column ss:AutoFitWidth="0" ss:Width="${columnWidth(header)}"/>`).join("");
    const header = `<Row ss:Height="28">${headers.map((item) => cell(item, "Header")).join("")}</Row>`;
    const body = rows.length ? rows.map((row, index) => `<Row ss:AutoFitHeight="1">${headers.map((key) => cell(row[key], /status|resultado|entrevista|comparecimento/i.test(key) ? statusStyle(row[key]) : index % 2 ? "BodyAlt" : "Body")).join("")}</Row>`).join("") : `<Row><Cell ss:StyleID="Empty"><Data ss:Type="String">Nenhum registro disponível.</Data></Cell></Row>`;
    return `<Worksheet ss:Name="${escapeXml(name.slice(0, 31))}"><Table>${columns}<Row ss:Height="30"><Cell ss:StyleID="SheetTitle" ss:MergeAcross="${Math.max(0, headers.length - 1)}"><Data ss:Type="String">${escapeXml(title)}</Data></Cell></Row><Row ss:Height="22"><Cell ss:StyleID="SheetSubtitle" ss:MergeAcross="${Math.max(0, headers.length - 1)}"><Data ss:Type="String">${escapeXml(`${data.periodLabel} · Gerado em ${generatedLabel}`)}</Data></Cell></Row><Row ss:Height="8"/>${header}${body}</Table><AutoFilter x:Range="R4C1:R${Math.max(4, rows.length + 4)}C${headers.length}" xmlns="urn:schemas-microsoft-com:office:excel"/><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>4</SplitHorizontal><TopRowBottomPane>4</TopRowBottomPane><PageSetup><Layout x:Orientation="Landscape"/></PageSetup></WorksheetOptions></Worksheet>`;
  };

  const summaryRows = Array.from({ length: Math.ceil(kpis.length / 4) }, (_, rowIndex) => `<Row ss:Height="24">${kpis.slice(rowIndex * 4, rowIndex * 4 + 4).flatMap(([label, value]) => [cell(label, "KpiLabel"), typeof value === "number" ? numberCell(value) : cell(value, "KpiValue")]).join("")}</Row>`).join("");
  const summary = `<Worksheet ss:Name="Visão geral"><Table><Column ss:Width="150"/><Column ss:Width="95"/><Column ss:Width="150"/><Column ss:Width="95"/><Column ss:Width="150"/><Column ss:Width="95"/><Column ss:Width="150"/><Column ss:Width="120"/><Row ss:Height="36"><Cell ss:StyleID="ReportTitle" ss:MergeAcross="7"><Data ss:Type="String">HOSPITAL SÃO RAFAEL — RELATÓRIO GERAL DO SISTEMA</Data></Cell></Row><Row ss:Height="25"><Cell ss:StyleID="ReportSubtitle" ss:MergeAcross="7"><Data ss:Type="String">${escapeXml(`${data.periodLabel} · Gerado por ${data.generatedBy || "Direção"} em ${generatedLabel} · Documento interno e confidencial`)}</Data></Cell></Row><Row ss:Height="10"/><Row ss:Height="24"><Cell ss:StyleID="SectionTitle" ss:MergeAcross="7"><Data ss:Type="String">Resumo consolidado</Data></Cell></Row>${summaryRows}<Row ss:Height="12"/><Row ss:Height="24"><Cell ss:StyleID="SectionTitle" ss:MergeAcross="7"><Data ss:Type="String">Conteúdo do relatório</Data></Cell></Row><Row ss:Height="68"><Cell ss:StyleID="Note" ss:MergeAcross="7"><Data ss:Type="String">O arquivo reúne movimentações do sistema, equipe e contratos, candidaturas e entrevistas, solicitações de cadastro, pacientes, agendamentos, registros clínicos, exames, finanças, planos e registros de ponto. Cada aba possui filtros e cabeçalho fixo.</Data></Cell></Row></Table><WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel"><FreezePanes/><FrozenNoSplit/><SplitHorizontal>2</SplitHorizontal><TopRowBottomPane>2</TopRowBottomPane></WorksheetOptions></Worksheet>`;

  const styles = `<Styles><Style ss:ID="Default" ss:Name="Normal"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="10" ss:Color="#2A211D"/></Style><Style ss:ID="ReportTitle"><Alignment ss:Vertical="Center"/><Font ss:FontName="Arial" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#672614" ss:Pattern="Solid"/></Style><Style ss:ID="ReportSubtitle"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Color="#6B554A"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/></Style><Style ss:ID="SheetTitle"><Alignment ss:Vertical="Center"/><Font ss:Size="14" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#672614" ss:Pattern="Solid"/></Style><Style ss:ID="SheetSubtitle"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Color="#6B554A"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/></Style><Style ss:ID="SectionTitle"><Font ss:Size="11" ss:Bold="1" ss:Color="#672614"/><Interior ss:Color="#F5E7D8" ss:Pattern="Solid"/></Style><Style ss:ID="Header"><Alignment ss:Horizontal="Center" ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#7A321D" ss:Pattern="Solid"/></Style><Style ss:ID="Body"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:Size="9"/><Interior ss:Color="#FFFFFF" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DDD5"/></Borders></Style><Style ss:ID="BodyAlt"><Alignment ss:Vertical="Top" ss:WrapText="1"/><Font ss:Size="9"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/><Borders><Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#E8DDD5"/></Borders></Style><Style ss:ID="Empty"><Alignment ss:Horizontal="Center"/><Font ss:Italic="1" ss:Color="#806B61"/></Style><Style ss:ID="StatusSuccess"><Alignment ss:Horizontal="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#17633A"/><Interior ss:Color="#DDF4E6" ss:Pattern="Solid"/></Style><Style ss:ID="StatusDanger"><Alignment ss:Horizontal="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#A12626"/><Interior ss:Color="#FBE1E1" ss:Pattern="Solid"/></Style><Style ss:ID="StatusWarning"><Alignment ss:Horizontal="Center" ss:WrapText="1"/><Font ss:Bold="1" ss:Color="#8A5A00"/><Interior ss:Color="#FFF0C9" ss:Pattern="Solid"/></Style><Style ss:ID="KpiLabel"><Alignment ss:Horizontal="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Bold="1" ss:Color="#6B554A"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/></Style><Style ss:ID="KpiValue"><Alignment ss:Horizontal="Center"/><Font ss:Size="13" ss:Bold="1" ss:Color="#672614"/></Style><Style ss:ID="Note"><Alignment ss:Vertical="Center" ss:WrapText="1"/><Font ss:Size="9" ss:Color="#6B554A"/><Interior ss:Color="#FFF8F0" ss:Pattern="Solid"/></Style></Styles>`;

  const extraWorksheets = (data.extraSections || []).map((section) => worksheet(section.name, section.title, section.rows.map((row) => { const p = payload(row); const clean: ReportRecord = {}; Object.entries(row).forEach(([key, value]) => { if (key !== "payload") clean[key] = /_at$|date|data/i.test(key) ? dateText(value) : typeof value === "object" ? JSON.stringify(value) : value; }); Object.entries(p).forEach(([key, value]) => { clean[`Detalhe: ${key}`] = Array.isArray(value) ? listText(value) : typeof value === "object" ? JSON.stringify(value) : value; }); return clean; }))).join("");

  const workbook = `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><DocumentProperties xmlns="urn:schemas-microsoft-com:office:office"><Title>Relatório Geral do Sistema</Title><Author>Hospital São Rafael</Author><Created>${generatedAt.toISOString()}</Created></DocumentProperties>${styles}${summary}${worksheet("Movimentações", "Todas as movimentações do sistema", activityRows)}${worksheet("Mov. de equipe", "Movimentações de membros e equipe", movementRows)}${worksheet("Equipe e contratos", "Equipe, cargos e tempo de contrato", teamRows)}${worksheet("Candidaturas", "Formulários, triagem, contatos e entrevistas", applicationRows)}${worksheet("Cadastros profissionais", "Solicitações de cadastro profissional", requestRows)}${worksheet("Pacientes", "Pacientes cadastrados", patientRows)}${worksheet("Agendamentos", "Solicitações, consultas e comparecimentos", appointmentRows)}${worksheet("Registros clínicos", "Registros clínicos, documentos e exames", clinicalRows)}${worksheet("Ranking de exames", "Exames mais realizados", examRanking)}${worksheet("Financeiro - resumo", "Resumo das movimentações financeiras", financialSummary)}${worksheet("Financeiro - recibos", "Recibos emitidos", receiptRows)}${worksheet("Financeiro - itens", "Serviços e exames faturados", receiptItemRows)}${worksheet("Ranking de serviços", "Serviços mais registrados", serviceRanking)}${worksheet("Planos", "Planos e beneficiários", planRows)}${worksheet("Ponto e jornadas", "Jornadas e tempo trabalhado", timeRows)}${worksheet("Auditoria de ponto", "Ajustes administrativos de ponto", auditRows)}${extraWorksheets}${worksheet("Cobertura do relatório", "Fontes consultadas e eventuais limitações", (data.warnings || []).length ? (data.warnings || []).map((warning) => ({ Aviso: warning })) : [{ Status: "Todas as fontes foram consultadas sem erro." }])}</Workbook>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" }); const url = URL.createObjectURL(blob); const anchor = document.createElement("a");
  anchor.href = url; anchor.download = `relatorio-geral-hpsr-${generatedAt.toISOString().slice(0, 10)}.xls`; document.body.appendChild(anchor); anchor.click(); anchor.remove(); URL.revokeObjectURL(url);
}

function secondsText(value: unknown) { const seconds = Math.max(0, Number(value || 0)); const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return `${hours}h ${minutes}min`; }
