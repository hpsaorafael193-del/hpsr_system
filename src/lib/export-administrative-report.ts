import { downloadXlsx, type XlsxSheetDefinition } from "@/lib/xlsx-writer";

export type AdministrativeMember = { name: string; passport?: string; crm?: string; hospitalRole?: string; specialty?: string; department?: string; joinedAt?: string; history?: string[]; };

export type ReportRecord = Record<string, any>;

export type AdministrativeReportData = {
  periodLabel: string;
  generatedBy?: string;
  warnings?: string[];
  operationalStart?: string;
  profiles?: ReportRecord[];
  activities: ReportRecord[];
  teamMembers: ReportRecord[];
  applications: ReportRecord[];
  registrationRequests: ReportRecord[];
  patients: ReportRecord[];
  patientAccounts?: ReportRecord[];
  patientPortalAccess?: ReportRecord[];
  appointments: ReportRecord[];
  clinicalRecords: ReportRecord[];
  receipts: ReportRecord[];
  planEntries: ReportRecord[];
  timeEntries: ReportRecord[];
  timeAudits: ReportRecord[];
  extraSections?: Array<{ name: string; title: string; rows: ReportRecord[] }>;
};

const asRecord = (value: unknown): ReportRecord => value && typeof value === "object" && !Array.isArray(value) ? value as ReportRecord : {};
const text = (...values: unknown[]): string => {
  const value = values.find((item) => item !== undefined && item !== null && String(item).trim() !== "");
  return value === undefined || value === null ? "" : String(value);
};
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

export async function exportAdministrativeReport(data: AdministrativeReportData) {
  const generatedAt = new Date();
  const generatedLabel = generatedAt.toLocaleString("pt-BR");
  const payload = (row: ReportRecord) => asRecord(row.payload);

  const teamSource = (() => {
    const byKey = new Map<string, ReportRecord>();
    for (const row of data.teamMembers) {
      const p = payload(row);
      const key = normalize(text(row.passport, p.passport, row.id));
      if (key) byKey.set(key, row);
    }
    for (const profile of data.profiles || []) {
      const key = normalize(text(profile.passport, profile.id));
      if (!key) continue;
      const existing = byKey.get(key);
      if (existing) {
        const existingPayload = payload(existing);
        byKey.set(key, {
          ...profile,
          ...existing,
          payload: {
            name: profile.name,
            passport: profile.passport,
            crm: profile.crm,
            role: profile.role,
            specialty: profile.specialty,
            department: profile.department,
            serviceStatus: profile.service_status,
            joinedAt: profile.created_at,
            ...existingPayload,
          },
          created_at: text(existing.created_at, profile.created_at),
          updated_at: text(existing.updated_at, profile.updated_at),
        });
      } else {
        byKey.set(key, {
          id: profile.id,
          name: profile.name,
          passport: profile.passport,
          hospital_role: profile.role,
          status: /desativ|inativ|removid/i.test(normalize(text(profile.access_status, profile.service_status))) ? 'Inativo' : 'Ativo',
          created_at: profile.created_at,
          updated_at: profile.updated_at,
          payload: {
            crm: profile.crm,
            specialty: profile.specialty,
            department: profile.department,
            joinedAt: profile.created_at,
            serviceStatus: profile.service_status,
            accessStatus: profile.access_status,
            source: 'profiles',
          },
        });
      }
    }
    return Array.from(byKey.values()).sort((a, b) => new Date(text(a.created_at, 0)).getTime() - new Date(text(b.created_at, 0)).getTime());
  })();

  const teamRows = teamSource.map((row) => {
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

  const normalizePassport = (value: unknown) => String(value ?? "").trim().toUpperCase();
  const normalizeEmail = (value: unknown) => String(value ?? "").trim().toLowerCase();
  const isSyntheticPortalEmail = (value: string) => /^portal-direto\+[^@]+@hpsr\.local$/i.test(value);
  const verifiedPatientEmails = new Map<string, string>();

  for (const row of data.patientAccounts || []) {
    const passport = normalizePassport(text(row.patient_passport, row.passport));
    const email = normalizeEmail(row.email);
    if (passport && email && !isSyntheticPortalEmail(email)) verifiedPatientEmails.set(passport, email);
  }
  for (const row of data.patientPortalAccess || []) {
    const passport = normalizePassport(text(row.patient_passport, row.passport));
    const email = normalizeEmail(row.email);
    if (passport && email && !isSyntheticPortalEmail(email) && !verifiedPatientEmails.has(passport)) verifiedPatientEmails.set(passport, email);
  }

  const patientRows = data.patients.map((row) => {
    const passport = normalizePassport(row.passport);
    const verifiedEmail = verifiedPatientEmails.get(passport) || "";
    return {
      Nome: row.name, Passaporte: row.passport, "Data de nascimento": dateText(row.birth_date), Idade: row.age, "Tipo sanguíneo": row.blood_type,
      Telefone: row.city_phone, Email: verifiedEmail, "Cadastrado em": dateText(row.created_at), "Última atualização": dateText(row.updated_at), "Cadastrado por": row.created_by,
    };
  });

  const appointmentRows = data.appointments.map((row) => { const p = payload(row); return {
    Protocolo: row.id, Paciente: text(row.patient, p.patientName, p.name), Passaporte: text(row.passport, p.passport), Status: text(row.status, p.status),
    Tipo: text(p.type, p.specialty, p.service), Médico: text(p.doctorName, p.doctor), "Solicitado por": text(p.requestedByRelationship), "Passaporte do responsável": text(p.requestedByPassport), "Data solicitada": dateText(text(p.requestedAt, p.date, row.created_at)),
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

  const contractsRows = teamRows.map((row) => ({
    Nome: row.Nome,
    Passaporte: row.Passaporte,
    Cargo: row.Cargo,
    Especialidade: row.Especialidade,
    Status: row.Status,
    "Data de entrada": row["Data de entrada"],
    "Tempo de contrato": row["Tempo de contrato"],
  }));
  const promotionRowsFromActivities = movementRows
    .filter((row) => /promov|promoção|promocao|cargo alterado|cargo atualizado|mudança de cargo|mudanca de cargo/i.test(normalize(`${row.Ação} ${row.Descrição}`)))
    .map((row) => ({
      Data: row.Data,
      Profissional: text(row.Referência),
      "Cargo anterior": "",
      "Cargo novo": "",
      "Registrado por": row.Responsável,
      Origem: "Atividades do sistema",
      Detalhes: `${text(row.Ação)}${row.Descrição ? ` — ${row.Descrição}` : ""}`,
    }));

  const extractHistoryDate = (entry: string) => {
    const match = entry.match(/(?:em|registrado em)\s+(\d{1,2}\/\d{1,2}\/\d{4}(?:,?\s+\d{1,2}:\d{2}(?::\d{2})?)?)/i);
    return match?.[1] || "";
  };
  const promotionRowsFromTeam = teamSource.flatMap((row) => {
    const p = payload(row);
    const history = Array.isArray(p.history) ? p.history.map(String) : [];
    return history.flatMap((entry) => {
      const normalizedEntry = normalize(entry);
      const roleChange = entry.match(/cargo\s+(?:foi\s+)?alterado\s+de\s+(.+?)\s+para\s+(.+?)(?:\s+em\s+|\.|$)/i);
      const explicitPromotion = /promov|promoção|promocao|especializa|novo contrato de residente/i.test(normalizedEntry);
      if (!roleChange && !explicitPromotion) return [];
      return [{
        Data: extractHistoryDate(entry),
        Profissional: text(row.name, p.name),
        Passaporte: text(row.passport, p.passport),
        "Cargo anterior": roleChange?.[1]?.trim() || "Não informado",
        "Cargo novo": roleChange?.[2]?.trim() || text(row.hospital_role, p.hospitalRole, p.role),
        "Registrado por": text(p.updatedBy, p.updated_by),
        Origem: "Histórico da equipe",
        Detalhes: entry,
      }];
    });
  });

  const promotionKey = (row: ReportRecord) => normalize(`${row.Profissional}|${row.Passaporte}|${row.Data}|${row["Cargo anterior"]}|${row["Cargo novo"]}|${row.Detalhes}`);
  const promotionRows = Array.from(
    new Map([...promotionRowsFromTeam, ...promotionRowsFromActivities].map((row) => [promotionKey(row), row])).values(),
  ).sort((a, b) => new Date(String(b.Data || 0)).getTime() - new Date(String(a.Data || 0)).getTime());
  const requestedExitRows = movementRows.filter((row) => /pediu desligamento|solicitou desligamento|pedido de desligamento/i.test(normalize(`${row.Ação} ${row.Descrição}`)));
  const dismissalRows = movementRows.filter((row) => /demit|desligad|removid|encerramento de contrato/i.test(normalize(`${row.Ação} ${row.Descrição}`)) && !/pediu desligamento|solicitou desligamento|pedido de desligamento/i.test(normalize(`${row.Ação} ${row.Descrição}`)));

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
    ["Atividades", data.activities.length], ["Equipe", teamRows.length], ["Pacientes", data.patients.length], ["Candidaturas", data.applications.length],
    ["Aprovados", statusCount(/aprovado/)], ["Recusados", statusCount(/recusado/)], ["Entrevistas agendadas", statusCount(/agendada/)], ["Compareceram", statusCount(/compareceu/)],
    ["Faltaram", statusCount(/faltou|nao compareceu/)], ["Sem resposta", statusCount(/sem resposta/)], ["Contratados", statusCount(/contratado/) - statusCount(/nao contratado/)], ["Não contratados", statusCount(/nao contratado/)],
    ["Agendamentos", data.appointments.length], ["Registros clínicos", data.clinicalRecords.length], ["Recibos", data.receipts.length], ["Receita", moneyText(data.receipts.reduce((sum, row) => sum + Number(text(row.total, payload(row).total) || 0), 0))],
  ];

  const cleanExtraRows = (data.extraSections || []).map((section) => ({
    name: section.name,
    title: section.title,
    rows: section.rows.map((row) => {
      const p = payload(row);
      const clean: ReportRecord = {};
      Object.entries(row).forEach(([key, value]) => {
        if (key !== "payload") clean[key] = /_at$|date|data/i.test(key) ? dateText(value) : typeof value === "object" ? JSON.stringify(value) : value;
      });
      Object.entries(p).forEach(([key, value]) => {
        clean[`Detalhe: ${key}`] = Array.isArray(value) ? listText(value) : typeof value === "object" ? JSON.stringify(value) : value;
      });
      return clean;
    }),
  }));

  const summaryRows: ReportRecord[] = kpis.map(([Indicador, Valor]) => ({ Indicador, Valor }));
  summaryRows.unshift({
    Indicador: "Início da operação registrada",
    Valor: data.operationalStart ? dateText(data.operationalStart) : "Data mais antiga disponível no banco",
  });
  summaryRows.push({
    Indicador: "Conteúdo do relatório",
    Valor: "Movimentações, equipe e contratos, candidaturas e entrevistas, cadastros profissionais, pacientes, agendamentos, registros clínicos, exames, finanças, planos e registros de ponto.",
  });

  const subtitle = `${data.periodLabel} · Histórico preservado desde o início da operação registrada · Gerado por ${data.generatedBy || "Direção"} em ${generatedLabel}`;
  const sheets: XlsxSheetDefinition[] = [
    { name: "Visão geral", title: "HOSPITAL SÃO RAFAEL — RELATÓRIO GERAL DO SISTEMA", subtitle, rows: summaryRows },
    { name: "Movimentações", title: "Todas as movimentações do sistema", subtitle, rows: activityRows },
    { name: "Mov. de equipe", title: "Movimentações de membros e equipe", subtitle, rows: movementRows },
    { name: "Equipe atual", title: "Equipe ativa e situação atual", subtitle, rows: teamRows },
    { name: "Contratações", title: "Contratações e tempo de contrato", subtitle, rows: contractsRows },
    { name: "Promoções", title: "Histórico de promoções", subtitle, rows: promotionRows },
    { name: "Desligamentos pedidos", title: "Membros que solicitaram desligamento", subtitle, rows: requestedExitRows },
    { name: "Demissões", title: "Demissões, remoções e encerramentos", subtitle, rows: dismissalRows },
    { name: "Candidaturas", title: "Formulários, triagem, contatos e entrevistas", subtitle, rows: applicationRows },
    { name: "Cadastros profissionais", title: "Solicitações de cadastro profissional", subtitle, rows: requestRows },
    { name: "Pacientes", title: "Pacientes cadastrados", subtitle, rows: patientRows },
    { name: "Agendamentos", title: "Solicitações, consultas e comparecimentos", subtitle, rows: appointmentRows },
    { name: "Registros clínicos", title: "Registros clínicos, documentos e exames", subtitle, rows: clinicalRows },
    { name: "Ranking de exames", title: "Exames mais realizados", subtitle, rows: examRanking },
    { name: "Financeiro - resumo", title: "Resumo das movimentações financeiras", subtitle, rows: financialSummary },
    { name: "Financeiro - recibos", title: "Recibos emitidos", subtitle, rows: receiptRows },
    { name: "Financeiro - itens", title: "Serviços e exames faturados", subtitle, rows: receiptItemRows },
    { name: "Ranking de serviços", title: "Serviços mais registrados", subtitle, rows: serviceRanking },
    { name: "Planos", title: "Planos e beneficiários", subtitle, rows: planRows },
    { name: "Ponto e jornadas", title: "Jornadas e tempo trabalhado", subtitle, rows: timeRows },
    { name: "Auditoria de ponto", title: "Ajustes administrativos de ponto", subtitle, rows: auditRows },
    ...cleanExtraRows.map((section) => ({ ...section, subtitle })),
    {
      name: "Cobertura do relatório",
      title: "Fontes consultadas e eventuais limitações",
      subtitle,
      rows: (data.warnings || []).length
        ? (data.warnings || []).map((warning) => ({ Aviso: warning }))
        : [{ Status: "Todas as fontes foram consultadas sem erro." }],
    },
  ];

  await downloadXlsx(`relatorio-geral-hpsr-${generatedAt.toISOString().slice(0, 10)}.xlsx`, sheets);

}

function secondsText(value: unknown) { const seconds = Math.max(0, Number(value || 0)); const hours = Math.floor(seconds / 3600); const minutes = Math.floor((seconds % 3600) / 60); return `${hours}h ${minutes}min`; }
