"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Droplets,
  FilePenLine,
  History,
  RotateCcw,
  Save,
  Search,
  ShieldAlert,
  UserRound,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { createClient } from "@/lib/supabase";
import { hpsrAlert } from "@/components/ui/HpsrDialogProvider";

type Answer = "sim" | "nao" | "na";
type ResultKey = "apto" | "inapto-temporario" | "inapto" | "avaliacao" | "nao-autorizada";

type DonorForm = {
  nome: string;
  idade: string;
  passaporte: string;
  peso: string;
  telefone: string;
  medicoResponsavel: string;
  dataTriagem: string;
  senteBem: Answer;
  dormiuSeisHoras: Answer;
  alimentouAdequadamente: Answer;
  barrasCheias: Answer;
  doencaCronica: Answer;
  doencas: string[];
  doencaDetalhes: string;
  usaMedicamento: Answer;
  medicamentos: string[];
  medicamentoDetalhes: string;
  febreOuGripe14Dias: Answer;
  procedimentoRecente: Answer;
  transfusao12Meses: Answer;
  transfusaoQuando: string;
  tatuagem12Meses: Answer;
  contatoInfeccioso: Answer;
  relacoesRisco: Answer;
  drogasInjetaveis: Answer;
  istRecente: Answer;
  exposicaoInfecciosa: Answer;
  gravida: Answer;
  amamentando: Answer;
  menstruada: Answer;
  aborto6Meses: Answer;
  viagemRisco: Answer;
  viagemDetalhes: string;
  jaDoou: Answer;
  reacaoAnterior: Answer;
  consentimento: Answer;
  observacaoMedica: string;
};

type Analysis = {
  result: ResultKey;
  title: string;
  tone: string;
  icon: typeof CheckCircle2;
  message: string;
  conduct: string;
  reasons: string[];
  missing: string[];
};

type DonationRecord = {
  id: string;
  createdAt: string;
  form: DonorForm;
  analysis: Analysis;
};

const answerOptions: Array<{ value: Answer; label: string }> = [
  { value: "sim", label: "Sim" },
  { value: "nao", label: "Não" },
  { value: "na", label: "N/A" },
];

const chronicOptions = [
  "HIV/AIDS",
  "Hepatite B ou C",
  "Doença de Chagas",
  "Sífilis não tratada",
  "Tuberculose ativa",
  "Câncer",
  "Diabetes sem controle",
  "Doença cardíaca grave",
  "Anemia moderada ou grave",
  "Outra condição",
];

const medicationOptions = [
  "Anticoagulantes",
  "Antibióticos recentes",
  "Medicamentos para epilepsia",
  "Isotretinoína",
  "Finasterida",
  "Dutasterida",
  "Outro medicamento",
];

const resultConfig: Record<ResultKey, Omit<Analysis, "reasons" | "missing">> = {
  apto: {
    result: "apto",
    title: "Apto para doação",
    tone: "border-emerald-200 bg-emerald-50 text-emerald-800",
    icon: CheckCircle2,
    message: "Doador apto para doação conforme respostas registradas na triagem.",
    conduct: "Registrar a ficha e prosseguir conforme conduta do médico responsável.",
  },
  "inapto-temporario": {
    result: "inapto-temporario",
    title: "Inapto temporário",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
    icon: AlertTriangle,
    message: "Doador inapto temporariamente. Reavaliar após resolução do fator de bloqueio.",
    conduct: "Orientar o doador, registrar motivo e reagendar a triagem quando adequado.",
  },
  inapto: {
    result: "inapto",
    title: "Inapto",
    tone: "border-rose-200 bg-rose-50 text-rose-800",
    icon: XCircle,
    message: "Doador inapto para doação conforme critérios de segurança.",
    conduct: "Não realizar a doação. Registrar a restrição documentalmente.",
  },
  avaliacao: {
    result: "avaliacao",
    title: "Avaliação médica necessária",
    tone: "border-sky-200 bg-sky-50 text-sky-800",
    icon: ShieldAlert,
    message: "Triagem exige avaliação médica antes da decisão final.",
    conduct: "Médico responsável deve revisar os pontos sinalizados antes de liberar.",
  },
  "nao-autorizada": {
    result: "nao-autorizada",
    title: "Doação não autorizada",
    tone: "border-zinc-300 bg-zinc-100 text-zinc-800",
    icon: ClipboardList,
    message: "Doação não autorizada. O doador não confirmou consentimento ou há dados obrigatórios pendentes.",
    conduct: "Completar os dados obrigatórios e confirmar consentimento antes de finalizar.",
  },
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function createInitialForm(responsibleDoctor = ""): DonorForm {
  return {
    nome: "",
    idade: "",
    passaporte: "",
    peso: "",
    telefone: "",
    medicoResponsavel: responsibleDoctor,
    dataTriagem: today(),
    senteBem: "sim",
    dormiuSeisHoras: "sim",
    alimentouAdequadamente: "sim",
    barrasCheias: "sim",
    doencaCronica: "nao",
    doencas: [],
    doencaDetalhes: "",
    usaMedicamento: "nao",
    medicamentos: [],
    medicamentoDetalhes: "",
    febreOuGripe14Dias: "nao",
    procedimentoRecente: "nao",
    transfusao12Meses: "nao",
    transfusaoQuando: "",
    tatuagem12Meses: "nao",
    contatoInfeccioso: "nao",
    relacoesRisco: "nao",
    drogasInjetaveis: "nao",
    istRecente: "nao",
    exposicaoInfecciosa: "nao",
    gravida: "na",
    amamentando: "na",
    menstruada: "na",
    aborto6Meses: "na",
    viagemRisco: "nao",
    viagemDetalhes: "",
    jaDoou: "nao",
    reacaoAnterior: "nao",
    consentimento: "sim",
    observacaoMedica: "",
  };
}

function parseNumber(value: string) {
  const parsed = Number(value.replace(",", ".").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function includesAny(values: string[], options: string[]) {
  return values.some((value) => options.includes(value));
}

function analyzeForm(form: DonorForm): Analysis {
  const missing: string[] = [];
  const permanent: string[] = [];
  const temporary: string[] = [];
  const medical: string[] = [];

  if (!form.nome.trim()) missing.push("Nome completo do doador");
  if (!form.idade.trim()) missing.push("Idade");
  if (!form.passaporte.trim()) missing.push("Passaporte");
  if (!form.peso.trim()) missing.push("Peso atual");
  if (!form.telefone.trim()) missing.push("Telefone para contato");
  if (!form.medicoResponsavel.trim()) missing.push("Médico responsável");
  if (!form.dataTriagem.trim()) missing.push("Data da triagem");
  if (form.consentimento !== "sim") missing.push("Consentimento voluntário confirmado");

  const idade = parseNumber(form.idade);
  const peso = parseNumber(form.peso);

  if (idade === null && form.idade.trim()) missing.push("Idade em formato válido");
  if (peso === null && form.peso.trim()) missing.push("Peso em formato válido");

  if (idade !== null) {
    if (idade < 16) permanent.push("Menor de 16 anos");
    if (idade > 69) permanent.push("Maior de 69 anos");
  }
  if (peso !== null && peso < 50) permanent.push("Peso abaixo de 50 kg");

  if (form.senteBem === "nao") temporary.push("Doador não está se sentindo bem hoje");
  if (form.dormiuSeisHoras === "nao") temporary.push("Não dormiu pelo menos 6 horas");
  if (form.alimentouAdequadamente === "nao") temporary.push("Não se alimentou adequadamente");
  if (form.barrasCheias === "nao") temporary.push("Barras de comida e bebida não estão totalmente cheias");

  if (form.doencaCronica === "sim") {
    if (includesAny(form.doencas, [
      "HIV/AIDS",
      "Hepatite B ou C",
      "Doença de Chagas",
      "Sífilis não tratada",
      "Tuberculose ativa",
      "Doença cardíaca grave",
      "Anemia moderada ou grave",
    ])) permanent.push("Doença crônica ou condição de saúde incompatível com doação");

    if (form.doencas.includes("Diabetes sem controle")) medical.push("Diabetes sem controle informado");
    if (form.doencas.includes("Câncer")) medical.push("Histórico de câncer exige avaliação médica");
    if (form.doencas.includes("Outra condição")) medical.push("Outra condição de saúde informada");
    if (!form.doencas.length) medical.push("Doença crônica informada sem especificação");
  }

  if (form.usaMedicamento === "sim") {
    if (form.medicamentos.includes("Anticoagulantes")) permanent.push("Uso de anticoagulantes");
    if (form.medicamentos.includes("Antibióticos recentes")) temporary.push("Uso recente de antibióticos");
    if (form.medicamentos.includes("Isotretinoína")) temporary.push("Uso de isotretinoína");
    if (form.medicamentos.includes("Finasterida")) temporary.push("Uso de finasterida");
    if (form.medicamentos.includes("Dutasterida")) temporary.push("Uso de dutasterida");
    if (form.medicamentos.includes("Medicamentos para epilepsia")) medical.push("Medicamento para epilepsia exige avaliação médica");
    if (form.medicamentos.includes("Outro medicamento")) medical.push("Uso de medicamento não especificado exige avaliação médica");
    if (!form.medicamentos.length) medical.push("Uso de medicamento informado sem especificação");
  }

  if (form.febreOuGripe14Dias === "sim") temporary.push("Febre, infecção ou sintomas gripais nos últimos 14 dias");
  if (form.procedimentoRecente === "sim") temporary.push("Cirurgia, endoscopia ou procedimento invasivo recente");
  if (form.transfusao12Meses === "sim") temporary.push("Transfusão de sangue nos últimos 12 meses");
  if (form.tatuagem12Meses === "sim") temporary.push("Tatuagem, piercing ou micropigmentação nos últimos 12 meses");

  if (form.contatoInfeccioso === "sim") medical.push("Contato direto recente com pessoa diagnosticada com doença infecciosa");
  if (form.relacoesRisco === "sim") medical.push("Relações de risco recentes");
  if (form.drogasInjetaveis === "sim") permanent.push("Uso de drogas ilícitas injetáveis");
  if (form.istRecente === "sim") temporary.push("Histórico recente de IST/DST");
  if (form.exposicaoInfecciosa === "sim") medical.push("Exposição recente a situação de risco infeccioso");

  if (form.gravida === "sim") temporary.push("Gestação atual ou suspeita de gravidez");
  if (form.amamentando === "sim") temporary.push("Amamentação ou pós-parto sem liberação médica");
  if (form.menstruada === "sim") medical.push("Período menstrual informado");
  if (form.aborto6Meses === "sim") temporary.push("Aborto espontâneo ou provocado nos últimos 6 meses");

  if (form.viagemRisco === "sim") medical.push("Viagem recente para área com risco de doença endêmica");
  if (form.reacaoAnterior === "sim") medical.push("Reação em doação anterior");

  let result: ResultKey = "apto";
  let reasons: string[] = [];

  if (missing.length) {
    result = "nao-autorizada";
    reasons = missing;
  } else if (permanent.length) {
    result = "inapto";
    reasons = permanent;
  } else if (temporary.length) {
    result = "inapto-temporario";
    reasons = temporary;
  } else if (medical.length) {
    result = "avaliacao";
    reasons = medical;
  } else {
    reasons = ["Nenhum bloqueio identificado nas respostas da triagem"];
  }

  return { ...resultConfig[result], reasons, missing };
}

function statusClass(result: ResultKey) {
  return resultConfig[result].tone;
}

export default function BloodBankPage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [form, setForm] = useState<DonorForm>(() => createInitialForm(currentUserProfile.systemName));
  const [records, setRecords] = useState<DonationRecord[]>([]);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecord, setSelectedRecord] = useState<DonationRecord | null>(null);


  useEffect(() => {
    async function loadRecords() {
      const client = createClient();
      if (!client) return;
      const { data, error } = await client.from("blood_donations").select("id, donor_passport, payload, created_at").order("created_at", { ascending: false });
      if (error) { void hpsrAlert(`Não foi possível carregar as triagens: ${error.message}`, "Banco de Sangue"); return; }
      setRecords((data || []).map((row) => ({ ...((row.payload || {}) as DonationRecord), id: String(row.id), createdAt: String(((row.payload || {}) as Partial<DonationRecord>).createdAt || row.created_at) })));
    }
    void loadRecords();
  }, []);
  const analysis = useMemo(() => analyzeForm(form), [form]);
  const ResultIcon = analysis.icon;

  const filteredRecords = records.filter((record) => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return true;
    return [record.form.nome, record.form.passaporte, record.form.medicoResponsavel, record.analysis.title]
      .join(" ")
      .toLowerCase()
      .includes(query);
  });

  function updateField<K extends keyof DonorForm>(field: K, value: DonorForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function toggleList(field: "doencas" | "medicamentos", value: string) {
    setForm((current) => {
      const nextList = current[field].includes(value)
        ? current[field].filter((item) => item !== value)
        : [...current[field], value];

      return { ...current, [field]: nextList };
    });
  }

  async function saveRecord() {
    const client = createClient();
    if (!client) { await hpsrAlert("Não foi possível conectar ao Supabase.", "Banco de Sangue"); return; }
    const record: DonationRecord = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now()),
      createdAt: new Date().toISOString(),
      form,
      analysis,
    };
    setSaving(true);
    const { error } = await client.from("blood_donations").insert({ id: record.id, donor_passport: record.form.passaporte, payload: record, created_at: record.createdAt });
    setSaving(false);
    if (error) { await hpsrAlert(`A triagem não foi salva: ${error.message}`, "Banco de Sangue"); return; }
    setRecords((current) => [record, ...current]);
    setSelectedRecord(record);
  }

  async function cancelRecord(id: string) {
    const client = createClient();
    if (!client) return;
    const { error } = await client.from("blood_donations").delete().eq("id", id);
    if (error) { await hpsrAlert(`Não foi possível excluir a triagem: ${error.message}`, "Banco de Sangue"); return; }
    setRecords((current) => current.filter((record) => record.id !== id));
    if (selectedRecord?.id === id) setSelectedRecord(null);
  }

  function resetForm() {
    setForm(createInitialForm(currentUserProfile.systemName));
    setSelectedRecord(null);
  }

  return (
    <div className="hpsr-page gap-3">
      <PageHeader
        eyebrow="Ferramentas"
        title="Banco de Sangue"
        description="Controle documental da triagem para doação de sangue."
      />

      <div className="hpsr-page-scroll space-y-3">
      <section className="overflow-hidden rounded-[16px] border border-red-100/80 bg-[linear-gradient(180deg,#fff8f6_0%,#fffdfb_100%)]">
        <div className="border-b border-red-100/80 bg-[linear-gradient(180deg,#fff2ef_0%,#f8e4dd_100%)] px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#7a1208,#9b2a1a)] text-white shadow-[0_10px_24px_rgba(154,42,26,0.18)]">
                <Droplets size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Triagem</p>
                <h2 className="text-xl font-black text-hpsr-text">Ficha de triagem documental</h2>
              </div>
            </div>
            <div className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${analysis.tone}`}>
              {analysis.title}
            </div>
          </div>
        </div>

        <div className="grid gap-3 p-3.5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="max-h-[72vh] overflow-y-auto pr-2">
            <div className="rounded-[16px] border border-red-100/80 bg-[linear-gradient(180deg,#fffafa_0%,#ffffff_100%)] p-3.5 shadow-[0_14px_30px_rgba(154,42,26,0.05)]">
              <h3 className="text-xl font-black text-hpsr-text">Ficha de Triagem</h3>
              <p className="mt-1 text-sm text-hpsr-muted">Preencha os dados e o sistema analisará automaticamente o resultado.</p>

              <QuestionBlock title="Informações iniciais" icon={<UserRound size={17} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  <TextField label="Nome completo do doador *" value={form.nome} onChange={(value) => updateField("nome", value)} />
                  <TextField label="Passaporte *" value={form.passaporte} onChange={(value) => updateField("passaporte", value)} />
                  <TextField label="Idade *" value={form.idade} onChange={(value) => updateField("idade", value)} inputMode="numeric" />
                  <TextField label="Peso atual *" value={form.peso} onChange={(value) => updateField("peso", value)} inputMode="decimal" placeholder="Ex.: 70" />
                  <TextField label="Telefone para contato *" value={form.telefone} onChange={(value) => updateField("telefone", value)} />
                  <TextField label="Data da triagem *" type="date" value={form.dataTriagem} onChange={(value) => updateField("dataTriagem", value)} />
                  <TextField label="Médico responsável *" value={form.medicoResponsavel} onChange={(value) => updateField("medicoResponsavel", value)} className="md:col-span-2" />
                </div>
              </QuestionBlock>

              <QuestionBlock title="Condições básicas" icon={<ClipboardCheck size={17} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  <AnswerField label="Está se sentindo bem hoje?" value={form.senteBem} onChange={(value) => updateField("senteBem", value)} />
                  <AnswerField label="Dormiu pelo menos 6 horas na última noite?" value={form.dormiuSeisHoras} onChange={(value) => updateField("dormiuSeisHoras", value)} />
                  <AnswerField label="Alimentou-se adequadamente nas últimas horas?" value={form.alimentouAdequadamente} onChange={(value) => updateField("alimentouAdequadamente", value)} />
                  <AnswerField label="Barras de comida e bebida estão totalmente cheias?" value={form.barrasCheias} onChange={(value) => updateField("barrasCheias", value)} />
                </div>
              </QuestionBlock>

              <QuestionBlock title="Histórico de saúde e medicamentos" icon={<FilePenLine size={17} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  <AnswerField label="Possui alguma doença crônica diagnosticada?" value={form.doencaCronica} onChange={(value) => updateField("doencaCronica", value)} />
                  <AnswerField label="Atualmente faz uso de algum medicamento?" value={form.usaMedicamento} onChange={(value) => updateField("usaMedicamento", value)} />
                </div>
                {form.doencaCronica === "sim" && <Checklist title="Condições informadas" options={chronicOptions} selected={form.doencas} onToggle={(value) => toggleList("doencas", value)} />}
                {form.usaMedicamento === "sim" && <Checklist title="Medicamentos informados" options={medicationOptions} selected={form.medicamentos} onToggle={(value) => toggleList("medicamentos", value)} />}
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <TextArea label="Detalhes da condição" value={form.doencaDetalhes} onChange={(value) => updateField("doencaDetalhes", value)} />
                  <TextArea label="Qual medicamento / observações" value={form.medicamentoDetalhes} onChange={(value) => updateField("medicamentoDetalhes", value)} />
                  <AnswerField label="Febre, infecção ou sintomas gripais nos últimos 14 dias?" value={form.febreOuGripe14Dias} onChange={(value) => updateField("febreOuGripe14Dias", value)} />
                  <AnswerField label="Cirurgia, endoscopia ou procedimento invasivo recente?" value={form.procedimentoRecente} onChange={(value) => updateField("procedimentoRecente", value)} />
                  <AnswerField label="Transfusão de sangue nos últimos 12 meses?" value={form.transfusao12Meses} onChange={(value) => updateField("transfusao12Meses", value)} />
                  <TextField label="Quando foi a transfusão?" value={form.transfusaoQuando} onChange={(value) => updateField("transfusaoQuando", value)} />
                </div>
              </QuestionBlock>

              <QuestionBlock title="Segurança, critérios femininos e viagens" icon={<ShieldAlert size={17} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  <AnswerField label="Tatuagem, piercing ou micropigmentação nos últimos 12 meses?" value={form.tatuagem12Meses} onChange={(value) => updateField("tatuagem12Meses", value)} />
                  <AnswerField label="Contato direto com pessoa com doença infecciosa recentemente?" value={form.contatoInfeccioso} onChange={(value) => updateField("contatoInfeccioso", value)} />
                  <AnswerField label="Relações sem proteção com múltiplos parceiros nos últimos meses?" value={form.relacoesRisco} onChange={(value) => updateField("relacoesRisco", value)} />
                  <AnswerField label="Uso de drogas ilícitas injetáveis?" value={form.drogasInjetaveis} onChange={(value) => updateField("drogasInjetaveis", value)} />
                  <AnswerField label="Histórico recente de IST/DST?" value={form.istRecente} onChange={(value) => updateField("istRecente", value)} />
                  <AnswerField label="Exposição a situação de risco infeccioso?" value={form.exposicaoInfecciosa} onChange={(value) => updateField("exposicaoInfecciosa", value)} />
                  <AnswerField label="Está grávida ou suspeita de gravidez?" value={form.gravida} onChange={(value) => updateField("gravida", value)} />
                  <AnswerField label="Está amamentando?" value={form.amamentando} onChange={(value) => updateField("amamentando", value)} />
                  <AnswerField label="Está no período menstrual?" value={form.menstruada} onChange={(value) => updateField("menstruada", value)} />
                  <AnswerField label="Aborto espontâneo ou provocado nos últimos 6 meses?" value={form.aborto6Meses} onChange={(value) => updateField("aborto6Meses", value)} />
                  <AnswerField label="Viajou recentemente para área de risco endêmico?" value={form.viagemRisco} onChange={(value) => updateField("viagemRisco", value)} />
                  <TextField label="Detalhes da viagem" value={form.viagemDetalhes} onChange={(value) => updateField("viagemDetalhes", value)} />
                </div>
              </QuestionBlock>

              <QuestionBlock title="Doações anteriores e declaração final" icon={<CheckCircle2 size={17} />}>
                <div className="grid gap-3 md:grid-cols-2">
                  <AnswerField label="Já doou sangue antes?" value={form.jaDoou} onChange={(value) => updateField("jaDoou", value)} />
                  <AnswerField label="Teve reação em doações anteriores?" value={form.reacaoAnterior} onChange={(value) => updateField("reacaoAnterior", value)} />
                  <AnswerField label="Concorda em realizar a doação voluntariamente e respondeu com verdade?" value={form.consentimento} onChange={(value) => updateField("consentimento", value)} />
                  <TextArea label="Observação médica" value={form.observacaoMedica} onChange={(value) => updateField("observacaoMedica", value)} />
                </div>
              </QuestionBlock>
            </div>
          </div>

          <aside className="max-h-[72vh] overflow-y-auto pr-2">
            <section className={`rounded-[16px] border p-3.5 ${analysis.tone}`}>
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] bg-white/75">
                  <ResultIcon size={22} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] opacity-80">Resultado automático</p>
                  <h2 className="mt-1 text-lg font-black">{analysis.title}</h2>
                  <p className="mt-2 text-sm font-semibold leading-relaxed">{analysis.message}</p>
                </div>
              </div>

              <div className="mt-4 rounded-[16px] bg-white/62 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">Motivos identificados</p>
                <ul className="mt-2 space-y-1.5 text-sm font-bold">
                  {analysis.reasons.map((reason) => (
                    <li key={reason} className="flex gap-2"><span>•</span><span>{reason}</span></li>
                  ))}
                </ul>
              </div>

              <div className="mt-3 rounded-[16px] bg-white/62 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] opacity-75">Conduta sugerida</p>
                <p className="mt-2 text-sm font-bold leading-relaxed">{analysis.conduct}</p>
              </div>

              <div className="mt-4 grid gap-2">
                <button type="button" onClick={() => void saveRecord()} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-hpsr-wine px-4 py-3 text-sm font-black text-white transition hover:bg-hpsr-wineLight">
                  <Save size={16} /> Salvar ficha
                </button>
                <button type="button" onClick={resetForm} className="inline-flex items-center justify-center gap-2 rounded-[16px] border border-hpsr-border bg-white/75 px-4 py-3 text-sm font-black text-hpsr-wine transition hover:bg-white">
                  <RotateCcw size={16} /> Nova triagem
                </button>
              </div>
            </section>

            {selectedRecord && <FichaCard record={selectedRecord} />}
          </aside>
        </div>
      </section>

      <section className="overflow-hidden rounded-[16px] border border-hpsr-border bg-white/[0.88]">
        <div className="border-b border-hpsr-border bg-[linear-gradient(180deg,#fffaf4_0%,#f5eadc_100%)] px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-hpsr-wine text-white">
                <History size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Histórico</p>
                <h2 className="text-xl font-black text-hpsr-text">Fichas registradas</h2>
              </div>
            </div>

            <label className="flex min-h-[38px] w-full items-center gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 lg:max-w-sm">
              <Search size={17} className="text-hpsr-muted" />
              <input
                className="w-full bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Buscar por nome, passaporte ou resultado"
              />
            </label>
          </div>
        </div>

        <div className="max-h-[42vh] overflow-y-auto p-3.5">
          {filteredRecords.length ? (
            <div className="grid gap-3">
              {filteredRecords.map((record) => (
                <article key={record.id} className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3.5">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <h3 className="text-base font-black text-hpsr-text">{record.form.nome || "Sem nome"}</h3>
                      <p className="mt-1 text-sm font-semibold text-hpsr-muted">
                        Passaporte {record.form.passaporte || "—"} · {new Date(record.createdAt).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      <span className={`inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${statusClass(record.analysis.result)}`}>
                        {record.analysis.title}
                      </span>
                      <button type="button" onClick={() => setSelectedRecord(record)} className="rounded-[13px] border border-hpsr-border bg-white px-3 py-1.5 text-xs font-black text-hpsr-wine transition hover:bg-[#f1dfcd]">
                        Ver ficha
                      </button>
                      <button type="button" onClick={() => void cancelRecord(record.id)} className="rounded-[13px] border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-black text-rose-700 transition hover:bg-rose-100">
                        Cancelar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-[16px] border border-dashed border-hpsr-border bg-[#fffaf4] p-3.5 text-center">
              <p className="font-black text-hpsr-text">Nenhuma ficha registrada.</p>
              <p className="mt-1 text-sm font-semibold text-hpsr-muted">Preencha a triagem e salve a ficha documental.</p>
            </div>
          )}
        </div>
      </section>
      </div>
    </div>
  );
}

function FichaCard({ record }: { record: DonationRecord }) {
  return (
    <section className="mt-3 rounded-[16px] border border-hpsr-border bg-white/[0.86] p-3.5">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Ficha selecionada</p>
      <h3 className="mt-2 text-lg font-black text-hpsr-text">{record.form.nome || "Sem nome"}</h3>
      <div className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-xs font-black ${statusClass(record.analysis.result)}`}>
        {record.analysis.title}
      </div>
      <div className="mt-4 grid gap-2 text-sm font-semibold text-hpsr-muted">
        <InfoLine label="Passaporte" value={record.form.passaporte || "—"} />
        <InfoLine label="Idade" value={record.form.idade || "—"} />
        <InfoLine label="Peso" value={record.form.peso ? `${record.form.peso} kg` : "—"} />
        <InfoLine label="Telefone" value={record.form.telefone || "—"} />
        <InfoLine label="Médico" value={record.form.medicoResponsavel || "—"} />
        <InfoLine label="Data" value={new Date(record.createdAt).toLocaleString("pt-BR")} />
      </div>
      <div className="mt-4 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">Motivos</p>
        <div className="mt-2 space-y-1 text-sm font-bold text-hpsr-text">
          {record.analysis.reasons.map((reason) => <p key={reason}>• {reason}</p>)}
        </div>
      </div>
      {record.form.observacaoMedica && (
        <div className="mt-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">Observação médica</p>
          <p className="mt-2 text-sm font-semibold text-hpsr-text">{record.form.observacaoMedica}</p>
        </div>
      )}
    </section>
  );
}

function QuestionBlock({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="mt-5 border-t border-hpsr-border/80 pt-5">
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-[13px] bg-hpsr-wine text-white">{icon}</div>
        <h4 className="text-base font-black text-hpsr-text">{title}</h4>
      </div>
      {children}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  inputMode?: "text" | "numeric" | "decimal";
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{label}</span>
      <input
        type={type}
        value={value}
        inputMode={inputMode}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1.5 min-h-[38px] w-full rounded-[16px] border border-hpsr-border bg-white px-3 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20"
      />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-[0.1em] text-hpsr-wineLight">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={3}
        className="mt-1.5 w-full resize-none rounded-[16px] border border-hpsr-border bg-white px-3 py-2 text-sm font-semibold text-hpsr-text outline-none transition focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20"
      />
    </label>
  );
}

function AnswerField({ label, value, onChange }: { label: string; value: Answer; onChange: (value: Answer) => void }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
      <p className="text-sm font-black leading-snug text-hpsr-text">{label}</p>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {answerOptions.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`rounded-[12px] border px-2 py-2 text-[11px] font-black transition ${
              value === option.value
                ? "border-hpsr-wine bg-hpsr-wine text-white"
                : "border-hpsr-border bg-white text-hpsr-wine hover:bg-[#f1dfcd]"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Checklist({ title, options, selected, onToggle }: { title: string; options: string[]; selected: string[]; onToggle: (value: string) => void }) {
  return (
    <div className="mt-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-hpsr-wineLight">{title}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {options.map((option) => {
          const active = selected.includes(option);
          return (
            <button
              key={option}
              type="button"
              onClick={() => onToggle(option)}
              className={`rounded-[14px] border px-3 py-2 text-left text-xs font-black transition ${
                active ? "border-hpsr-wine bg-hpsr-wine text-white" : "border-hpsr-border bg-white text-hpsr-wine hover:bg-[#f1dfcd]"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-hpsr-border/70 pb-1 last:border-0">
      <span className="font-black text-hpsr-wineLight">{label}</span>
      <span className="text-right text-hpsr-text">{value}</span>
    </div>
  );
}
