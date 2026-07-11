"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  BriefcaseMedical,
  CheckCircle2,
  ClipboardCheck,
  Gavel,
  Search,
  Send,
  ShieldAlert,
  Stethoscope,
  UserRound,
  X,
} from "lucide-react";
import { FormField, inputClass } from "@/components/ui/FormField";
import { mirrorRecord } from "@/lib/data-bridge";

const desiredRoles = [
  "Médico Clínico",
  "Médico Especialista",
  "Médico Cirurgião",
  "Residente",
  "Estagiário de Enfermagem",
];

const interestAreas = [
  "Clínico Geral",
  "Obstetra",
  "Pediatra",
  "Psicóloga",
  "Psiquiatra",
  "Neurologia",
  "Oftalmologia",
  "Cardiologia",
  "Dermatologia",
  "Nutricionista",
  "Cirurgião",
  "Ginecologia",
];

const objectiveOptions = [
  "Seguir carreira",
  "Aprendizado",
  "Renda temporária",
  "Crescimento profissional",
  "Outro",
];


const scheduleOptions = [
  { label: "Manhã", time: "06h - 12h" },
  { label: "Tarde", time: "12h - 18h" },
  { label: "Noite", time: "18h - 00h" },
  { label: "Madrugada", time: "00h - 06h" },
];

const stages = [
  {
    title: "Análise da candidatura",
    description: "Realizada a partir das informações preenchidas no formulário.",
  },
  {
    title: "Entrevista",
    description: "Caso aprovado na primeira etapa, o candidato será chamado para conversa com a equipe responsável.",
  },
  {
    title: "Período de teste",
    description: "O ingresso inicial poderá ocorrer em regime de estágio ou adaptação supervisionada.",
  },
];

const rules = [
  "Proibido qualquer tipo de violência nas dependências do hospital.",
  "Proibido portar armas dentro do hospital.",
  "Proibido envolvimento em atividades ilegais sendo membro do corpo clínico.",
  "Respeite a hierarquia e o fluxo de atendimentos.",
  "É obrigatório manter conduta compatível com o ambiente hospitalar e o RP.",
  "O uso correto de animações, comandos e interpretação será considerado no processo.",
];

const quizQuestions = [
  {
    question: "Você está de serviço e recebe um chamado externo. Qual deve ser a conduta correta no RP?",
    options: [
      "Avisar na rádio que está indo ao chamado, manter comunicação e retornar informando a situação.",
      "Sair em silêncio para ganhar tempo e avisar apenas quando voltar.",
      "Pedir para outro membro assumir sem comunicar a equipe responsável.",
    ],
  },
  {
    question: "Um paciente chega ao hospital e senta no chão para ser atendido. O que você deve fazer?",
    options: [
      "Orientar o paciente e realizar o atendimento em local adequado, como maca, leito ou ambulância quando necessário.",
      "Atender normalmente no chão para acelerar o procedimento.",
      "Ignorar o paciente até ele levantar sozinho.",
    ],
  },
  {
    question: "Durante o plantão, qual postura é esperada sobre rádio e ponto?",
    options: [
      "Bater ponto, permanecer disponível na rádio do hospital e manter comunicação enquanto estiver em serviço.",
      "Entrar em serviço sem bater ponto se houver pouco movimento.",
      "Ficar fora da rádio e responder apenas por mensagem privada.",
    ],
  },
  {
    question: "Um membro da equipe discorda de uma orientação de um superior durante atendimento. Qual é a melhor conduta?",
    options: [
      "Respeitar a hierarquia no momento, manter o atendimento organizado e tratar divergências depois pelo canal adequado.",
      "Discutir na frente do paciente para provar que está certo.",
      "Abandonar o atendimento até alguém concordar com sua opinião.",
    ],
  },
  {
    question: "Um paciente solicita cadeira de rodas para sair pela cidade. Como agir conforme a norma?",
    options: [
      "Explicar que cadeiras de rodas são de uso interno do hospital e não devem ser retiradas para uso externo.",
      "Liberar a cadeira se o paciente prometer devolver depois.",
      "Vender ou emprestar a cadeira para evitar conflito.",
    ],
  },
  {
    question: "Em uma situação de atendimento com várias vítimas, qual deve ser a prioridade clínica?",
    options: [
      "Organizar a triagem, priorizar casos mais graves e seguir o fluxo de atendimento do hospital.",
      "Atender primeiro conhecidos ou quem pedir com mais insistência.",
      "Atender por ordem de chegada sem avaliar gravidade.",
    ],
  }
];

const STAFF_APPLICATIONS_KEY = "hpsr-staff-applications";

type StoredStaffApplication = {
  protocol: string;
  token: string;
  name: string;
  passport: string;
  desiredRole: string;
  interestArea: string;
  availability: string;
  cityPhone: string;
  discord: string;
  experience: string;
  motivation: string;
  notes: string;
  status: string;
  createdAt: string;
  triageDecision?: "Aprovado" | "Recusado" | "Pendente";
  decisionAt?: string;
  interviewStatus?: "Não agendada" | "Agendada" | "Realizada" | "Sem resposta";
  interviewAt?: string;
  interviewResult?: "Contratado" | "Não contratado" | "Pendente";
  interviewNotes?: string;
  birthDay?: string;
  birthMonth?: string;
  objective?: string;
  externalAvailability?: string;
  priorExperience?: string;
  declarationAccepted?: boolean;
  quizAnswers?: Array<{
    question: string;
    answer: string;
    optionIndex: number;
    correct: boolean;
  }>;
};

function readStoredApplications(): StoredStaffApplication[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(STAFF_APPLICATIONS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveStoredApplications(applications: StoredStaffApplication[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STAFF_APPLICATIONS_KEY, JSON.stringify(applications));
  const application = applications[0];
  if (application) {
    void mirrorRecord("staff_applications", {
      id: application.protocol,
      passport: application.passport,
      token: application.token,
      name: application.name,
      desired_role: application.desiredRole,
      status: application.status,
      payload: application,
      created_at: application.createdAt,
      updated_at: new Date().toISOString(),
    });
  }
}

function generateApplicationToken(existing: StoredStaffApplication[]) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";

  do {
    token = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  } while (existing.some((item) => item.token === token));

  return token;
}

export function RecruitmentClient() {
  const [applicationOpen, setApplicationOpen] = useState(false);
  const [consultOpen, setConsultOpen] = useState(false);

  return (
    <>
      <section className="public-pattern min-h-screen px-4 py-10 text-hpsr-text lg:px-5">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <span className="inline-flex rounded-full border border-hpsr-border bg-white/70 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-hpsr-wineLight">
              Área pública
            </span>
            <h1 className="mt-5 text-[clamp(1.45rem,4vw,2rem)] font-black tracking-tight text-hpsr-text lg:text-[clamp(1.7rem,5vw,2.55rem)]">
              Edital de Recrutamento
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-hpsr-muted lg:text-base">
              Hospital São Rafael · Eldorado
            </p>
          </div>

          <section className="mx-auto mt-5 max-w-4xl border border-hpsr-border bg-white/65 px-4 py-3 text-center ">
            <p className="mx-auto max-w-3xl text-sm font-semibold leading-relaxed text-hpsr-muted md:text-base">
              O Hospital São Rafael abre seu processo de recrutamento para novos integrantes comprometidos com ética, responsabilidade e atendimento humanizado em Eldorado. Buscamos pessoas dispostas a aprender, respeitar protocolos e contribuir com a organização da equipe.
            </p>
          </section>

          <section className="mx-auto mt-5 max-w-4xl rounded-[18px] border border-[#e9e2d7] bg-[#fcf6ee] p-3.5 ">
            <div className="flex flex-col gap-3 md:flex-row md:items-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[#f6efe3] text-hpsr-wine">
                <AlertTriangle size={22} />
              </div>

              <div>
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-hpsr-wine">
                  Informações importantes
                </h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-[#7a3a28]">
                  <li>• O candidato não pode estar empregado no momento.</li>
                  <li>• É necessário estar em concordância com as diretrizes da cidade e com o Regimento Interno.</li>
                  <li>• <strong>Não tem experiência?</strong> Sem problemas. O Hospital São Rafael também atua na formação de novos profissionais.</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mx-auto mt-4 grid max-w-4xl gap-3 lg:grid-cols-2">
            <article className="rounded-[24px] border border-hpsr-border bg-white/65 p-3.5 ">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
                  <ClipboardCheck size={20} />
                </div>
                <h2 className="text-xl font-black text-hpsr-text">Etapas do Processo</h2>
              </div>

              <div className="space-y-5">
                {stages.map((stage, index) => (
                  <div key={stage.title} className="flex gap-3">
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-hpsr-text text-xs font-black text-white">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-relaxed text-hpsr-muted">
                      <strong className="text-hpsr-text">{stage.title}:</strong> {stage.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[14px] border border-red-200 bg-red-50/70 p-3.5">
                <div className="flex items-start gap-3">
                  <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-500" />
                  <div>
                    <h3 className="text-sm font-black text-red-600">Atenção ao Estágio</h3>
                    <p className="mt-2 text-xs leading-relaxed text-hpsr-muted">
                      Faltas injustificadas ou má conduta durante o período de estágio poderão gerar
                      anulação imediata e multa rescisória de <strong>R$ 250.000,00</strong> em caso de
                      justa causa ou desistência indevida.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            <article className="rounded-[24px] border border-hpsr-border bg-white/65 p-3.5 ">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[#f7f2ea] text-hpsr-wine">
                  <Gavel size={20} />
                </div>
                <h2 className="text-xl font-black text-hpsr-text">Regras Gerais</h2>
              </div>

              <ul className="space-y-4 text-sm leading-relaxed text-hpsr-muted">
                {rules.map((rule) => (
                  <li key={rule} className="flex gap-3">
                    <CheckCircle2 size={17} className="mt-0.5 shrink-0 text-hpsr-wine" />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/regimento"
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-hpsr-border bg-white/[0.86] px-4 py-3 text-sm font-black text-hpsr-wine transition hover:bg-white"
              >
                Ler Regimento Interno Completo
              </Link>
            </article>
          </section>

          <section className="mx-auto mt-4 flex max-w-4xl flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setApplicationOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white  transition"
            >
              <BriefcaseMedical size={18} />
              Quero me candidatar
            </button>

            <button
              type="button"
              onClick={() => setConsultOpen(true)}
              className="inline-flex flex-1 items-center justify-center gap-3 rounded-xl border border-hpsr-border bg-white/[0.86] px-4 py-3 text-sm font-black text-hpsr-wine  transition hover:bg-white"
            >
              <Search size={18} />
              Consultar candidatura
            </button>
          </section>
        </div>
      </section>

      <ApplicationModal open={applicationOpen} onClose={() => setApplicationOpen(false)} />
      <ConsultApplicationModal open={consultOpen} onClose={() => setConsultOpen(false)} />
    </>
  );
}

function ApplicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [submittedApplication, setSubmittedApplication] = useState<StoredStaffApplication | null>(null);
  const submitted = Boolean(submittedApplication);
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);

  useModalBehavior(open, onClose);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = new FormData(event.currentTarget);
    const passport = String(form.get("passport") ?? "").trim();
    const now = new Date().toISOString();
    const stored = readStoredApplications();
    const token = generateApplicationToken(stored);

    const quizAnswers = quizQuestions.map((item, index) => {
      const optionIndex = Number(form.get(`quiz-${index}`) ?? -1);
      return {
        question: item.question,
        answer: optionIndex >= 0 ? item.options[optionIndex] : "Não respondida",
        optionIndex,
        correct: optionIndex === 0,
      };
    });

    const application: StoredStaffApplication = {
      protocol: `HPSR-EQP-${passport || Date.now()}`,
      token,
      name: String(form.get("name") ?? "").trim(),
      passport,
      desiredRole: "Não informado",
      interestArea: "Não informada",
      availability: selectedSchedules.join(", "),
      cityPhone: String(form.get("cityPhone") ?? "").trim(),
      discord: String(form.get("discord") ?? "").trim(),
      experience: String(form.get("experience") ?? "").trim(),
      motivation: String(form.get("motivation") ?? "").trim(),
      notes: String(form.get("notes") ?? "").trim(),
      birthDay: String(form.get("birthDay") ?? "").trim(),
      birthMonth: String(form.get("birthMonth") ?? "").trim(),
      objective: String(form.get("objective") ?? "").trim(),
      externalAvailability: String(form.get("externalAvailability") ?? "").trim(),
      priorExperience: String(form.get("priorExperience") ?? "").trim(),
      declarationAccepted: form.get("declarationAccepted") === "accepted",
      quizAnswers,
      status: "pendente",
      createdAt: now,
    };

    const withoutSamePassport = stored.filter((item) => item.passport !== application.passport);
    saveStoredApplications([application, ...withoutSamePassport]);

    setSubmittedApplication(application);
  }

  function toggleSchedule(period: string) {
    setSelectedSchedules((current) =>
      current.includes(period)
        ? current.filter((item) => item !== period)
        : [...current, period]
    );
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="hpsr-modal-backdrop"
      />

      <div className="hpsr-modal-shell max-w-5xl">
        <ModalHeader
          eyebrow="Recrutamento"
          title={submitted ? "Candidatura registrada" : "Ficha de inscrição"}
          description={
            submitted
              ? "Guarde o token gerado para consultar o andamento da candidatura."
              : "Preencha todos os campos obrigatórios e finalize o quiz de normas antes do envio."
          }
          onClose={onClose}
        />

        {submitted ? (
          <div className="p-6">
            <div className="rounded-[24px] border border-[#e9e2d7] bg-white p-3.5 text-center">
              <CheckCircle2 className="mx-auto text-hpsr-wine" size={42} />
              <h3 className="mt-4 text-lg font-black text-hpsr-text">Candidatura enviada com sucesso</h3>
              <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-hpsr-muted">
                Sua ficha foi registrada no sistema. Use o passaporte e o token abaixo para consultar o andamento da candidatura.
              </p>

              <div className="mx-auto mt-5 max-w-sm rounded-[18px] border border-blue-200 bg-blue-50 p-3.5">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-blue-700">Token de consulta</p>
                <p className="mt-2 select-all text-lg font-black tracking-[0.18em] text-blue-950">{submittedApplication?.token}</p>
                <p className="mt-2 text-xs font-bold leading-relaxed text-blue-800">Guarde esse código. Ele será solicitado junto com o passaporte.</p>

                <div className="mt-3 rounded-[16px] border border-red-200 bg-red-50 px-3 py-2 text-left">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-red-700">Atenção</p>
                  <p className="mt-1 text-xs font-bold leading-relaxed text-red-800">
                    Não compartilhe esse token. Ele é pessoal e será usado para consultar sua candidatura.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSubmittedApplication(null);
                  setSelectedSchedules([]);
                  onClose();
                }}
                className="mt-6 rounded-xl bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white"
              >
                Concluir
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="max-h-[76vh] overflow-y-auto bg-[#fff8f1]/72 p-3.5 md:p-5">
            <div className="rounded-[26px] border border-hpsr-border bg-white/[0.86] p-3.5">
              <h3 className="text-xl font-black text-hpsr-text">Ficha de Inscrição</h3>
              <p className="mt-1 text-sm text-hpsr-muted">Preencha todos os campos obrigatórios (*)</p>

              <div className="mt-6 grid gap-3 md:grid-cols-2">
                <FormField label="Nome completo do personagem *">
                  <input className={inputClass} name="name" placeholder="Ex: Dr. Emerson..." required />
                </FormField>

                <FormField label="Passaporte (ID) *">
                  <input className={inputClass} name="passport" placeholder="Ex: 1234" required />
                </FormField>

                <FormField label="Dia de nascimento *">
                  <input className={inputClass} name="birthDay" placeholder="Ex: 15" required />
                </FormField>

                <FormField label="Mês de nascimento *">
                  <select name="birthMonth" className={inputClass} required defaultValue="">
                    <option value="" disabled>Selecione o mês</option>
                    <option>Janeiro</option>
                    <option>Fevereiro</option>
                    <option>Março</option>
                    <option>Abril</option>
                    <option>Maio</option>
                    <option>Junho</option>
                    <option>Julho</option>
                    <option>Agosto</option>
                    <option>Setembro</option>
                    <option>Outubro</option>
                    <option>Novembro</option>
                    <option>Dezembro</option>
                  </select>
                </FormField>

                <FormField label="Telefone na cidade *">
                  <input className={inputClass} name="cityPhone" placeholder="(055) 123-456" required />
                </FormField>

                <div>
                  <FormField label="ID do Discord *">
                    <input className={inputClass} name="discord" placeholder="Ex: 1717123456789 (Cole aqui)" required />
                  </FormField>

                  <div className="mt-3 rounded-[14px] border border-blue-200 bg-blue-50 px-4 py-3 text-xs leading-relaxed text-blue-700">
                    <p className="font-black">Como pegar o ID correto:</p>
                    <p className="mt-1">
                      <strong>PC:</strong> Clique na sua foto no canto inferior esquerdo para abrir o perfil e depois clique no botão <strong>“Copiar ID do usuário”.</strong>
                    </p>
                    <p className="mt-1">
                      <strong>Celular:</strong> Vá no seu Perfil &gt; Role até o fim &gt; Toque em <strong>“Copiar ID”.</strong>
                    </p>
                    <p className="mt-2 font-black text-red-500">
                      ⚠ NÃO COLOQUE SEU APELIDO DO SERVIDOR! O ID É APENAS NÚMEROS.
                    </p>
                  </div>
                </div>

                <FormField label="Objetivo no hospital *">
                  <select name="objective" className={inputClass} required defaultValue="">
                    <option value="" disabled>Selecione uma opção</option>
                    {objectiveOptions.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Disponibilidade para dirigir e atender chamados externos *">
                  <select name="externalAvailability" className={inputClass} required defaultValue="">
                    <option value="" disabled>Selecione uma opção</option>
                    <option>Tenho disponibilidade total</option>
                    <option>Tenho disponibilidade parcial</option>
                    <option>Prefiro atuar internamente</option>
                    <option>Não possuo disponibilidade</option>
                  </select>
                </FormField>

                <div className="md:col-span-2">
                  <p className="mb-2 block text-sm font-black text-hpsr-text">
                    Disponibilidade de horário (marque todos que puder) *
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {scheduleOptions.map((item) => {
                      const active = selectedSchedules.includes(item.label);

                      return (
                        <button
                          key={item.label}
                          type="button"
                          onClick={() => toggleSchedule(item.label)}
                          className={`rounded-[20px] border px-4 py-3 text-center transition ${
                            active
                              ? "border-hpsr-wine bg-[#f7f2ea] "
                              : "border-hpsr-border bg-white hover:border-hpsr-wine/40"
                          }`}
                        >
                          <div className="flex items-center justify-center text-hpsr-muted">
                            <UserRound size={16} />
                          </div>
                          <p className="mt-2 text-sm font-black text-hpsr-wine">{item.label}</p>
                          <p className="text-xs text-hpsr-muted">{item.time}</p>
                        </button>
                      );
                    })}
                  </div>
                  <input
                    required
                    readOnly
                    value={selectedSchedules.join(", ")}
                    className="sr-only"
                    tabIndex={-1}
                  />
                </div>

                <div className="md:col-span-2">
                  <p className="mb-2 block text-sm font-black text-hpsr-text">
                    Possui experiência prévia na área médica? *
                  </p>
                  <div className="flex gap-3 rounded-[14px] border border-hpsr-border bg-white px-4 py-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-hpsr-muted">
                      <input type="radio" name="experience" value="Sim" className="accent-hpsr-wine" required />
                      Sim
                    </label>
                    <label className="flex items-center gap-2 text-sm font-semibold text-hpsr-muted">
                      <input type="radio" name="experience" value="Não" className="accent-hpsr-wine" required />
                      Não
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Experiência anterior em RP médico">
                    <textarea
                      className={inputClass}
                      rows={4}
                      name="priorExperience" placeholder="Descreva sua experiência anterior, se houver."
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Motivação para entrar na equipe *">
                    <textarea
                      className={inputClass}
                      rows={4}
                      name="motivation" placeholder="Explique por que deseja fazer parte do Hospital São Rafael."
                      required
                    />
                  </FormField>
                </div>

                <div className="md:col-span-2">
                  <FormField label="Observações">
                    <textarea
                      className={inputClass}
                      rows={3}
                      name="notes" placeholder="Informações adicionais, se necessário."
                    />
                  </FormField>
                </div>
              </div>
            </div>

            <div className="mt-6 rounded-[18px] border border-hpsr-border bg-white/70 p-3.5 ">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-[14px] bg-[#f7f2ea] text-hpsr-wine">
                  <Stethoscope size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-hpsr-text">Quiz de Normas e Situações RP</h3>
                  <p className="text-sm text-hpsr-muted">
                    Responda às situações abaixo com base nas normas internas e na conduta esperada dentro do RP médico.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {quizQuestions.map((item, index) => (
                  <div key={item.question} className="rounded-[22px] border border-hpsr-border bg-[#fcf6ee] p-3.5">
                    <p className="text-sm font-black text-hpsr-text">
                      {index + 1}. {item.question}
                    </p>

                    <div className="mt-4 space-y-3">
                      {item.options.map((option, optionIndex) => (
                        <label
                          key={option}
                          className="flex items-start gap-3 rounded-[14px] border border-hpsr-border bg-white px-4 py-3 text-sm leading-relaxed text-hpsr-muted"
                        >
                          <input
                            type="radio"
                            name={`quiz-${index}`}
                            value={String(optionIndex)}
                            required
                            className="mt-1 accent-hpsr-wine"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <label className="mt-6 flex items-start gap-3 rounded-[14px] border border-hpsr-border bg-white p-3.5 text-sm font-semibold leading-relaxed text-hpsr-muted">
                <input type="checkbox" name="declarationAccepted" value="accepted" required className="mt-1 accent-hpsr-wine" />
                <span>
                  Declaro que as informações preenchidas são verdadeiras dentro do contexto RP e estou ciente de que o envio não garante aprovação.
                </span>
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex flex-1 items-center justify-center rounded-xl border border-hpsr-border bg-white px-4 py-3 text-sm font-black text-hpsr-wine"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="inline-flex flex-1 items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white "
              >
                <Send size={18} />
                Enviar candidatura
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function ConsultApplicationModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [passport, setPassport] = useState("");
  const [token, setToken] = useState("");
  const [searched, setSearched] = useState(false);
  const [result, setResult] = useState<StoredStaffApplication | null>(null);

  useModalBehavior(open, onClose);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const normalizedPassport = passport.trim();
    const normalizedToken = token.trim().toUpperCase();
    const found = readStoredApplications().find((item) => item.passport === normalizedPassport && item.token === normalizedToken) ?? null;
    setResult(found);
    setSearched(true);
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[99999] grid min-h-dvh place-items-center overflow-y-auto px-4 py-3">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="hpsr-modal-backdrop"
      />

      <div className="hpsr-modal-shell max-w-xl">
        <ModalHeader
          eyebrow="Consulta"
          title="Consultar candidatura"
          description="Informe o passaporte e o token gerado no envio da ficha."
          onClose={onClose}
        />

        <form className="p-6" onSubmit={handleSearch}>
          <div className="grid gap-3">
            <FormField label="Passaporte">
              <input
                className={inputClass}
                placeholder="Ex: 12345"
                value={passport}
                onChange={(event) => {
                  setPassport(event.target.value);
                  if (searched) {
                    setSearched(false);
                    setResult(null);
                  }
                }}
              />
            </FormField>

            <FormField label="Token da candidatura">
              <input
                className={inputClass}
                placeholder="Ex: A7K9Q2MD"
                value={token}
                onChange={(event) => {
                  setToken(event.target.value.toUpperCase());
                  if (searched) {
                    setSearched(false);
                    setResult(null);
                  }
                }}
              />
            </FormField>
          </div>

          <button
            type="submit"
            className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-sm font-black text-white "
          >
            <Search size={18} />
            Consultar
          </button>

          {searched && result && (
            <div className="mt-6 rounded-[22px] border border-[#e9e2d7] bg-white p-3.5">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-hpsr-wineLight">
                Candidatura encontrada
              </p>
              <h3 className="mt-2 text-lg font-black text-hpsr-text">
                {result.name}
              </h3>
              <div className="mt-3 grid gap-2 text-sm font-semibold text-hpsr-muted">
                <p>Protocolo: {result.protocol}</p>
                <p>Token: {result.token}</p>
                <p>Disponibilidade: {result.availability || "Não informada"}</p>
                <p>Status: <strong className="text-hpsr-wine">{result.status}</strong></p>
              </div>
              <div className={`mt-4 rounded-[16px] border p-3 text-sm font-semibold leading-relaxed ${
                result.status === "Recusado"
                  ? "border-red-200 bg-red-50 text-red-800"
                  : result.triageDecision === "Aprovado" || ["Aprovado", "entrevista", "Contratado", "Não contratado", "Sem resposta"].includes(result.status)
                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                    : "border-amber-200 bg-amber-50 text-amber-800"
              }`}>
                {result.status === "Recusado"
                  ? "Sua candidatura foi recusada pela equipe responsável."
                  : result.status === "Contratado"
                    ? "Sua entrevista foi concluída e sua contratação foi aprovada."
                    : result.status === "Não contratado"
                      ? "A entrevista foi realizada, mas a candidatura não resultou em contratação."
                      : result.status === "Sem resposta"
                        ? "A equipe tentou contato pelo Discord, mas ainda não recebeu retorno."
                        : result.triageDecision === "Aprovado" || ["Aprovado", "entrevista"].includes(result.status)
                          ? "Você foi aprovado na triagem. Um médico entrará em contato pelo Discord para marcar a entrevista."
                          : "Sua candidatura permanece em análise pela equipe administrativa."}
                {result.interviewAt && <p className="mt-2">Entrevista agendada: {new Date(result.interviewAt).toLocaleString("pt-BR")}</p>}
              </div>
            </div>
          )}

          {searched && !result && (
            <div className="mt-6 rounded-[22px] border border-amber-200 bg-amber-50 p-3.5 text-amber-800">
              <p className="font-black">Nenhuma candidatura encontrada.</p>
              <p className="mt-1 text-sm leading-relaxed">
                Confira o passaporte e o token informado ou envie uma nova candidatura.
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

function ModalHeader({
  eyebrow,
  title,
  description,
  onClose,
}: {
  eyebrow: string;
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="hpsr-modal-header flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-hpsr-wineLight">{eyebrow}</p>
        <h2 className="mt-2 text-lg font-black text-hpsr-text">{title}</h2>
        <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{description}</p>
      </div>

      <button
        type="button"
        onClick={onClose}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-hpsr-border bg-white/[0.86] text-hpsr-muted transition hover:bg-white hover:text-hpsr-wine"
      >
        <X size={18} />
      </button>
    </div>
  );
}

function useModalBehavior(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);
}
