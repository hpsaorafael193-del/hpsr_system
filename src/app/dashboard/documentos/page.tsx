"use client";

import { brazilIso } from "@/lib/brazil-datetime";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { EditorFontSizeMenu } from "@/components/ui/EditorFontSizeMenu";
import { ExamEditorCaret } from "@/components/dashboard/ExamEditorCaret";
import { renderSavedDocumentCanvas, measureDocumentReportHtml } from "@/lib/document-page-canvas";
import { captureDocumentSnapshot, type DocumentRenderSnapshot } from "@/lib/clinical-render-snapshot";
import { useVirtualPngPreview } from "@/lib/use-virtual-png-preview";
import { useExamDraft } from "@/lib/use-exam-draft";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Check,
  ChevronDown,
  ClipboardList,
  ClipboardPaste,
  Eraser,
  Highlighter,
  CaseUpper,
  CaseLower,
  Download,
  Eye,
  FileSignature,
  FileText,
  HeartPulse,
  ShieldCheck,
  Italic,
  List,
  ListOrdered,
  ReceiptText,
  RefreshCw,
  Save,
  Search,
  Send,
  Stethoscope,
  Table2,
  Type,
  Underline,
  UserPlus,
  UserRound,
  Wand2,
  X,
  type LucideIcon,
} from "lucide-react";
import { hpsrSuccess } from "@/components/ui/HpsrToastProvider";
import { ClinicalHistoryPanel } from "@/components/dashboard/ClinicalHistoryPanel";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { usePatientSelection } from "@/components/patients/PatientSelectionProvider";
import { createClient } from "@/lib/supabase";
import { findActiveAppointmentContext } from "@/lib/appointment-context";
import { handleRichEditorTableKeyDown } from "@/lib/rich-editor-behavior";
import { splitClinicalReportHtmlIntoPages } from "@/data/exames/final-renderer";

type PatientDraft = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
};

type DoctorDraft = {
  name: string;
  crm: string;
  role: string;
  specialty: string;
  signatureImage?: string | null;
};

type DoctorOption = Omit<DoctorDraft, "signatureImage"> & {
  id: string;
  signatureStorageKey?: string;
  signatureImage?: string | null;
};

type DocumentCategory =
  | "atestados"
  | "receitas"
  | "declaracoes"
  | "recibos"
  | "orientacoes"
  | "encaminhamentos"
  | "solicitacoes"
  | "relatorios";

type DocumentModel = {
  id: string;
  title: string;
  category: DocumentCategory;
  subtitle: string;
  icon: LucideIcon;
  guidedFields: GuidedField[];
  render: (ctx: RenderContext) => string;
};

type GuidedField = {
  key: string;
  label: string;
  placeholder?: string;
  type?: "text" | "textarea" | "date" | "number";
};

type RenderContext = {
  patient: PatientDraft;
  doctor: DoctorDraft;
  values: Record<string, string>;
  today: string;
};

type AppDialog = {
  title: string;
  message: string;
  actions: {
    label: string;
    variant?: "primary" | "secondary";
    onClick: () => void;
  }[];
} | null;

const emptyPatient: PatientDraft = {
  name: "",
  passport: "",
  age: "",
  bloodType: "",
};

const patientSuggestions: PatientDraft[] = [];

const categoryLabels: Record<DocumentCategory | "todos", string> = {
  todos: "Todos",
  atestados: "Atestados",
  receitas: "Receitas",
  declaracoes: "Declarações",
  recibos: "Recibos",
  orientacoes: "Orientações",
  encaminhamentos: "Encaminhamentos",
  solicitacoes: "Solicitações",
  relatorios: "Relatórios",
};

function brDate(value?: string) {
  const date = value ? new Date(`${value}T00:00:00`) : new Date();
  if (Number.isNaN(date.getTime())) return "__/__/____";
  return date.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function paragraph(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function field(values: Record<string, string>, key: string, fallback = "") {
  return values[key]?.trim() || fallback;
}

const documentModels: DocumentModel[] = [
  {
    id: "atestado-simples",
    title: "Atestado médico simples",
    category: "atestados",
    subtitle: "Afastamento médico com período e observações.",
    icon: FileSignature,
    guidedFields: [
      { key: "dias", label: "Dias de afastamento", placeholder: "Ex.: 3", type: "number" },
      { key: "inicio", label: "Início do afastamento", type: "date" },
      { key: "motivo", label: "Motivo / observação", placeholder: "Ex.: quadro clínico avaliado em consulta", type: "textarea" },
    ],
    render: ({ patient, values, today }) => `
      <h1>ATESTADO MÉDICO</h1>
      <p>Atesto, para os devidos fins, que <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, identificado(a) pelo documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, foi submetido(a) a avaliação médica nesta unidade na data de <strong>${today}</strong>.</p>
      <p>Após avaliação do quadro apresentado e considerando a necessidade de recuperação clínica, recomenda-se o afastamento de suas atividades habituais pelo período de <strong>${escapeHtml(field(values, "dias", "___"))} dia(s)</strong>, com início em <strong>${brDate(field(values, "inicio"))}</strong>.</p>
      ${field(values, "motivo") ? `<p><strong>Observações clínicas pertinentes:</strong><br />${paragraph(field(values, "motivo"))}</p>` : ""}
      <p>O presente documento é emitido a pedido do(a) interessado(a), para fins de comprovação do atendimento e do período de afastamento recomendado, preservadas as informações clínicas sujeitas a sigilo profissional.</p>
    `,
  },
  {
    id: "atestado-comparecimento",
    title: "Atestado de comparecimento",
    category: "atestados",
    subtitle: "Comprovação de presença em consulta/atendimento.",
    icon: Check,
    guidedFields: [
      { key: "data", label: "Data do comparecimento", type: "date" },
      { key: "horario", label: "Horário/período", placeholder: "Ex.: 14h às 15h30" },
      { key: "setor", label: "Setor", placeholder: "Ex.: Clínica médica" },
      { key: "observacoes", label: "Observações", type: "textarea" },
    ],
    render: ({ patient, values }) => `
      <h1>ATESTADO DE COMPARECIMENTO</h1>
      <p>Declaramos, para os devidos fins, que <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, esteve presente no Hospital São Rafael em <strong>${brDate(field(values, "data"))}</strong>, no período de <strong>${escapeHtml(field(values, "horario", "____"))}</strong>, para atendimento junto a esta instituição.</p>
      <p><strong>Setor ou modalidade de atendimento:</strong> ${escapeHtml(field(values, "setor", "____"))}</p>
      ${field(values, "observacoes") ? `<p><strong>Informações complementares:</strong><br />${paragraph(field(values, "observacoes"))}</p>` : ""}
      <p>Este atestado limita-se à comprovação de comparecimento no período informado e é emitido a pedido do(a) paciente para apresentação onde se fizer necessário.</p>
    `,
  },
  {
    id: "receita-simples",
    title: "Receita simples",
    category: "receitas",
    subtitle: "Prescrição médica comum com orientações de uso.",
    icon: ClipboardList,
    guidedFields: [
      { key: "medicamento", label: "Medicamento", placeholder: "Nome, concentração e forma" },
      { key: "dose", label: "Dose", placeholder: "Ex.: 1 comprimido" },
      { key: "frequencia", label: "Frequência", placeholder: "Ex.: a cada 8 horas" },
      { key: "duracao", label: "Duração", placeholder: "Ex.: por 7 dias" },
      { key: "orientacoes", label: "Orientações adicionais", type: "textarea" },
    ],
    render: ({ patient, values, today }) => `
      <h1>RECEITA MÉDICA</h1>
      <p>Prescrição emitida em <strong>${today}</strong> para <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, conforme avaliação realizada.</p>
      <h2>Prescrição</h2>
      <table><tbody>
        <tr><th>Medicamento</th><th>Dose</th><th>Frequência</th><th>Duração</th></tr>
        <tr><td>${escapeHtml(field(values, "medicamento", "____"))}</td><td>${escapeHtml(field(values, "dose", "____"))}</td><td>${escapeHtml(field(values, "frequencia", "____"))}</td><td>${escapeHtml(field(values, "duracao", "____"))}</td></tr>
      </tbody></table>
      ${field(values, "orientacoes") ? `<h2>Orientações de uso</h2><p>${paragraph(field(values, "orientacoes"))}</p>` : "<p><strong>Orientações de uso:</strong> utilizar exclusivamente conforme a posologia descrita e as orientações fornecidas durante o atendimento.</p>"}
      <p>Em caso de reação inesperada, intolerância ou dúvida quanto ao uso, recomenda-se nova orientação profissional antes de qualquer alteração da prescrição.</p>
    `,
  },
  {
    id: "declaracao-medica",
    title: "Declaração médica",
    category: "declaracoes",
    subtitle: "Declaração livre em formato institucional.",
    icon: FileText,
    guidedFields: [
      { key: "finalidade", label: "Finalidade", placeholder: "Ex.: apresentação em instituição/empresa" },
      { key: "conteudo", label: "Texto da declaração", type: "textarea", placeholder: "Digite o conteúdo principal da declaração" },
    ],
    render: ({ patient, values, today }) => `
      <h1>DECLARAÇÃO MÉDICA</h1>
      <p>Declaro, para os devidos fins e especialmente para <strong>${escapeHtml(field(values, "finalidade", "comprovação"))}</strong>, que <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, possui registro de atendimento nesta unidade hospitalar.</p>
      <p>${paragraph(field(values, "conteudo", "A presente declaração é emitida de acordo com as informações registradas durante o atendimento e conforme solicitação do(a) interessado(a)."))}</p>
      <p>Documento emitido em <strong>${today}</strong>, contendo apenas as informações necessárias à finalidade indicada e preservando-se o sigilo das demais informações clínicas.</p>
    `,
  },
  {
    id: "recibo-medico",
    title: "Recibo médico",
    category: "recibos",
    subtitle: "Recibo de atendimento ou serviço médico prestado.",
    icon: ReceiptText,
    guidedFields: [
      { key: "servico", label: "Serviço prestado", placeholder: "Ex.: consulta médica" },
      { key: "valor", label: "Valor", placeholder: "Ex.: R$ 250,00" },
      { key: "pagamento", label: "Forma de pagamento", placeholder: "Ex.: dinheiro, PIX, convênio" },
      { key: "cpf", label: "CPF/CNPJ do responsável", placeholder: "Opcional" },
    ],
    render: ({ patient, values, today }) => `
      <h1>RECIBO MÉDICO</h1>
      <p>Declaro ter recebido de <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, a importância de <strong>${escapeHtml(field(values, "valor", "R$ ____"))}</strong>, referente à prestação do serviço de <strong>${escapeHtml(field(values, "servico", "atendimento médico"))}</strong>.</p>
      <p><strong>Forma de pagamento registrada:</strong> ${escapeHtml(field(values, "pagamento", "____"))}</p>
      ${field(values, "cpf") ? `<p><strong>CPF/CNPJ do responsável pelo pagamento:</strong> ${escapeHtml(field(values, "cpf"))}</p>` : ""}
      <p>Para maior clareza e comprovação do pagamento informado, firma-se o presente recibo em <strong>${today}</strong>, para os fins cabíveis.</p>
    `,
  },
  {
    id: "orientacoes-pos-consulta",
    title: "Orientações pós-consulta",
    category: "orientacoes",
    subtitle: "Folha de orientação ao paciente após atendimento.",
    icon: HeartPulse,
    guidedFields: [
      { key: "cuidados", label: "Cuidados principais", type: "textarea" },
      { key: "sinais", label: "Sinais de alerta", type: "textarea" },
      { key: "retorno", label: "Retorno recomendado", placeholder: "Ex.: em 7 dias ou se piora" },
    ],
    render: ({ patient, values }) => `
      <h1>ORIENTAÇÕES AO PACIENTE</h1>
      <p>As orientações abaixo destinam-se a <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong> e complementam as informações fornecidas durante o atendimento. Devem ser seguidas de acordo com a evolução clínica e com eventuais prescrições associadas.</p>
      <h2>Cuidados principais</h2>
      <p>${paragraph(field(values, "cuidados", "Manter os cuidados gerais orientados durante a consulta, respeitar o período de repouso quando indicado, manter hidratação e alimentação adequadas e utilizar medicamentos somente conforme prescrição."))}</p>
      <h2>Sinais de alerta</h2>
      <p>${paragraph(field(values, "sinais", "Procurar nova avaliação diante de piora importante dos sintomas, dor intensa ou progressiva, febre persistente, dificuldade respiratória, sangramento, alteração do nível de consciência ou qualquer manifestação considerada preocupante."))}</p>
      <h2>Acompanhamento</h2>
      <p>Recomenda-se retorno <strong>${escapeHtml(field(values, "retorno", "conforme orientação médica ou antes, caso haja piora clínica"))}</strong>. Em situações de urgência, procurar atendimento imediato.</p>
    `,
  },
  {
    id: "encaminhamento-medico",
    title: "Encaminhamento médico",
    category: "encaminhamentos",
    subtitle: "Encaminhamento para especialidade, serviço ou avaliação.",
    icon: Send,
    guidedFields: [
      { key: "destino", label: "Destino/especialidade", placeholder: "Ex.: Cardiologia" },
      { key: "motivo", label: "Motivo do encaminhamento", type: "textarea" },
      { key: "prioridade", label: "Prioridade", placeholder: "Rotina / Prioritário / Urgente" },
    ],
    render: ({ patient, values, today }) => `
      <h1>ENCAMINHAMENTO MÉDICO</h1>
      <p>Encaminho <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, para avaliação junto ao serviço/especialidade de <strong>${escapeHtml(field(values, "destino", "____"))}</strong>, a fim de dar continuidade à investigação, avaliação complementar ou condução especializada do caso.</p>
      <h2>Justificativa do encaminhamento</h2>
      <p>${paragraph(field(values, "motivo", "Solicita-se avaliação especializada para complementação da análise clínica e definição de conduta conforme os achados do atendimento atual."))}</p>
      <p><strong>Prioridade sugerida:</strong> ${escapeHtml(field(values, "prioridade", "Rotina"))}</p>
      <p>Encaminhamento emitido em <strong>${today}</strong>. Solicita-se que os achados e a conduta adotada sejam correlacionados ao quadro clínico apresentado.</p>
    `,
  },
  {
    id: "solicitacao-exame",
    title: "Solicitação de exame",
    category: "solicitacoes",
    subtitle: "Pedido de exame com justificativa clínica.",
    icon: Stethoscope,
    guidedFields: [
      { key: "exames", label: "Exames solicitados", type: "textarea" },
      { key: "hipotese", label: "Hipótese/justificativa", type: "textarea" },
      { key: "urgencia", label: "Urgência", placeholder: "Rotina / Prioritário / Urgente" },
    ],
    render: ({ patient, values, today }) => `
      <h1>SOLICITAÇÃO DE EXAME</h1>
      <p>Solicito, para <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, a realização dos exames relacionados abaixo, com a finalidade de complementar a avaliação clínica e subsidiar a definição de conduta.</p>
      <h2>Exames solicitados</h2>
      <p>${paragraph(field(values, "exames", "____"))}</p>
      <h2>Justificativa clínica</h2>
      <p>${paragraph(field(values, "hipotese", "Exames solicitados para investigação complementar e correlação com o quadro apresentado durante o atendimento."))}</p>
      <p><strong>Classificação de prioridade:</strong> ${escapeHtml(field(values, "urgencia", "Rotina"))}</p>
      <p>Solicitação emitida em <strong>${today}</strong>. Os resultados deverão ser interpretados em conjunto com a avaliação clínica e o histórico do(a) paciente.</p>
    `,
  },
  {
    id: "relatorio-medico",
    title: "Relatório médico breve",
    category: "relatorios",
    subtitle: "Relatório médico resumido para acompanhamento.",
    icon: Type,
    guidedFields: [
      { key: "quadro", label: "Quadro clínico", type: "textarea" },
      { key: "conduta", label: "Conduta", type: "textarea" },
      { key: "plano", label: "Plano / acompanhamento", type: "textarea" },
    ],
    render: ({ patient, values, today }) => `
      <h1>RELATÓRIO MÉDICO</h1>
      <p>Relatório referente ao acompanhamento de <strong>${escapeHtml(patient.name || "NOME DO PACIENTE")}</strong>, documento/passaporte <strong>${escapeHtml(patient.passport || "-")}</strong>, elaborado em <strong>${today}</strong> com base nas informações disponíveis no atendimento atual.</p>
      <h2>Quadro clínico e evolução</h2>
      <p>${paragraph(field(values, "quadro", "Descrever os principais achados clínicos, sintomas relevantes, evolução e informações pertinentes ao acompanhamento."))}</p>
      <h2>Conduta adotada</h2>
      <p>${paragraph(field(values, "conduta", "Descrever a conduta estabelecida, orientações fornecidas, medidas terapêuticas e demais providências adotadas."))}</p>
      <h2>Plano e acompanhamento</h2>
      <p>${paragraph(field(values, "plano", "Descrever o planejamento de seguimento, necessidade de retorno, reavaliação, exames ou encaminhamentos quando aplicáveis."))}</p>
      <p>Este relatório tem caráter assistencial e deve ser interpretado em conjunto com o prontuário e demais registros clínicos pertinentes.</p>
    `,
  },
];

function safeFileName(value: string) {
  return (
    (value || "documento")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "documento"
  );
}

function normalizeEditorHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\sdata-[^=]+="[^"]*"/g, "")
    .trim();
}


function Panel({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  const iconMap: Record<string, LucideIcon> = {
    "Informações do documento": ClipboardList,
    "Dados do paciente": UserRound,
    "Profissional responsável": Stethoscope,
    "Catálogo de documentos": FileText,
    "Modelo do documento": Wand2,
    "Modo guiado": Wand2,
  };
  const Icon = iconMap[title] || FileText;
  const isCatalog = title === "Catálogo de documentos";
  const isModel = title === "Modelo do documento";
  return (
    <section className={`overflow-hidden rounded-[18px] border shadow-[0_4px_14px_rgba(42,7,0,0.028)] ${isCatalog ? "border-[#dfc5bc] bg-[#fff8f3]" : isModel ? "border-[#e7d0c0] bg-[#fff9f3]" : "border-[#ead8c8] bg-[#fffaf4]"}`}>
      <div className={`flex items-start gap-3 border-b px-4 py-3 ${isCatalog ? "border-[#ead0c4] bg-[#f5e1d9]" : isModel ? "border-[#ecd8c8] bg-[#fae9df]" : "border-[#eedbca] bg-[#f9eada]"}`}>
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
          <Icon size={17} strokeWidth={2.2} />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[14px] font-black uppercase tracking-[0.06em] text-hpsr-text">{title}</h3>
          {description && <p className="mt-1 text-[13px] font-semibold leading-relaxed text-hpsr-muted">{description}</p>}
        </div>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[12px] font-black uppercase tracking-[0.045em] text-[#5c2416]">
      {children}
    </span>
  );
}

function TextInput({ value, onChange, placeholder, type = "text" }: { value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <input
      className="h-11 w-full min-w-0 rounded-[12px] border border-[#d8bfa9] bg-white px-3.5 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 shadow-[inset_0_1px_2px_rgba(42,7,0,0.03)] hover:border-[#b98f75] focus:border-hpsr-wine/55 focus:ring-2 focus:ring-hpsr-wine/10"
      value={value}
      type={type}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (value: string) => void; children: React.ReactNode }) {
  return (
    <StyledSelect
      className="h-11 w-full min-w-0 rounded-[12px] border border-[#d8bfa9] bg-white px-3.5 text-sm font-black text-hpsr-text outline-none transition hover:border-[#b98f75] focus:border-hpsr-wine/55 focus:ring-2 focus:ring-hpsr-wine/10"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {children}
    </StyledSelect>
  );
}

function PatientQuickRegisterModal({
  draft,
  setDraft,
  onCancel,
  onSave,
}: {
  draft: PatientDraft;
  setDraft: (patient: PatientDraft) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <div className="hpsr-modal-tone fixed inset-0 z-[70] flex items-center justify-center bg-[#1f0805]/55 p-4">
      <div className="w-full max-w-[520px] overflow-hidden rounded-[22px] border border-[#d7bfa8] bg-[#fffaf4] shadow-[0_24px_70px_rgba(42,7,0,0.28)]">
        <div className="flex items-center justify-between gap-3 border-b border-[#e1cbb8] bg-white px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-[13px] border border-[#d6c1af] bg-white text-hpsr-wine shadow-[0_6px_16px_rgba(42,7,0,0.06)]">
              <UserPlus size={18} />
            </span>
            <div>
              <h3 className="text-base font-black text-hpsr-text">Registro rápido de paciente</h3>
              <p className="text-xs font-semibold text-hpsr-muted">Preencha apenas os dados necessários para este documento.</p>
            </div>
          </div>
          <button type="button" onClick={onCancel} className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-hpsr-wine text-white">
            <X size={17} />
          </button>
        </div>
        <div className="space-y-3 p-5">
          <div>
            <FieldLabel>Nome completo</FieldLabel>
            <TextInput value={draft.name} onChange={(name) => setDraft({ ...draft, name })} placeholder="Nome do paciente" />
          </div>
          <div className="grid grid-cols-[1fr_110px] gap-2">
            <div>
              <FieldLabel>Documento / Passaporte</FieldLabel>
              <TextInput value={draft.passport} onChange={(passport) => setDraft({ ...draft, passport })} placeholder="Número" />
            </div>
            <div>
              <FieldLabel>Idade</FieldLabel>
              <TextInput value={draft.age} onChange={(age) => setDraft({ ...draft, age })} placeholder="Idade" />
            </div>
          </div>
          <div>
            <FieldLabel>Tipo sanguíneo</FieldLabel>
            <SelectInput value={draft.bloodType} onChange={(bloodType) => setDraft({ ...draft, bloodType })}><option value="">Selecione</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></SelectInput>
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e1cbb8] bg-white px-5 py-4">
          <button type="button" onClick={onCancel} className="h-10 rounded-[13px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40">Cancelar</button>
          <button type="button" onClick={onSave} className="h-10 rounded-[13px] bg-hpsr-wine px-5 text-xs font-black text-white shadow-soft hover:bg-hpsr-wineDark">Salvar paciente</button>
        </div>
      </div>
    </div>
  );
}

function DocumentVisualPreviewPage({
  html,
  pageIndex,
  totalPages,
  patient,
  doctor,
  title,
  today,
}: {
  html: string;
  pageIndex: number;
  totalPages: number;
  patient: PatientDraft;
  doctor: DoctorDraft;
  title: string;
  today: string;
}) {
  return (
    <section className="relative h-[1123px] w-[794px] overflow-hidden bg-[#fffdfb] font-sans text-[#4b2118]">
      <img src="/logo-hpsr.png" alt="" aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 select-none object-contain opacity-[0.055]" />
      <div className="relative z-10 flex h-full flex-col px-[42px] pb-[18px] pt-[24px]">
        <header className="rounded-[16px] border border-[#e4d8d0] bg-white/95 px-4 py-3 shadow-[0_8px_24px_rgba(42,7,0,0.045)]">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <img src="/logo-hpsr.png" alt="Hospital São Rafael" className="h-10 w-10 object-contain" />
              <div>
                <p className="text-[8.5px] font-black uppercase tracking-[0.18em] text-[#8d665b]">Hospital São Rafael</p>
                <p className="mt-1 text-[16.5px] font-black text-[#3d1710]">HOSPITAL SÃO RAFAEL</p>
                <p className="mt-1 text-[8.5px] font-bold text-[#8d665b]">DOCUMENTO MÉDICO · HOSPITAL SÃO RAFAEL</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[8px]">
              <div className="w-[84px] rounded-[10px] border border-[#e5d9d1] bg-white px-2.5 py-1.5"><p className="font-black uppercase tracking-[0.12em] text-[#8d665b]">Data</p><p className="mt-0.5 font-black text-[#3d1710]">{today}</p></div>
              <div className="w-[86px] rounded-[10px] border border-[#e5d9d1] bg-white px-2.5 py-1.5"><p className="font-black uppercase tracking-[0.12em] text-[#8d665b]">Página</p><p className="mt-0.5 font-black text-[#3d1710]">{pageIndex + 1}/{Math.max(totalPages, 1)}</p></div>
            </div>
          </div>
        </header>
        <div className="mt-[10px] rounded-[12px] border border-[#e1d1c7] bg-[#f8efea] px-4 py-2 text-center text-[11.5px] font-black uppercase tracking-[0.06em] text-[#5b1809]">{title}</div>
        <div className="mt-2 grid grid-cols-[2.4fr_1fr_.65fr_1.15fr] gap-2">
          {[['Paciente', patient.name || '-'], ['Passaporte', patient.passport || '-'], ['Idade', patient.age || '-'], ['Tipo sanguíneo', patient.bloodType || '-']].map(([label, value]) => (
            <div key={label} className="min-h-[48px] rounded-[10px] border border-[#e5d9d1] bg-white px-2.5 py-2">
              <p className="text-[7px] font-black uppercase tracking-[0.12em] text-[#8d665b]">{label}</p>
              <p className="mt-1 truncate text-[9px] font-black text-[#3d1710]">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 min-h-0 flex-1 overflow-hidden rounded-[16px] border border-[#e7ddd6] bg-white px-5 py-4 text-[10px] leading-[1.58] shadow-[0_10px_26px_rgba(42,7,0,0.035)] [&_h1]:mb-3 [&_h1]:text-[15px] [&_h1]:font-black [&_h1]:uppercase [&_h1]:tracking-[0.05em] [&_h1]:text-[#5b1809] [&_h2]:mb-2 [&_h2]:mt-3 [&_h2]:rounded-[8px] [&_h2]:border [&_h2]:border-[#e6dad2] [&_h2]:bg-[#fbf6f2] [&_h2]:px-3 [&_h2]:py-2 [&_h2]:text-[11px] [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-[0.05em] [&_h2]:text-[#5b1809] [&_p]:mb-2.5 [&_strong]:text-[#3d1710] [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[#e7ddd6] [&_td]:p-2 [&_th]:border [&_th]:border-[#e7ddd6] [&_th]:bg-[#f7eee8] [&_th]:p-2 [&_th]:text-left [&_th]:font-black [&_th]:text-[#5b1809]" dangerouslySetInnerHTML={{ __html: html }} />
        <footer className="mt-3 border-t border-[#cfb3a2] pt-2 text-center text-[8px] text-[#7a5148]">
          {doctor.signatureImage ? <div className="mx-auto flex h-[48px] w-[280px] items-end justify-center"><img src={doctor.signatureImage} alt="Assinatura cadastrada do médico" className="h-[35px] w-[200px] object-contain" /></div> : <div className="mx-auto h-[48px]" />}
          <div className="mx-auto mb-1 h-1 w-[250px] border-b border-dashed border-[#8d665b]" />
          <p className="font-black text-[#5b1809]">Dr(a). {doctor.name || 'Nome do médico'}</p>
          <p className="font-semibold">{doctor.role || 'Médico'} · CRM: {doctor.crm || '000000'}</p>
          <div className="mt-1 flex items-center justify-between text-[7.5px]"><span>Hospital São Rafael</span><span>Documento médico institucional</span><span>Página {pageIndex + 1}/{Math.max(totalPages, 1)}</span></div>
        </footer>
      </div>
    </section>
  );
}

export default function DocumentsPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const { patients: sharedPatients, selectedPatient: sharedSelectedPatient, selectPatient: selectSharedPatient, upsertPatient: upsertSharedPatient, loading: patientsLoading } = usePatientSelection();
  const initialDoctor: DoctorDraft = {
    name: currentUserProfile.signatureName || currentUserProfile.characterName || currentUserProfile.systemName || "",
    crm: currentUserProfile.crm || "",
    role: currentUserProfile.signatureRole || currentUserProfile.role || "Médico",
    specialty: currentUserProfile.specialty || "",
  };
  const [availableDoctors, setAvailableDoctors] = useState<DoctorOption[]>([{
    id: currentUserProfile.id || "current-user",
    name: initialDoctor.name,
    crm: initialDoctor.crm,
    role: initialDoctor.role,
    specialty: initialDoctor.specialty,
    signatureImage: currentUserProfile.signatureImage || null,
  }]);
  const editorRef = useRef<HTMLDivElement | null>(null);
  const modelPanelRef = useRef<HTMLDivElement | null>(null);
  const lastRange = useRef<Range | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const [patient, setPatient] = useState<PatientDraft>(emptyPatient);
  const patientOptions = sharedPatients as PatientDraft[];
  const [quickPatientOpen, setQuickPatientOpen] = useState(false);
  const [quickPatientDraft, setQuickPatientDraft] = useState<PatientDraft>(emptyPatient);

  useEffect(() => {
    if (!sharedSelectedPatient || restoredDoctor.current !== null) return;
    setPatient(sharedSelectedPatient as PatientDraft);
  }, [sharedSelectedPatient]);
  const [doctor, setDoctor] = useState<DoctorDraft>(initialDoctor);
  const [selectedDoctorId, setSelectedDoctorId] = useState(currentUserProfile.id || "current-user");
  const [selectedModelId, setSelectedModelId] = useState(
    documentModels[0]?.id || "",
  );
  const [guidedValues, setGuidedValues] = useState<Record<string, string>>({});
  const [catalogCategory, setCatalogCategory] = useState<
    DocumentCategory | "todos"
  >("todos");
  const [catalogSearch, setCatalogSearch] = useState("");
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(true);
  const [useModel, setUseModel] = useState(false);
  const [editorHtml, setEditorHtml] = useState("");
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editingReleasedSnapshot, setEditingReleasedSnapshot] = useState<Record<string, unknown> | null>(null);
  const [loadedIsConfidential, setLoadedIsConfidential] = useState(true);
  const [documentDirty, setDocumentDirty] = useState(false);
  const [appDialog, setAppDialog] = useState<AppDialog>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPageHtmls, setPreviewPageHtmls] = useState<string[]>([]);
  const [previewPageIndex, setPreviewPageIndex] = useState(0);
  const previewSnapshotRef = useRef<DocumentRenderSnapshot | null>(null);
  const previewRenderRef = useRef<((index: number) => Promise<Blob | null>) | null>(null);
  const previewNameRef = useRef("");
  const pngPreview = useVirtualPngPreview(previewOpen, previewPageHtmls, previewPageIndex,
    () => previewRenderRef.current?.(previewPageIndex) || Promise.resolve(null));
  const [savingDocument, setSavingDocument] = useState(false);
  const [editorPageGuideTops, setEditorPageGuideTops] = useState<number[]>([]);
  const [isConfidential, setIsConfidential] = useState(true);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tableRows, setTableRows] = useState(3);
  const [tableCols, setTableCols] = useState(3);

  const restoredDoctor = useRef<string | null>(null);
  const editorHtmlRef = useRef(editorHtml);
  editorHtmlRef.current = editorHtml;
  const bindDraftEditor = useCallback((node: HTMLDivElement | null) => {
    editorRef.current = node;
    if (node) node.innerHTML = editorHtmlRef.current;
  }, []);
  const documentDraft = useMemo(() => ({ schemaVersion: 1, patient, doctor, selectedDoctorId, selectedModelId,
    guidedValues, catalogCategory, catalogSearch, catalogOpen, useModel, editorHtml,
    editingRecordId, editingReleasedSnapshot, loadedIsConfidential, documentDirty, isConfidential }),
    [patient, doctor, selectedDoctorId, selectedModelId, guidedValues, catalogCategory, catalogSearch,
      catalogOpen, useModel, editorHtml, editingRecordId, editingReleasedSnapshot, loadedIsConfidential, documentDirty, isConfidential]);
  const draftPersistence = useExamDraft(currentUserProfile.id, documentDraft, (draft) => {
    if (draft.schemaVersion !== 1) throw new Error("Rascunho incompatível");
    restoredDoctor.current = draft.selectedDoctorId;
    setPatient(draft.patient || emptyPatient); setDoctor(draft.doctor || initialDoctor);
    setSelectedDoctorId(draft.selectedDoctorId); setSelectedModelId(draft.selectedModelId);
    setGuidedValues(draft.guidedValues || {}); setCatalogCategory(draft.catalogCategory || "todos");
    setCatalogSearch(draft.catalogSearch || ""); setCatalogOpen(Boolean(draft.catalogOpen)); setUseModel(Boolean(draft.useModel));
    setEditorHtml(draft.editorHtml || "");
    if (editorRef.current) editorRef.current.innerHTML = draft.editorHtml || "";
    setEditingRecordId(draft.editingRecordId || null); setEditingReleasedSnapshot(draft.editingReleasedSnapshot || null);
    setLoadedIsConfidential(draft.loadedIsConfidential !== false); setDocumentDirty(Boolean(draft.documentDirty));
    setIsConfidential(draft.isConfidential !== false);
  }, "document_editor_drafts");

  const today = useMemo(() => new Date().toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }), []);
  const selectedModel = useMemo(
    () =>
      documentModels.find((model) => model.id === selectedModelId) ||
      documentModels[0],
    [selectedModelId],
  );

  const selectedDoctorOption = useMemo(
    () => availableDoctors.find((item) => item.id === selectedDoctorId) || null,
    [availableDoctors, selectedDoctorId],
  );
  const hasSavedDoctorSignature = Boolean(selectedDoctorOption?.signatureImage);

  const filteredModels = useMemo(() => {
    const query = catalogSearch.trim().toLowerCase();
    return documentModels.filter((model) => {
      const byCategory =
        catalogCategory === "todos" || model.category === catalogCategory;
      const bySearch =
        !query ||
        model.title.toLowerCase().includes(query) ||
        model.subtitle.toLowerCase().includes(query) ||
        categoryLabels[model.category].toLowerCase().includes(query);
      return byCategory && bySearch;
    });
  }, [catalogCategory, catalogSearch]);

  const generatedHtml = useMemo(() => {
    if (!selectedModel) return "";
    return selectedModel.render({
      patient,
      doctor,
      values: guidedValues,
      today,
    });
  }, [selectedModel, patient, doctor, guidedValues, today]);

  useEffect(() => {
    window.requestAnimationFrame(updateEditorPageGuides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editorHtml, generatedHtml, selectedModelId]);

  useEffect(() => {
    const initial = `<h1>${documentModels[0]?.title || "Documento médico"}</h1><p><br></p>`;
    setEditorHtml((current) => current || initial);
    window.setTimeout(() => {
      if (editorRef.current && !editorRef.current.innerHTML.trim()) editorRef.current.innerHTML = initial;
    }, 0);
    // O conteúdo clínico não usa localStorage: Supabase é a fonte oficial após salvamento explícito.
  }, []);

  useEffect(() => {
    const currentOption: DoctorOption = {
      id: currentUserProfile.id || "current-user",
      name: initialDoctor.name,
      crm: initialDoctor.crm,
      role: initialDoctor.role,
      specialty: initialDoctor.specialty,
      signatureImage: currentUserProfile.signatureImage || null,
    };
    const client = createClient();
    if (!client) {
      setAvailableDoctors([currentOption]);
      return;
    }
    void client.from("profiles")
      .select("id,name,crm,role,specialty,signature_path")
      .eq("access_status", "Aprovado")
      .order("name")
      .then(({ data }) => {
        const options = (data || []).map((row: any) => {
          const signaturePath = String(row.signature_path || "").trim();
          let signatureImage: string | null = signaturePath || null;
          if (signaturePath && !signaturePath.startsWith("data:") && !/^https?:\/\//i.test(signaturePath)) {
            const { data: publicData } = client.storage.from("signatures").getPublicUrl(signaturePath);
            signatureImage = publicData.publicUrl || signaturePath;
          }
          return {
            id: row.id,
            name: row.name || "Médico",
            crm: row.crm || "—",
            role: row.role || "Médico",
            specialty: row.specialty || "Não informado",
            signatureImage,
          } as DoctorOption;
        });
        setAvailableDoctors([{ ...currentOption, signatureImage: options.find(item => item.id === currentOption.id)?.signatureImage || currentOption.signatureImage }, ...options.filter((item) => item.id !== currentOption.id)]);
      });
  }, [currentUserProfile.id, currentUserProfile.characterName, currentUserProfile.systemName, currentUserProfile.signatureName, currentUserProfile.crm, currentUserProfile.role, currentUserProfile.signatureRole, currentUserProfile.specialty, currentUserProfile.signatureImage]);

  useEffect(() => {
    const selected = availableDoctors.find((item) => item.id === selectedDoctorId);
    if (!selected) return;

    if (restoredDoctor.current === selectedDoctorId) {
      if (!doctor.signatureImage && selected.signatureImage) setDoctor(current => ({ ...current, signatureImage: selected.signatureImage }));
      return;
    }
    setDoctor({
      name: selected.name,
      crm: selected.crm,
      role: selected.role,
      specialty: selected.specialty,
      signatureImage: selected.signatureImage || null,
    });
  }, [selectedDoctorId, availableDoctors, doctor.signatureImage]);

  function rememberSelection() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (editorRef.current.contains(range.commonAncestorContainer)) lastRange.current = range.cloneRange();
  }

  function placeCaretAtEnd() {
    if (!editorRef.current) return;
    editorRef.current.focus();
    const selection = window.getSelection();
    if (!selection) return;
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection.removeAllRanges();
    selection.addRange(range);
    lastRange.current = range.cloneRange();
  }

  function restoreSelection() {
    editorRef.current?.focus();
    const selection = window.getSelection();
    if (!selection) return;
    selection.removeAllRanges();
    if (lastRange.current && editorRef.current?.contains(lastRange.current.commonAncestorContainer)) {
      selection.addRange(lastRange.current);
      return;
    }
    placeCaretAtEnd();
  }

  function ensureDefaultParagraphSeparator() {
    try {
      document.execCommand("defaultParagraphSeparator", false, "p");
    } catch {}
  }

  function syncEditor() {
    const html = normalizeEditorHtml(editorRef.current?.innerHTML || "");
    setEditorHtml(html);
    setDocumentDirty(true);
    rememberSelection();
    window.requestAnimationFrame(updateEditorPageGuides);
  }

  function applyModel() {
    const current = normalizeEditorHtml(editorRef.current?.innerHTML || "");
    const blankBase = `<h1>${selectedModel?.title || ""}</h1><p><br></p>`;
    if (current && current !== generatedHtml && current !== blankBase) {
      setAppDialog({
        title: "Aplicar modelo",
        message:
          "Isso vai substituir o texto atual do editor pelo modelo preenchido com os dados informados.",
        actions: [
          {
            label: "Cancelar",
            variant: "secondary",
            onClick: () => setAppDialog(null),
          },
          {
            label: "Aplicar",
            variant: "primary",
            onClick: () => {
              if (editorRef.current)
                editorRef.current.innerHTML = generatedHtml;
              setEditorHtml(generatedHtml);
              setDocumentDirty(true);
              setAppDialog(null);
            },
          },
        ],
      });
      return;
    }
    if (editorRef.current) editorRef.current.innerHTML = generatedHtml;
    setEditorHtml(generatedHtml);
    setDocumentDirty(true);
  }

  function openModelEditor() {
    if (catalogOpen) setCatalogOpen(false);
    if (!useModel) setUseModel(true);
    // Aguarda a montagem dos campos ao ativar a chave antes de rolar a coluna.
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const panel = modelPanelRef.current;
      if (!panel) return;
      const formColumn = panel.closest<HTMLElement>("aside");
      if (formColumn && window.matchMedia("(min-width: 1280px)").matches) {
        const offset = panel.getBoundingClientRect().top - formColumn.getBoundingClientRect().top;
        formColumn.scrollTo({ top: formColumn.scrollTop + offset - 8, behavior: "smooth" });
        return;
      }
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }));
  }

  function selectModel(id: string) {
    const nextModel = documentModels.find((model) => model.id === id);
    if (!nextModel) return;

    const current = normalizeEditorHtml(editorRef.current?.innerHTML || editorHtml);
    const blankTitle = `<h1>${selectedModel?.title || ""}</h1><p><br></p>`;
    // Reabrir o catálogo e escolher o mesmo documento não apaga o rascunho.
    if (id === selectedModelId && current) {
      setCatalogOpen(false);
      setCategoriesOpen(false);
      return;
    }

    const applySelection = () => {
      setSelectedModelId(id);
      setCatalogOpen(false);
      setCategoriesOpen(false);
      setGuidedValues({});
      setUseModel(false);
      // Assim como em Exames, o modelo só preenche o editor após o usuário ativá-lo e aplicá-lo.
      const html = `<h1>${nextModel.title}</h1><p><br></p>`;
      if (editorRef.current) editorRef.current.innerHTML = html;
      setEditorHtml(html);
    };

    const plainText = current.replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();
    const onlyBase = !plainText || current === blankTitle || plainText === selectedModel?.title;
    if (!onlyBase && plainText.length > 8) {
      setAppDialog({
        title: "Trocar documento",
        message: "O editor atual possui conteúdo. Ao selecionar outro documento, esse texto será substituído pela base vazia do novo documento.",
        actions: [
          { label: "Cancelar", variant: "secondary", onClick: () => setAppDialog(null) },
          { label: "Trocar documento", variant: "primary", onClick: () => { setAppDialog(null); applySelection(); } },
        ],
      });
      return;
    }
    applySelection();
  }

  function exec(command: string, value?: string) {
    restoreSelection();
    document.execCommand(command, false, value);
    rememberSelection();
    syncEditor();
  }

  function insertList(ordered = false) {
    exec(ordered ? "insertOrderedList" : "insertUnorderedList");
  }

  function applyFormatBlock(tag: string) {
    restoreSelection();
    document.execCommand("formatBlock", false, tag);
    rememberSelection();
    syncEditor();
  }

  function insertHtml(html: string) {
    restoreSelection();
    document.execCommand("insertHTML", false, html);
    rememberSelection();
    syncEditor();
  }

  function insertTable(rows = tableRows, cols = tableCols) {
    const safeRows = Math.max(1, Math.min(30, rows));
    const safeCols = Math.max(1, Math.min(8, cols));
    const cells = Array.from({ length: safeCols }, () => "<td><br></td>").join("");
    const body = Array.from({ length: safeRows }, () => `<tr>${cells}</tr>`).join("");
    insertHtml(`<table><tbody>${body}</tbody></table><p><br></p>`);
    setTablePickerOpen(false);
  }

  async function pasteWithoutFormatting() {
    restoreSelection();
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      document.execCommand("insertText", false, text);
      rememberSelection();
      syncEditor();
    } catch {
      setAppDialog({
        title: "Não foi possível acessar a área de transferência",
        message: "Use Ctrl + Shift + V para colar sem formatação neste campo.",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
    }
  }

  function transformSelectionCase(mode: "upper" | "lower") {
    restoreSelection();
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || !editorRef.current) return;
    const range = selection.getRangeAt(0);
    if (range.collapsed || !editorRef.current.contains(range.commonAncestorContainer)) return;

    const walker = document.createTreeWalker(editorRef.current, NodeFilter.SHOW_TEXT);
    const nodes: Text[] = [];
    let current = walker.nextNode();
    while (current) {
      const textNode = current as Text;
      try {
        if (range.intersectsNode(textNode)) nodes.push(textNode);
      } catch {}
      current = walker.nextNode();
    }

    nodes.forEach((node) => {
      const start = node === range.startContainer ? range.startOffset : 0;
      const end = node === range.endContainer ? range.endOffset : node.data.length;
      if (end <= start) return;
      const selected = node.data.slice(start, end);
      const converted = mode === "upper" ? selected.toLocaleUpperCase("pt-BR") : selected.toLocaleLowerCase("pt-BR");
      node.data = `${node.data.slice(0, start)}${converted}${node.data.slice(end)}`;
    });
    syncEditor();
  }

  function openQuickPatient() {
    setQuickPatientDraft(patient.name || patient.passport ? patient : emptyPatient);
    setQuickPatientOpen(true);
  }

  async function saveQuickPatient() {
    const normalizedPatient = {
      ...quickPatientDraft,
      name: quickPatientDraft.name.trim(),
      passport: quickPatientDraft.passport.trim(),
    };
    if (!normalizedPatient.name || !normalizedPatient.passport) {
      setAppDialog({
        title: "Dados insuficientes",
        message: "Informe o nome e o documento do paciente. O documento é necessário para sincronizar o cadastro com o Prontuário sem criar duplicidades.",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
      return;
    }
    const nextPatient = { ...normalizedPatient, passport: normalizedPatient.passport.toUpperCase() };
    const saved = await upsertSharedPatient(nextPatient);
    if (!saved) {
      setAppDialog({
        title: "Cadastro não sincronizado",
        message: "Não foi possível salvar o paciente no Prontuário. O cadastro rápido não foi concluído para evitar um registro somente local.",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
      return;
    }
    setPatient(nextPatient);
    selectSharedPatient(nextPatient);
    setQuickPatientOpen(false);
  }

  function addTemporarySignature(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setAppDialog({ title: "Assinatura inválida", message: "Selecione uma imagem PNG, JPG ou WEBP.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDoctor((current) => ({ ...current, signatureImage: String(reader.result || "") }));
    reader.onerror = () => setAppDialog({ title: "Assinatura", message: "Não foi possível ler a imagem selecionada.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
    reader.readAsDataURL(file);
  }

  function selectDoctor(id: string) {
    const selected = availableDoctors.find((item) => item.id === id);
    if (!selected) return;
    setDoctor((current) => ({ ...current, signatureImage: null }));
    setSelectedDoctorId(selected.id);
  }

  function htmlToPlainBlocks(html: string) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = html;
    return Array.from(wrapper.children)
      .map((child) => ({
        tag: child.tagName.toLowerCase(),
        text: (child.textContent || "").replace(/\s+/g, " ").trim(),
      }))
      .filter((block) => block.text);
  }

  function buildDocumentPages() {
    const html = normalizeEditorHtml(editorRef.current?.innerHTML ?? editorHtml);
    return splitClinicalReportHtmlIntoPages(html, doctor.signatureImage || null, { measureHeight: measureDocumentReportHtml, capacity: 825 });
  }

  function updateEditorPageGuides() {
    const editor = editorRef.current;
    if (!editor) {
      setEditorPageGuideTops([]);
      return;
    }

    try {
      const pages = buildDocumentPages();
      if (pages.length <= 1) {
        setEditorPageGuideTops([]);
        return;
      }

      // Conta também <br> e parágrafos vazios. Assim, os Enters ocupam espaço
      // no mesmo fluxo que a paginação/preview, em vez de a guia acompanhar
      // somente caracteres visíveis.
      const contentUnits = (root: Node) => {
        let total = 0;
        const walker = window.document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
        let current = walker.nextNode();
        while (current) {
          if (current.nodeType === Node.TEXT_NODE) total += (current.textContent || "").length;
          else if ((current as Element).tagName?.toLowerCase() === "br") total += 1;
          current = walker.nextNode();
        }
        return total;
      };

      const targets: number[] = [];
      let cumulative = 0;
      pages.slice(0, -1).forEach((pageHtml) => {
        const holder = window.document.createElement("div");
        holder.innerHTML = pageHtml;
        cumulative += contentUnits(holder);
        targets.push(cumulative);
      });

      const walker = window.document.createTreeWalker(editor, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
      const positions: number[] = [];
      let targetIndex = 0;
      let consumed = 0;
      let node = walker.nextNode();
      const editorRect = editor.getBoundingClientRect();

      while (node && targetIndex < targets.length) {
        if (node.nodeType === Node.TEXT_NODE) {
          const value = node.textContent || "";
          while (targetIndex < targets.length && consumed + value.length >= targets[targetIndex]) {
            const offset = Math.max(0, Math.min(value.length, targets[targetIndex] - consumed));
            const range = window.document.createRange();
            range.setStart(node, offset);
            range.setEnd(node, offset);
            const rect = range.getBoundingClientRect();
            positions.push(Math.max(0, editor.offsetTop + rect.top - editorRect.top));
            targetIndex += 1;
          }
          consumed += value.length;
        } else if ((node as Element).tagName?.toLowerCase() === "br") {
          consumed += 1;
          while (targetIndex < targets.length && consumed >= targets[targetIndex]) {
            const parentRect = (node.parentElement || editor).getBoundingClientRect();
            positions.push(Math.max(0, editor.offsetTop + parentRect.bottom - editorRect.top));
            targetIndex += 1;
          }
        }
        node = walker.nextNode();
      }

      setEditorPageGuideTops((current) => {
        if (current.length === positions.length && current.every((value, index) => Math.abs(value - positions[index]) < 1)) return current;
        return positions;
      });
    } catch {
      setEditorPageGuideTops([]);
    }
  }

  async function initializePreviewPages(pages: string[]) {
    const snapshot = await captureDocumentSnapshot({ title: selectedModel?.title || "Documento médico", date: today, patient, doctor }, pages);
    previewSnapshotRef.current = snapshot;
    previewRenderRef.current = async (index) => {
      const canvas = await renderSavedDocumentCanvas(snapshot, index);
      return canvas ? new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png")) : null;
    };
    previewNameRef.current = `${safeFileName(snapshot.metadata.title)}_${safeFileName(snapshot.metadata.patient.name || "paciente")}`;
    setPreviewPageHtmls(snapshot.pages);
    setPreviewPageIndex(0);
    setPreviewOpen(true);
  }

  function downloadPng() {
    if (!pngPreview.url) return;
    const link = document.createElement("a");
    link.href = pngPreview.url;
    link.download = `${previewNameRef.current}_pagina_${previewPageIndex + 1}.png`;
    link.click();
  }


  async function openDocumentPreview() {
    const html = normalizeEditorHtml(editorRef.current?.innerHTML ?? editorHtml);
    if (editorRef.current) editorRef.current.innerHTML = html;
    setEditorHtml(html);
    const pages = buildDocumentPages();
    try { await initializePreviewPages(pages); }
    catch (error) { setAppDialog({ title: "Assinatura ou pré-visualização indisponível", message: error instanceof Error ? error.message : "Não foi possível preparar o documento.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] }); }
  }

  function buildStructuredDocumentPayload(
    html: string,
    savedAt: string,
    activeAppointment: Awaited<ReturnType<typeof findActiveAppointmentContext>>,
    releasedSnapshot: Record<string, unknown> | null = editingReleasedSnapshot,
  ) {
    return {
      schemaVersion: 2,
      documentKind: "medical-document",
      documentTitle: selectedModel?.title || "Documento médico",
      documentModelId: selectedModelId,
      documentCategory: selectedModel?.category || "relatorios",
      documentHtml: html,
      guidedValues,
      useModel,
      patient,
      doctor,
      selectedDoctorId,
      ...(releasedSnapshot ? { releasedSnapshot } : {}),
      ...(activeAppointment ? {
        appointmentId: activeAppointment.id,
        appointmentSpecialty: activeAppointment.specialty,
        appointmentDoctor: activeAppointment.doctorName,
        appointmentDate: activeAppointment.date,
        appointmentTime: activeAppointment.time,
      } : {}),
      savedAt,
    };
  }

  function resetDocumentEditor() {
    const firstModel = documentModels[0];
    const initial = `<h1>${firstModel?.title || "Documento médico"}</h1><p><br></p>`;
    setEditingRecordId(null);
    setEditingReleasedSnapshot(null);
    setLoadedIsConfidential(true);
    setIsConfidential(true);
    setSelectedModelId(firstModel?.id || "");
    setGuidedValues({});
    setUseModel(false);
    setEditorHtml(initial);
    setDocumentDirty(false);
    setPreviewOpen(false);
    if (editorRef.current) editorRef.current.innerHTML = initial;
  }

  async function loadDocumentForEditing(recordId: string) {
    const client = createClient();
    if (!client) {
      setAppDialog({ title: "Não foi possível abrir o documento", message: "Supabase não configurado.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
      return;
    }
    setSavingDocument(true);
    try {
      const { data, error } = await client.from("clinical_records")
        .select("id,patient_passport,payload,is_confidential")
        .eq("id", recordId)
        .in("record_type", ["Documento", "documento"])
        .maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Documento não encontrado.");
      const payload = (data.payload || {}) as Record<string, any>;
      const loadedPatient = payload.patient && typeof payload.patient === "object" ? payload.patient as PatientDraft : { ...emptyPatient, passport: String(data.patient_passport || "") };
      const loadedDoctor = payload.doctor && typeof payload.doctor === "object" ? payload.doctor as DoctorDraft : initialDoctor;
      const modelId = documentModels.some((model) => model.id === String(payload.documentModelId || ""))
        ? String(payload.documentModelId)
        : documentModels.find((model) => model.title === String(payload.documentTitle || ""))?.id || documentModels[0]?.id || "";
      const html = normalizeEditorHtml(String(payload.documentHtml || payload.editorHtml || "")) || `<h1>${String(payload.documentTitle || "Documento médico")}</h1><p><br></p>`;
      setPatient(loadedPatient);
      setDoctor(loadedDoctor);
      setSelectedDoctorId(String(payload.selectedDoctorId || currentUserProfile.id || "current-user"));
      setSelectedModelId(modelId);
      setGuidedValues(payload.guidedValues && typeof payload.guidedValues === "object" ? payload.guidedValues as Record<string, string> : {});
      setUseModel(Boolean(payload.useModel));
      setEditorHtml(html);
      setEditingRecordId(String(data.id));
      setEditingReleasedSnapshot(payload.releasedSnapshot && typeof payload.releasedSnapshot === "object" ? payload.releasedSnapshot as Record<string, unknown> : null);
      setLoadedIsConfidential(Boolean(data.is_confidential));
      setIsConfidential(Boolean(data.is_confidential));
      setDocumentDirty(false);
      setPreviewOpen(false);
      window.setTimeout(() => { if (editorRef.current) editorRef.current.innerHTML = html; }, 0);
      window.scrollTo({ top: 0, behavior: "smooth" });
      hpsrSuccess("O documento foi carregado para edição. Alterações salvas não mudam o Portal até uma nova liberação.", "Documento carregado");
    } catch (error) {
      setAppDialog({ title: "Não foi possível abrir o documento", message: error instanceof Error ? error.message : "Falha ao carregar o registro.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
    } finally {
      setSavingDocument(false);
    }
  }

  async function saveDocument(options?: { publishCurrent?: boolean }) {
    if (savingDocument) return;
    if (!patient.passport?.trim() || !patient.name?.trim()) {
      setAppDialog({ title: "Paciente obrigatório", message: "Selecione ou cadastre o paciente antes de salvar.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
      return;
    }
    if (patient.name.trim().toLowerCase() === doctor.name.trim().toLowerCase()) {
      setAppDialog({ title: "Dados inválidos", message: "Paciente e médico responsável não podem ser o mesmo registro.", actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }] });
      return;
    }

    setSavingDocument(true);
    try {
      const html = normalizeEditorHtml(editorRef.current?.innerHTML ?? editorHtml);
      if (editorRef.current) editorRef.current.innerHTML = html;
      setEditorHtml(html);
      const savedAt = brazilIso();
      const client = createClient();
      if (!client) throw new Error("Não foi possível conectar ao banco de dados.");
      const activeAppointment = await findActiveAppointmentContext(client, patient.passport || "", { id: selectedDoctorId, name: doctor.name });
      const renderSnapshot = previewOpen && previewSnapshotRef.current && previewSnapshotRef.current.pages.join("") === buildDocumentPages().join("")
        ? previewSnapshotRef.current
        : await captureDocumentSnapshot({ title: selectedModel?.title || "Documento médico", date: today, patient, doctor }, buildDocumentPages());
      const payload = { ...buildStructuredDocumentPayload(html, savedAt, activeAppointment), schemaVersion: 3, renderSnapshot, patient: renderSnapshot.metadata.patient, doctor: renderSnapshot.metadata.doctor };
      const historyFields = {
        patient_passport: renderSnapshot.metadata.patient.passport.trim(),
        history_title: renderSnapshot.metadata.title,
        history_patient_name: renderSnapshot.metadata.patient.name.trim(),
        history_doctor_name: renderSnapshot.metadata.doctor.name.trim() || "Equipe médica",
      };

      let recordId = editingRecordId;
      let finalConfidential = isConfidential;
      let latestReleasedSnapshot = editingReleasedSnapshot;

      if (editingRecordId) {
        const { error } = await client.from("clinical_records").update({ ...historyFields, payload }).eq("id", editingRecordId);
        if (error) throw error;
        const visibilityChanged = isConfidential !== loadedIsConfidential;
        const shouldRepublish = Boolean(options?.publishCurrent) && !isConfidential;
        if (visibilityChanged || shouldRepublish) {
          const { data: changed, error: visibilityError } = await client.rpc("set_clinical_record_confidentiality", {
            target_record_id: editingRecordId,
            confidential: isConfidential,
          });
          if (visibilityError) throw visibilityError;
          const changedPayload = (changed as any)?.payload;
          latestReleasedSnapshot = changedPayload?.releasedSnapshot && typeof changedPayload.releasedSnapshot === "object" ? changedPayload.releasedSnapshot : latestReleasedSnapshot;
          finalConfidential = Boolean((changed as any)?.is_confidential ?? isConfidential);
        }
      } else {
        recordId = `document-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        const requestedConfidential = isConfidential;
        const { error } = await client.from("clinical_records").insert({
          id: recordId,
          ...historyFields,
          record_type: "Documento",
          is_confidential: true,
          released_at: null,
          payload,
        });
        if (error) throw error;
        finalConfidential = true;
        if (!requestedConfidential) {
          const { data: changed, error: visibilityError } = await client.rpc("set_clinical_record_confidentiality", {
            target_record_id: recordId,
            confidential: false,
          });
          if (visibilityError) throw visibilityError;
          const changedPayload = (changed as any)?.payload;
          latestReleasedSnapshot = changedPayload?.releasedSnapshot && typeof changedPayload.releasedSnapshot === "object" ? changedPayload.releasedSnapshot : null;
          finalConfidential = false;
        }
      }

      setEditingRecordId(recordId);
      setEditingReleasedSnapshot(latestReleasedSnapshot);
      setLoadedIsConfidential(finalConfidential);
      setIsConfidential(finalConfidential);
      setDocumentDirty(false);
      window.dispatchEvent(new CustomEvent("hpsr:clinical-record-saved", { detail: { recordType: "Documento", id: recordId } }));
      const portalMessage = finalConfidential
        ? "O documento foi salvo internamente e permanece em sigilo no Portal."
        : options?.publishCurrent || !editingRecordId
          ? "O documento foi salvo e a versão atual foi liberada no Portal."
          : "O documento foi salvo internamente. O Portal continua exibindo a última versão liberada.";
      hpsrSuccess(portalMessage, editingRecordId ? "Documento atualizado" : "Documento salvo");
    } catch (error) {
      setAppDialog({
        title: "Não foi possível salvar o documento",
        message: error instanceof Error ? error.message : "Ocorreu um erro inesperado durante o salvamento.",
        actions: [{ label: "Entendi", variant: "primary", onClick: () => setAppDialog(null) }],
      });
    } finally {
      setSavingDocument(false);
    }
  }


  const previewHtml = editorHtml;

  return (
    <>
      <div className="hpsr-page hpsr-documents-page gap-4 text-hpsr-text">
        <ExamEditorCaret />
        <div className="hpsr-topbar" />

        <header className="flex items-center gap-4 rounded-[22px] border border-[#e4d8cf] bg-[linear-gradient(110deg,#fff3e9_0%,#f5e5df_100%)] px-5 py-4 shadow-[0_8px_25px_rgba(42,7,0,0.04)]">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[15px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
            <FileText size={23} strokeWidth={1.9} />
          </span>
          <div className="min-w-0">
            <p className="text-[13px] font-black uppercase tracking-[0.12em] text-hpsr-wine">Documentos</p>
            <h1 className="mt-0.5 text-xl font-black tracking-tight text-hpsr-text sm:text-2xl">Editor de documentos</h1>
            <p className="mt-1 text-sm font-medium leading-relaxed text-hpsr-muted">Formulário à esquerda, editor à direita. Escolha um documento e aplique o modelo quando precisar.</p>
          </div>
        </header>

        {editingRecordId ? (
          <section className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-[#dfc9b8] bg-[#fff7ee] px-4 py-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wine">Editando registro salvo</p>
              <p className="mt-1 text-sm font-black text-hpsr-text">{selectedModel?.title || "Documento médico"} · {patient.name || patient.passport}</p>
              <p className="mt-1 text-xs font-semibold text-hpsr-muted">{!isConfidential && documentDirty ? "Há alterações internas ainda não publicadas. O Portal mantém a última versão liberada." : isConfidential ? "O documento está em sigilo no Portal do Paciente." : "A versão liberada permanece preservada até uma nova publicação explícita."}</p>
            </div>
            <button type="button" onClick={resetDocumentEditor} className="h-10 rounded-[12px] border border-hpsr-wine/20 bg-white px-4 text-xs font-black text-hpsr-wine hover:border-hpsr-wine/40">Novo documento</button>
          </section>
        ) : null}

        <section className="hpsr-documents-workspace grid min-h-0 flex-1 items-start gap-4 overflow-visible xl:grid-cols-[minmax(360px,420px)_minmax(0,1fr)] 2xl:grid-cols-[minmax(400px,460px)_minmax(0,1fr)]">
          <aside aria-label="Formulário do documento" className="hpsr-documents-form-scroll min-w-0 space-y-4 no-print xl:overflow-y-auto xl:overscroll-contain xl:rounded-[24px] xl:border xl:border-[#dfd6c8] xl:bg-[linear-gradient(180deg,#f8eee5_0%,#f3e2de_100%)] xl:p-2 xl:[scrollbar-gutter:stable]">
              <div className="space-y-4">
                <Panel title="Informações do documento" description="Paciente, médico responsável e assinatura.">
                  <div className="space-y-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <UserRound size={15} strokeWidth={2.2} className="text-hpsr-wine" />
                        <FieldLabel>Paciente</FieldLabel>
                      </div>
                      <div className="grid grid-cols-[minmax(0,1fr)_44px] gap-2">
                        <SelectInput
                          value={patient.passport}
                          onChange={(passport) => {
                            const match = patientOptions.find((item) => item.passport === passport);
                            if (match) {
                              setPatient(match);
                              selectSharedPatient(match);
                            } else {
                              setPatient(emptyPatient);
                              selectSharedPatient(null);
                            }
                          }}
                        >
                          <option value="">{patientsLoading ? "Carregando pacientes..." : "Paciente livre..."}</option>
                          {patientOptions.map((item) => (
                            <option key={item.passport} value={item.passport}>{item.name} · {item.passport}</option>
                          ))}
                        </SelectInput>
                        <button type="button" onClick={openQuickPatient} title="Registro rápido de paciente" className="flex h-11 w-11 items-center justify-center rounded-[12px] border border-[#d8bfa9] bg-white text-hpsr-wine transition hover:border-hpsr-wine/40 hover:bg-[#fff8f0]">
                          <UserPlus size={16} strokeWidth={2.2} />
                        </button>
                      </div>
                      <div className="mt-3 space-y-3">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1.55fr)_minmax(108px,0.8fr)]">
                          <label className="block min-w-0">
                            <FieldLabel>Nome do paciente</FieldLabel>
                            <TextInput value={patient.name} onChange={(name) => setPatient({ ...patient, name })} placeholder="Nome completo" />
                          </label>
                          <label className="block min-w-0">
                            <FieldLabel>Idade</FieldLabel>
                            <TextInput value={patient.age} onChange={(age) => setPatient({ ...patient, age })} placeholder="Anos" />
                          </label>
                        </div>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <label className="block min-w-0">
                            <FieldLabel>Passaporte</FieldLabel>
                            <TextInput value={patient.passport} onChange={(passport) => setPatient({ ...patient, passport })} placeholder="Número" />
                          </label>
                          <label className="block min-w-0">
                            <FieldLabel>Tipo sanguíneo</FieldLabel>
                            <SelectInput value={patient.bloodType} onChange={(bloodType) => setPatient({ ...patient, bloodType })}><option value="">Não informado</option><option value="A+">A+</option><option value="A-">A-</option><option value="B+">B+</option><option value="B-">B-</option></SelectInput>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-[#eee5de] pt-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Stethoscope size={15} strokeWidth={2.2} className="text-hpsr-wine" />
                        <FieldLabel>Médico responsável</FieldLabel>
                      </div>
                      <SelectInput value={selectedDoctorId} onChange={selectDoctor}>
                        {availableDoctors.map((item) => (
                          <option key={item.id} value={item.id}>{item.name} · {item.crm}</option>
                        ))}
                      </SelectInput>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-semibold text-hpsr-muted">
                        <span className="font-black text-hpsr-text">{doctor.name || "Médico não selecionado"}</span>
                        <span>{doctor.specialty || "Especialidade não informada"}</span>
                        <span>CRM {doctor.crm || "-"}</span>
                      </div>
                    </div>

                    <div className="border-t border-[#eee5de] pt-4">
                      <div className="flex flex-wrap items-center gap-3">
                        <FileSignature size={15} strokeWidth={2.2} className="text-hpsr-wine" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black text-hpsr-text">Assinatura</p>
                          <p className="text-[10px] font-semibold text-hpsr-muted">{hasSavedDoctorSignature ? "Assinatura do perfil selecionada automaticamente." : doctor.signatureImage ? "Assinatura temporária deste documento." : "Selecione ou cadastre a imagem da assinatura do médico."}</p>
                        </div>
                        {!hasSavedDoctorSignature ? <div className="flex flex-wrap gap-2">
                          <input ref={signatureInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(event) => { addTemporarySignature(event.target.files?.[0] || null); event.target.value = ""; }} />
                          <button type="button" onClick={() => signatureInputRef.current?.click()} className="rounded-[11px] border border-hpsr-wine/20 bg-white px-3 py-2 text-[11px] font-black text-hpsr-wine">{doctor.signatureImage ? "Trocar" : "Adicionar"}</button>
                          {doctor.signatureImage ? <button type="button" onClick={() => setDoctor((current) => ({ ...current, signatureImage: null }))} className="rounded-[11px] border border-hpsr-border bg-white px-3 py-2 text-[11px] font-black text-hpsr-muted">Remover</button> : null}
                        </div> : null}
                        {!doctor.signatureImage && !hasSavedDoctorSignature ? <div className="text-center"><p className="text-xs font-semibold text-hpsr-muted">Imagem da assinatura não cadastrada.</p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.08em] text-hpsr-muted">CRM {doctor.crm || "000000"}</p></div> : null}
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel title="Catálogo de documentos" description="Pesquise ou abra a lista de categorias para escolher um documento.">
                  {!catalogOpen && selectedModel ? (
                    <div className="rounded-[18px] border border-[#d7b796] bg-white px-4 py-3 shadow-[0_10px_22px_rgba(42,7,0,0.05)]">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex min-w-[180px] flex-1 items-center gap-3">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] bg-hpsr-wine text-white">
                            {(() => { const SelectedIcon = selectedModel.icon; return <SelectedIcon size={18} strokeWidth={2.3} />; })()}
                          </span>
                          <span className="min-w-0">
                            <span className="block text-[10px] font-black uppercase tracking-[0.1em] text-hpsr-muted">{categoryLabels[selectedModel.category]}</span>
                            <span className="mt-0.5 block break-words text-sm font-black leading-snug text-hpsr-text">{selectedModel.title}</span>
                          </span>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          <div className={`inline-flex h-10 items-center gap-2 rounded-[11px] border px-2.5 transition ${useModel ? "border-emerald-300 bg-emerald-50" : "border-[#dfd4cb] bg-white"}`}>
                            <span className={`text-[13px] font-black ${useModel ? "text-emerald-800" : "text-hpsr-text"}`}>Usar modelo</span>
                            <button
                              type="button"
                              role="switch"
                              aria-checked={useModel}
                              aria-label={useModel ? "Desativar modelo do documento" : "Ativar modelo do documento"}
                              onClick={() => setUseModel((current) => !current)}
                              className={`relative h-6 w-11 overflow-hidden rounded-full transition-colors duration-200 ${useModel ? "bg-emerald-600" : "bg-[#d7cec7]"}`}
                            >
                              <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-[0_2px_6px_rgba(0,0,0,0.18)] transition-transform duration-200 ${useModel ? "translate-x-5" : "translate-x-0"}`} />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => { setCatalogOpen(true); setCategoriesOpen(false); }}
                            className="inline-flex h-10 shrink-0 items-center gap-2 rounded-[11px] border border-hpsr-wine/20 bg-[#fff8f1] px-3 text-[13px] font-black text-hpsr-wine transition hover:border-hpsr-wine/40 hover:bg-white"
                          >
                            <RefreshCw size={14} /> Trocar documento
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="mb-3 flex h-11 items-center gap-2 rounded-[14px] border border-[#ddd2c8] bg-[#fbfaf9] px-3 shadow-[0_3px_10px_rgba(42,7,0,0.025)] transition focus-within:border-hpsr-wine/45 focus-within:ring-2 focus-within:ring-hpsr-wine/10">
                        <Search size={15} className="text-hpsr-wine" />
                        <input
                          value={catalogSearch}
                          onChange={(event) => setCatalogSearch(event.target.value)}
                          placeholder="Buscar por nome ou finalidade"
                          className="h-10 min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-hpsr-muted/70"
                        />
                        {catalogSearch && (
                          <button type="button" onClick={() => setCatalogSearch("")} className="flex h-7 w-7 items-center justify-center rounded-full text-hpsr-muted hover:bg-[#f7eadf] hover:text-hpsr-wine" aria-label="Limpar busca">
                            <X size={14} />
                          </button>
                        )}
                      </div>

                      <div className="mb-3 space-y-2.5">
                        <button
                          type="button"
                          aria-expanded={categoriesOpen}
                          aria-controls="hpsr-document-category-options"
                          onClick={() => setCategoriesOpen((current) => !current)}
                          className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2.5 text-left transition ${categoriesOpen ? "border-[#b36b61] bg-[#f9e8e2]" : "border-[#dfc9bf] bg-[#fdf3ec] hover:border-[#b98478]"}`}
                        >
                          <span className="flex min-w-0 items-center gap-2.5">
                            <FileText size={18} strokeWidth={2.1} className="shrink-0 text-hpsr-wine" />
                            <span className="min-w-0">
                              <span className="block text-[12px] font-semibold text-[#8a5147]">Categoria</span>
                              <span className="block truncate text-sm font-black text-hpsr-text">{catalogCategory === "todos" ? "Todos os documentos" : categoryLabels[catalogCategory]}</span>
                            </span>
                          </span>
                          <ChevronDown size={18} className={`shrink-0 text-hpsr-wine transition-transform ${categoriesOpen ? "rotate-180" : ""}`} />
                        </button>
                        {categoriesOpen && (
                          <div id="hpsr-document-category-options" role="group" aria-label="Categorias de documentos" className="max-h-[225px] space-y-1 overflow-y-auto overscroll-contain rounded-[12px] border border-[#e4cec2] bg-[#fff8f2] p-1.5 [scrollbar-gutter:stable]">
                            {(Object.keys(categoryLabels) as Array<DocumentCategory | "todos">).map((category) => {
                              const active = catalogCategory === category;
                              return (
                                <button key={category} type="button" aria-pressed={active} onClick={() => { setCatalogCategory(category); setCategoriesOpen(false); }} className={`flex min-h-10 w-full items-center gap-2.5 rounded-[9px] px-3 py-2 text-left text-sm font-bold transition ${active ? "bg-[#f6ded6] text-[#712b23]" : "text-hpsr-text hover:bg-[#f9ece6]"}`}>
                                  <span className="min-w-0 flex-1">{category === "todos" ? "Todos os documentos" : categoryLabels[category]}</span>
                                  <span className="shrink-0 text-[12px] text-hpsr-muted">{category === "todos" ? documentModels.length : documentModels.filter((model) => model.category === category).length}</span>
                                  {active && <Check size={16} className="shrink-0 text-hpsr-wine" />}
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>

                      <div aria-label="Lista de documentos" className="max-h-[360px] overflow-y-auto overscroll-contain rounded-[14px] border border-[#e6d5c9] bg-[#f6eee8] p-2.5 pr-2 [scrollbar-gutter:stable]">
                      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-1">
                        {filteredModels.map((model) => {
                          const Icon = model.icon;
                          const active = selectedModel?.id === model.id;
                          return (
                            <button
                              key={model.id}
                              type="button"
                              onClick={() => selectModel(model.id)}
                              className={`group relative min-h-[98px] w-full overflow-hidden rounded-[14px] border p-3.5 text-left transition-all duration-200 ${active ? "border-hpsr-wine/70 bg-[#fff7ef] shadow-[0_7px_18px_rgba(103,38,20,0.09)] ring-1 ring-hpsr-wine/10" : "border-[#e2d8cf] bg-white shadow-[0_3px_10px_rgba(42,7,0,0.025)] hover:-translate-y-0.5 hover:border-hpsr-wine/30 hover:bg-[#fdfaf7] hover:shadow-[0_7px_18px_rgba(42,7,0,0.05)]"}`}
                            >
                              <span className={`absolute inset-y-0 left-0 w-1 ${active ? "bg-hpsr-wine" : "bg-transparent group-hover:bg-hpsr-wine/20"}`} />
                              <div className="flex items-start gap-3">
                                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[12px] border ${active ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-[#ead9cb] bg-[#f8ece3] text-hpsr-wine"}`}>
                                  <Icon size={18} strokeWidth={2.3} />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="line-clamp-2 text-[14px] font-black leading-[1.4] text-hpsr-text">{model.title}</span>
                                  <span className="mt-1 line-clamp-2 block text-[13px] font-semibold leading-[1.5] text-hpsr-muted">{model.subtitle}</span>
                                </span>
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e4d2c2] bg-[#fffaf5] text-hpsr-muted transition group-hover:border-hpsr-wine/30 group-hover:text-hpsr-wine">
                                  <ChevronDown size={14} className="-rotate-90" />
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      </div>
                      {filteredModels.length === 0 && (
                        <div className="py-5 text-center">
                          <p className="text-sm font-black text-hpsr-text">Nenhum documento encontrado</p>
                          <button type="button" onClick={() => { setCatalogSearch(""); setCatalogCategory("todos"); }} className="mt-2 text-[13px] font-black text-hpsr-wine hover:underline">Limpar filtros</button>
                        </div>
                      )}
                    </>
                  )}
                </Panel>

                {!catalogOpen && useModel && selectedModel && (
                <div ref={modelPanelRef} id="hpsr-document-model-fields" className="scroll-mt-4">
                <Panel title="Modelo do documento" description="Preencha os campos do modelo e aplique ao editor.">
                  <div className="mb-3 rounded-[15px] border border-[#e0c7b0] bg-white/70 p-2.5">
                    <p className="text-sm font-black text-hpsr-text">{selectedModel?.title || "Documento livre"}</p>
                    <p className="mt-1 text-[13px] font-semibold text-hpsr-muted">Preencha os campos e aplique no editor.</p>
                  </div>
                  <div className="space-y-3">
                    {selectedModel?.guidedFields.map((item) => (
                      <label key={item.key} className="block">
                        <FieldLabel>{item.label}</FieldLabel>
                        {item.type === "textarea" ? (
                          <textarea
                            className="min-h-[105px] w-full rounded-[13px] border border-[#d8c1ad] bg-white px-3.5 py-3 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wine/50 focus:ring-2 focus:ring-hpsr-wine/10"
                            placeholder={item.placeholder}
                            value={guidedValues[item.key] || ""}
                            onChange={(event) => setGuidedValues({ ...guidedValues, [item.key]: event.target.value })}
                          />
                        ) : (
                          <TextInput
                            value={guidedValues[item.key] || ""}
                            type={item.type || "text"}
                            placeholder={item.placeholder}
                            onChange={(value) => setGuidedValues({ ...guidedValues, [item.key]: value })}
                          />
                        )}
                      </label>
                    ))}
                    <button type="button" onClick={applyModel} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[13px] bg-hpsr-wine px-4 text-sm font-black text-white shadow-soft hover:bg-hpsr-wineDark">
                      <Wand2 size={16} /> Aplicar no editor
                    </button>
                  </div>
                </Panel>
                </div>
                )}
              </div>
          </aside>

          <main aria-label="Editor do documento" className="hpsr-light-editor-shell flex min-h-0 min-w-0 flex-col overflow-visible rounded-[24px] border border-[#ddd4cc] bg-[#fffaf5] shadow-[0_14px_38px_rgba(42,7,0,0.065)] ring-1 ring-white xl:overflow-hidden">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#ece5df] bg-[linear-gradient(110deg,#fff8ed_0%,#f5e9e5_100%)] px-6 py-4 no-print">
              <div>
                <h2 className="text-xl font-black tracking-[-0.01em] text-hpsr-text">
                  {selectedModel?.title || "Documento livre"}
                </h2>
                <p className="text-xs font-semibold uppercase tracking-[0.06em] text-hpsr-muted">
                  Editor contínuo · pré-visualização somente quando solicitada
                </p>
                <div className="mt-2 inline-flex h-9 items-center gap-1 rounded-[11px] border border-[#e2d8cf] bg-[#fbfaf9] p-1">
                  <ShieldCheck size={14} className="ml-1.5 text-hpsr-wine" />
                  <button type="button" onClick={() => setIsConfidential(true)} className={`h-7 rounded-[8px] px-2.5 text-[10px] font-black transition ${isConfidential ? "bg-hpsr-wine text-white" : "text-hpsr-muted hover:text-hpsr-wine"}`}>Sigilo</button>
                  <button type="button" onClick={() => setIsConfidential(false)} className={`h-7 rounded-[8px] px-2.5 text-[10px] font-black transition ${!isConfidential ? "bg-emerald-600 text-white" : "text-hpsr-muted hover:text-emerald-700"}`}>Portal liberado</button>
                </div>
              </div>

              <button
                type="button"
                onClick={openModelEditor}
                aria-controls="hpsr-document-model-fields"
                className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-[12px] border border-hpsr-wine/25 bg-[#fff8f1] px-3.5 text-[13px] font-black text-hpsr-wine transition hover:border-hpsr-wine/45 hover:bg-white"
              >
                <Wand2 size={16} /> {useModel ? "Editar modelo" : "Usar modelo"}
              </button>

            </div>

            <div className="border-b border-[#eee8e2] bg-[#fbfaf9] px-6 py-2.5 text-xs font-semibold text-hpsr-muted no-print">
              <div className="flex items-center gap-2">
                <Check size={14} className="text-hpsr-wine" />
                <span>Revise os dados do paciente, o conteúdo e a assinatura antes de salvar o documento.</span>
              </div>
            </div>

            <div
              className="flex flex-wrap items-center gap-2 border-b border-[#e7dfd8] bg-white/95 px-4 py-2.5 no-print"
              onMouseDownCapture={(event) => {
                rememberSelection();
                if ((event.target as HTMLElement).closest("button")) event.preventDefault();
              }}
            >
              <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-xs font-black text-hpsr-text" onClick={() => exec("undo")} title="Desfazer">↶</button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-xs font-black text-hpsr-text" onClick={() => exec("redo")} title="Refazer">↷</button>
              </div>

              <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
                <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-[11px] border border-[#e0c7b2] bg-white px-3 text-xs font-black text-hpsr-text" onClick={() => applyFormatBlock("h1")}><Type size={14} /> Título</button>
                <button type="button" className="inline-flex h-9 items-center rounded-[11px] border border-[#e0c7b2] bg-white px-3 text-xs font-black text-hpsr-text" onClick={() => applyFormatBlock("h2")}>Seção</button>
                <button type="button" className="inline-flex h-9 items-center rounded-[11px] border border-[#e0c7b2] bg-white px-3 text-xs font-black text-hpsr-text" onClick={() => applyFormatBlock("p")}>Texto</button>
              </div>

              <div className="flex items-center rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
                <EditorFontSizeMenu onChange={(value) => exec("fontSize", value)} />
              </div>

              <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => exec("bold")}><Bold size={15} /></button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => exec("italic")}><Italic size={15} /></button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => exec("underline")}><Underline size={15} /></button>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[11px] border border-[#e0c7b2] bg-white px-3 text-xs font-black text-hpsr-text" title="Cor da fonte"><Type size={15} /><input type="color" onChange={(event) => exec("foreColor", event.target.value)} className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0" aria-label="Cor da fonte" /></label>
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-[11px] border border-[#e0c7b2] bg-white px-3 text-xs font-black text-hpsr-text" title="Cor de fundo do texto"><Highlighter size={15} /><input type="color" defaultValue="#fff2a8" onChange={(event) => exec("hiliteColor", event.target.value)} className="h-5 w-7 cursor-pointer border-0 bg-transparent p-0" aria-label="Cor de fundo do texto" /></label>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => exec("removeFormat")} title="Remover formatação"><Eraser size={15} /></button>
              </div>

              <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => void pasteWithoutFormatting()} title="Colar sem formatação"><ClipboardPaste size={15} /></button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => transformSelectionCase("upper")} title="Converter seleção para maiúsculas"><CaseUpper size={16} /></button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => transformSelectionCase("lower")} title="Converter seleção para minúsculas"><CaseLower size={16} /></button>
              </div>

              <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => exec("justifyLeft")}><AlignLeft size={15} /></button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => exec("justifyCenter")}><AlignCenter size={15} /></button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => exec("justifyRight")}><AlignRight size={15} /></button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => insertList(false)}><List size={15} /></button>
                <button type="button" className="inline-flex h-9 min-w-9 items-center justify-center rounded-[11px] border border-[#e0c7b2] bg-white px-2 text-hpsr-text" onClick={() => insertList(true)}><ListOrdered size={15} /></button>
              </div>

              <div className="relative flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
                <button type="button" className="inline-flex h-9 items-center gap-2 rounded-[11px] border border-[#e0c7b2] bg-white px-3 text-xs font-black text-hpsr-text" onClick={() => setTablePickerOpen(!tablePickerOpen)}><Table2 size={15} /> Tabela <ChevronDown size={13} /></button>
                {tablePickerOpen && <div className="absolute left-0 top-12 z-30 w-64 rounded-[16px] border border-[#d8bfa9] bg-white p-3 shadow-[0_18px_45px_rgba(42,7,0,0.16)]">
                  <p className="mb-3 text-xs font-black uppercase tracking-[0.04em] text-hpsr-text">Inserir tabela</p>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="text-xs font-bold text-hpsr-muted">Linhas<input type="number" min={1} max={30} value={tableRows} onChange={(event) => setTableRows(Number(event.target.value) || 1)} className="mt-1 h-9 w-full rounded-[10px] border border-[#d8bfa9] px-2 font-black text-hpsr-text" /></label>
                    <label className="text-xs font-bold text-hpsr-muted">Colunas<input type="number" min={1} max={8} value={tableCols} onChange={(event) => setTableCols(Number(event.target.value) || 1)} className="mt-1 h-9 w-full rounded-[10px] border border-[#d8bfa9] px-2 font-black text-hpsr-text" /></label>
                  </div>
                  <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => insertTable()} className="mt-3 h-10 w-full rounded-[12px] bg-hpsr-wine text-xs font-black text-white">Inserir</button>
                </div>}
              </div>

              <div className="flex items-center gap-1 rounded-[13px] border border-[#e2d8cf] bg-[#fbfaf9] p-1 shadow-[0_2px_8px_rgba(42,7,0,0.025)]">
                <button type="button" className="inline-flex h-9 items-center rounded-[11px] border border-[#e0c7b2] bg-white px-3 text-xs font-black text-hpsr-text" onClick={() => insertHtml("<blockquote>Observação: </blockquote><p><br></p>")}>Observação</button>
                <button type="button" className="inline-flex h-9 items-center rounded-[11px] border border-[#e0c7b2] bg-white px-3 text-xs font-black text-hpsr-text" onClick={() => insertHtml("<p><strong>Conclusão:</strong> </p>")}>Conclusão</button>
              </div>
            </div>

            <div className="hpsr-documents-editor-viewport min-h-0 bg-[linear-gradient(180deg,#f3eee8_0%,#eee5e1_100%)] p-4 xl:p-5">
              <div className="mx-auto min-h-full max-w-[1100px] rounded-[20px] border border-[#dfd5ce] bg-white p-8 shadow-[0_14px_34px_rgba(42,7,0,0.055)] ring-1 ring-white">
                <div className="relative">
                  {editorPageGuideTops.map((top, index) => (
                    <div key={index} className="pointer-events-none absolute left-0 right-0 z-10" style={{ top }}>
                      <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wine/60">
                        <span className="h-px flex-1 border-t border-dashed border-hpsr-wine/25" />
                        <span className="rounded-full border border-hpsr-wine/20 bg-[#fff7ed]/95 px-3 py-1">Conteúdo continua na página {index + 2}</span>
                        <span className="h-px flex-1 border-t border-dashed border-hpsr-wine/25" />
                      </div>
                    </div>
                  ))}
                <div
                  ref={bindDraftEditor}
                  contentEditable={draftPersistence.ready}
                  suppressContentEditableWarning
                  onInput={syncEditor}
                  onKeyUp={rememberSelection}
                  onMouseUp={rememberSelection}
                  onBlur={rememberSelection}
                  onFocus={() => { ensureDefaultParagraphSeparator(); rememberSelection(); }}
                  onKeyDown={(event) => {
                    handleRichEditorTableKeyDown(event, editorRef.current, syncEditor);
                  }}
                  className="hpsr-continuous-editor min-h-[420px] outline-none"
                />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e9e1da] bg-[#fcfbfa] px-6 py-3.5 no-print">
<span role="status" className="text-[11px] font-semibold text-hpsr-muted">{draftPersistence.status} {(draftPersistence.status.includes("não salvo") || draftPersistence.status.includes("Não foi possível")) && <button type="button" onClick={() => void draftPersistence.retry()} className="underline">Tentar novamente</button>} · A visibilidade no Portal pode ser ajustada diretamente no cabeçalho do editor.</span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (editorRef.current) editorRef.current.innerHTML = "";
                    setEditorHtml("");
                  }}
                  className="inline-flex h-10 items-center gap-2 rounded-[13px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
                >
                  <X size={15} /> Limpar editor
                </button>
                <button
                  type="button"
                  onClick={openDocumentPreview}
                  className="inline-flex h-10 items-center gap-2 rounded-[13px] bg-hpsr-wine px-5 text-xs font-black text-white shadow-soft hover:bg-hpsr-wineDark"
                >
                  <Save size={16} /> Pré-visualizar
                </button>
              </div>
            </div>
          </main>
        </section>
        <div className="hpsr-documents-history">
          <ClinicalHistoryPanel recordType="Documento" comfortable onEdit={(recordId) => void loadDocumentForEditing(recordId)} />
        </div>
      </div>

      {previewOpen && (
        <div className="hpsr-modal-tone fixed inset-0 z-50 flex items-center justify-center bg-[#1f0805]/60 p-4 no-print">
          <div className="flex h-[min(94dvh,980px)] w-full max-w-[1180px] flex-col overflow-hidden rounded-[22px] border border-[#dfd4cc] bg-[#faf7f4] shadow-[0_24px_70px_rgba(42,7,0,0.26)]">
            <div className="flex items-center justify-between gap-3 border-b border-hpsr-border bg-white px-4 py-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wine/65">
                  Pré-visualização
                </p>
                <h3 className="text-lg font-black uppercase text-hpsr-text">
                  {selectedModel?.title || "Documento médico"}
                </h3>
                <p className="text-xs font-bold text-hpsr-muted">
                  Pré-visualização institucional · Página {previewPageIndex + 1} de {Math.max(previewPageHtmls.length, 1)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="inline-flex h-10 items-center gap-2 rounded-full bg-hpsr-wine px-4 text-xs font-black text-white hover:bg-hpsr-wineDark"
              >
                <X size={14} /> Fechar
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,#f4f0ed_0%,#ebe5e0_100%)] p-6">
              <div className="mx-auto w-full max-w-[794px] shadow-[0_18px_52px_rgba(42,7,0,0.22)]">
                {pngPreview.url ? <img src={pngPreview.url} alt={`Pré-visualização do PNG · Página ${previewPageIndex + 1}`} width={794} height={1123} className="block h-auto w-full shadow-xl" /> : <p role="status" className="p-6 text-center font-semibold">{pngPreview.error || "Gerando pré-visualização…"}</p>}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-hpsr-border bg-white px-4 py-3">
              <div className="flex items-center gap-2">
                <button type="button" disabled={previewPageIndex === 0} onClick={() => setPreviewPageIndex((current) => Math.max(0, current - 1))} className="h-9 rounded-[11px] border border-hpsr-border bg-white px-3 text-xs font-black disabled:opacity-40">Anterior</button>
                <span className="text-xs font-black text-hpsr-muted">{previewPageIndex + 1}/{Math.max(previewPageHtmls.length, 1)}</span>
                <button type="button" disabled={previewPageIndex >= previewPageHtmls.length - 1} onClick={() => setPreviewPageIndex((current) => Math.min(previewPageHtmls.length - 1, current + 1))} className="h-9 rounded-[11px] border border-hpsr-border bg-white px-3 text-xs font-black disabled:opacity-40">Próxima</button>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewOpen(false)}
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text hover:border-hpsr-wine/40"
                >
                  <Eye size={15} /> Editar
                </button>
                <button
                  type="button"
                  onClick={downloadPng}
                  disabled={!pngPreview.url}
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] bg-hpsr-wine px-4 text-xs font-black text-white hover:bg-hpsr-wineDark"
                >
                  <Download size={15} /> Baixar PNG
                </button>
                {editingRecordId && !isConfidential ? (
                  <button
                    type="button"
                    onClick={() => void saveDocument({ publishCurrent: true })}
                    disabled={savingDocument}
                    className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-emerald-300 bg-emerald-50 px-4 text-xs font-black text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Send size={15} /> {savingDocument ? "Publicando..." : "Salvar e atualizar Portal"}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void saveDocument()}
                  disabled={savingDocument}
                  className="inline-flex h-10 items-center gap-2 rounded-[12px] border border-hpsr-border bg-white px-4 text-xs font-black text-hpsr-text transition hover:border-hpsr-wine/40 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={15} /> {savingDocument ? "Salvando..." : "Salvar no sistema"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {quickPatientOpen && (
        <PatientQuickRegisterModal
          draft={quickPatientDraft}
          setDraft={setQuickPatientDraft}
          onCancel={() => setQuickPatientOpen(false)}
          onSave={saveQuickPatient}
        />
      )}

      {appDialog && (
        <div className="hpsr-modal-tone fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <button
            type="button"
            className="hpsr-modal-backdrop"
            onClick={() => setAppDialog(null)}
            aria-label="Fechar"
          />
          <div className="hpsr-modal-shell max-w-md">
            <div className="hpsr-modal-header">
              <h2 className="text-lg font-bold text-hpsr-text">
                {appDialog.title}
              </h2>
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-zinc-600">
                {appDialog.message}
              </p>
              <div className="mt-4 flex justify-end gap-2">
                {appDialog.actions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={action.onClick}
                    className={
                      action.variant === "primary"
                        ? "hpsr-button-primary"
                        : "hpsr-button-soft"
                    }
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
