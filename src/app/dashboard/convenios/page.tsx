"use client";

import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { registerSystemActivity, saveFinancialPlanEntry } from "@/lib/administrative-storage";
import { useMemo, useState, type ReactNode } from "react";
import { hpsrAlert } from "@/components/ui/HpsrDialogProvider";
import {
  BadgePercent,
  CalendarCheck2,
  CalendarDays,
  Check,
  ChevronDown,
  FilePenLine,
  HeartHandshake,
  IdCard,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  UserPlus,
  UsersRound,
  UserRound,
  X,
} from "lucide-react";

const plans = [
  {
    id: "individual",
    name: "Plano Individual",
    icon: UserRound,
    price: "150 mil",
    value: 150000,
    badge: "",
    features: ["1 titular", "Sem dependentes", "20% de desconto", "Validade: 30 dias"],
  },
  {
    id: "combo",
    name: "Plano Combo",
    icon: UsersRound,
    price: "220 mil",
    value: 220000,
    badge: "Mais usado",
    features: ["1 titular", "Até 2 dependentes", "20% de desconto", "Validade: 30 dias"],
  },
  {
    id: "familia",
    name: "Plano Família",
    icon: HeartHandshake,
    price: "300 mil",
    value: 300000,
    badge: "",
    features: ["1 titular", "Até 4 dependentes", "20% de desconto", "Validade: 30 dias"],
  },
];

const dependentLimits: Record<Plan["id"], number> = {
  individual: 0,
  combo: 2,
  familia: 4,
};

const planLabels: Record<Plan["id"], string> = {
  individual: "Individual",
  combo: "Combo",
  familia: "Família",
};

type InsuranceStatus = "Ativo" | "Encerrado";

type DependentDraft = {
  id: number;
  name: string;
  passport: string;
};

type InsurancePlan = {
  id: string;
  passport: string;
  name: string;
  plan: string;
  status: InsuranceStatus;
  activatedAt: string;
  expiresAt: string;
  dependents: string;
  dependentsList: DependentDraft[];
  closedAt?: string;
  closeReason?: string;
  blockedDeletion?: boolean;
};

type RegisterDraft = {
  name: string;
  passport: string;
  activatedAt: string;
  selectedPlan: Plan["id"];
  dependents: DependentDraft[];
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const initialRegisterDraft = (): RegisterDraft => ({
  name: "",
  passport: "",
  activatedAt: todayIso(),
  selectedPlan: "combo",
  dependents: [],
});

const patients: InsurancePlan[] = [];

type Plan = (typeof plans)[number];
type Patient = InsurancePlan;

type ModalState =
  | { mode: "register" }
  | { mode: "manage" }
  | { mode: "plan"; plan: Plan }
  | { mode: "patient"; patient: Patient }
  | null;

const inputClass =
  "min-w-0 w-full rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-semibold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:bg-white focus:ring-2 focus:ring-hpsr-wineLight/20";

const labelClass = "text-[11px] font-semibold uppercase tracking-[0.15em] text-hpsr-wineLight";

const directorRoles = ["Diretora", "Vice Diretor"];
const registerRoles = ["Diretora", "Vice Diretor", "Médico Cirurgião", "Médico Especialista", "Médico Clínico"];

function parseIsoDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function formatDate(value: string) {
  if (!value || !value.includes("-")) return value;
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function addDays(value: string, days: number) {
  const date = parseIsoDate(value);
  date.setDate(date.getDate() + days);
  return toIsoDate(date);
}

function differenceInDays(fromIso: string, toIso: string) {
  const start = parseIsoDate(fromIso).getTime();
  const end = parseIsoDate(toIso).getTime();
  return Math.max(0, Math.ceil((end - start) / 86400000));
}

function isWithinRenewalWindow(plan: Patient) {
  if (plan.status !== "Ativo") return false;
  const remainingDays = differenceInDays(todayIso(), plan.expiresAt);
  return remainingDays <= 7;
}

function getRenewalMessage(plan: Patient) {
  const remainingDays = differenceInDays(todayIso(), plan.expiresAt);
  if (remainingDays <= 7) {
    return `Vence em breve · renovação disponível · restam ${remainingDays} dia${remainingDays === 1 ? "" : "s"}`;
  }
  return `Renovação disponível a partir de ${formatDate(addDays(plan.expiresAt, -7))}`;
}

function findActivePlanByPassport(plansList: Patient[], passport: string) {
  const normalizedPassport = passport.trim();
  if (!normalizedPassport) return null;

  for (const plan of plansList) {
    if (plan.status !== "Ativo") continue;
    if (plan.passport === normalizedPassport) {
      return { plan, relation: "Titular" as const, personName: plan.name, passport: plan.passport };
    }

    const dependent = plan.dependentsList.find((item) => item.passport === normalizedPassport);
    if (dependent) {
      return { plan, relation: "Dependente" as const, personName: dependent.name, passport: dependent.passport };
    }
  }

  return null;
}

function isPassportInActivePlan(plansList: Patient[], passport: string, ignoredPlanId?: string) {
  const normalizedPassport = passport.trim();
  if (!normalizedPassport) return false;

  return plansList.some((plan) => {
    if (plan.status !== "Ativo" || plan.id === ignoredPlanId) return false;
    return plan.passport === normalizedPassport || plan.dependentsList.some((dependent) => dependent.passport === normalizedPassport);
  });
}

function getDependentsLabel(dependents: DependentDraft[]) {
  if (dependents.length === 0) return "Sem dependentes";
  return `${dependents.length} dependente${dependents.length === 1 ? "" : "s"}`;
}

function purgeOldClosedPlans(plansList: Patient[]) {
  const today = todayIso();
  return plansList.filter((plan) => {
    if (plan.status !== "Encerrado" || plan.blockedDeletion) return true;
    if (!plan.closedAt) return true;
    return differenceInDays(plan.closedAt, today) <= 30;
  });
}

function normalizeExpiredPlans(plansList: Patient[]) {
  const today = todayIso();
  return plansList.map((plan) => {
    if (plan.status === "Ativo" && plan.expiresAt < today) {
      return {
        ...plan,
        status: "Encerrado" as const,
        closedAt: today,
        closeReason: "vencimento",
        blockedDeletion: false,
      };
    }
    return plan;
  });
}

export default function InsurancePage() {
  const { profile: currentUserProfile } = useCurrentUserProfile();
  const [passport, setPassport] = useState("");
  const [searchedPassport, setSearchedPassport] = useState("");
  const [modal, setModal] = useState<ModalState>(null);
  const [insurancePlans, setInsurancePlans] = useState<Patient[]>(() => purgeOldClosedPlans(normalizeExpiredPlans(patients)));
  const [registerDraft, setRegisterDraft] = useState<RegisterDraft>(() => initialRegisterDraft());

  const canRegisterPlan = registerRoles.includes(currentUserProfile.role);
  const canManagePlans = directorRoles.includes(currentUserProfile.role);

  const searchedMatch = useMemo(
    () => findActivePlanByPassport(insurancePlans, searchedPassport),
    [insurancePlans, searchedPassport]
  );

  const foundPatient = searchedMatch?.plan ?? null;

  function handleSearch() {
    setSearchedPassport(passport);
  }

  function handleOpenRegisterFromClosedPlan(plan: Patient) {
    const selectedPlan = plans.find((item) => item.name === plan.plan)?.id ?? "combo";

    setRegisterDraft({
      name: plan.name,
      passport: plan.passport,
      activatedAt: todayIso(),
      selectedPlan,
      dependents: plan.dependentsList,
    });
    setModal({ mode: "register" });
  }

  function handleSavePlan(draft: RegisterDraft) {
    const selectedPlan = plans.find((plan) => plan.id === draft.selectedPlan) ?? plans[1];
    const duplicatedPassports = [draft.passport, ...draft.dependents.map((dependent) => dependent.passport)]
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .filter((item) => isPassportInActivePlan(insurancePlans, item));

    if (duplicatedPassports.length > 0) {
      void hpsrAlert(`Não foi possível salvar. Passaporte já vinculado a plano ativo: ${duplicatedPassports.join(", ")}`, "Passaporte já vinculado");
      return;
    }

    const newPlan: Patient = {
      id: `plan-${Date.now()}`,
      passport: draft.passport.trim(),
      name: draft.name.trim(),
      plan: selectedPlan.name,
      status: "Ativo",
      activatedAt: draft.activatedAt,
      expiresAt: addDays(draft.activatedAt, 30),
      dependents: getDependentsLabel(draft.dependents),
      dependentsList: draft.dependents
        .filter((dependent) => dependent.name.trim() && dependent.passport.trim())
        .map((dependent) => ({
          ...dependent,
          name: dependent.name.trim(),
          passport: dependent.passport.trim(),
        })),
    };

    setInsurancePlans((currentPlans) => [newPlan, ...currentPlans]);

    saveFinancialPlanEntry({
      id: `plan-finance-${Date.now()}`,
      createdAt: new Date().toISOString(),
      planId: newPlan.id,
      planName: newPlan.plan,
      holderName: newPlan.name,
      holderPassport: newPlan.passport,
      activatedAt: newPlan.activatedAt,
      expiresAt: newPlan.expiresAt,
      dependentsCount: newPlan.dependentsList.length,
      value: selectedPlan.value,
      registeredBy: currentUserProfile.systemName,
    });

    registerSystemActivity({
      module: "Financeiro",
      action: "Convênio cadastrado",
      description: `${newPlan.plan} de ${newPlan.name} registrado no Financeiro no valor de ${selectedPlan.value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`,
      actor: currentUserProfile.systemName,
      reference: newPlan.passport,
    });

    setRegisterDraft(initialRegisterDraft());
    setModal(null);
    setPassport(newPlan.passport);
    setSearchedPassport(newPlan.passport);
  }

  return (
    <div className="hpsr-page gap-3 text-hpsr-text">
      <div className="hpsr-topbar" />

      <section className="relative overflow-hidden rounded-[16px] border border-hpsr-border/80 bg-[linear-gradient(135deg,#2a0700_0%,#672614_48%,#a67a5f_100%)] px-[clamp(1rem,2vw,1.7rem)] py-[clamp(1rem,1.5vw,1.25rem)] text-white">
        <div className="pointer-events-none absolute -right-14 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-32 left-20 h-72 w-72 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute bottom-0 right-[35%] h-24 w-72 rotate-[-12deg] rounded-full bg-white/5 blur-xl" />

        <div className="relative z-10 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(390px,540px)] lg:items-center">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.14em]">
              <HeartHandshake size={15} />
              Atendimento com desconto
            </span>
            <h1 className="mt-3 text-[clamp(1.5rem,2.55vw,2.15rem)] font-black tracking-tight">
              Localize o plano do paciente
            </h1>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-white/88">
              Digite o passaporte para consultar somente vínculos ativos e verificar aviso de renovação.
            </p>
          </div>

          <div className="rounded-[16px] border border-white/60 bg-[#fffaf4] p-3.5 text-hpsr-text">
            <label className="text-sm font-semibold text-hpsr-text">Passaporte do paciente</label>
            <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <input
                className={inputClass}
                value={passport}
                onChange={(event) => setPassport(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleSearch();
                }}
                placeholder="Ex.: 4190"
              />
              <button
                type="button"
                onClick={handleSearch}
                className="inline-flex items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-black text-white transition"
              >
                <Search size={16} />
                Buscar
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(250px,0.95fr)_minmax(250px,0.95fr)]">
        <InfoCard
          eyebrow="Status atual"
          title={foundPatient ? `${foundPatient.status} · ${foundPatient.plan}` : searchedPassport ? "Nenhum plano ativo" : "Consulta do plano"}
          description={
            foundPatient && searchedMatch
              ? `${searchedMatch.personName} · ${searchedMatch.relation} · Passaporte ${searchedMatch.passport}`
              : searchedPassport
                ? "O passaporte não possui vínculo ativo ou o plano foi encerrado."
                : ""
          }
        />
        <InfoCard
          icon={<CalendarCheck2 size={19} />}
          title="Validade padrão"
          description="30 dias por plano"
        />
        <InfoCard
          icon={<BadgePercent size={19} />}
          title="Benefício"
          description="20% de desconto"
        />
      </section>

      {searchedPassport && (
        <section className="mt-4 rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
          {foundPatient && searchedMatch ? (
            <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-hpsr-wineLight">Perfil pesquisado</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-bold text-hpsr-text">{searchedMatch.personName}</h2>
                  <span className="rounded-full bg-hpsr-wine px-3 py-1 text-[11px] font-semibold text-white">
                    {searchedMatch.relation}
                  </span>
                  <span className="rounded-full border border-hpsr-border bg-[#fcf6ee] px-3 py-1 text-[11px] font-semibold text-hpsr-wine">
                    Pesquisado
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
                  {foundPatient.plan} · validade até {formatDate(foundPatient.expiresAt)} · {foundPatient.dependents}
                </p>
                {isWithinRenewalWindow(foundPatient) && (
                  <p className="mt-2 rounded-[14px] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    {getRenewalMessage(foundPatient)}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setModal({ mode: "patient", patient: foundPatient })}
                className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-2.5 text-sm font-black text-white transition"
              >
                Ver detalhes
              </button>
            </div>
          ) : (
            <div className="grid gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-hpsr-wineLight">Resultado da busca</p>
                <h2 className="mt-1 text-lg font-bold text-hpsr-text">Nenhum plano ativo encontrado</h2>
                <p className="mt-0.5 text-sm text-hpsr-muted">
                  O passaporte {searchedPassport} não possui convênio ativo. Planos encerrados não aparecem nesta busca.
                </p>
              </div>
              <button
                type="button"
                onClick={() => canRegisterPlan && setModal({ mode: "register" })}
                disabled={!canRegisterPlan}
                className={`rounded-2xl px-4 py-2.5 text-sm font-semibold ${
                  canRegisterPlan ? "bg-hpsr-wine text-white" : "cursor-not-allowed bg-zinc-200 text-zinc-500"
                }`}
              >
                Cadastrar plano
              </button>
            </div>
          )}
        </section>
      )}

      <section className="mt-4 rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => canRegisterPlan && setModal({ mode: "register" })}
            disabled={!canRegisterPlan}
            className={`inline-flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition ${
              canRegisterPlan
                ? "bg-[linear-gradient(135deg,#672614,#74321e)] text-white"
                : "cursor-not-allowed bg-zinc-200 text-zinc-500"
            }`}
          >
            <Plus size={15} />
            Cadastrar plano
          </button>
          <button
            type="button"
            onClick={() => canManagePlans && setModal({ mode: "manage" })}
            disabled={!canManagePlans}
            title={canManagePlans ? "Gerenciar planos" : "Acesso restrito à Diretoria"}
            className={`inline-flex items-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-semibold transition ${
              canManagePlans
                ? "border-hpsr-border bg-white text-hpsr-wine hover:bg-[#fffdf9]"
                : "cursor-not-allowed border-hpsr-border bg-zinc-100 text-zinc-500"
            }`}
          >
            <Settings size={15} />
            Gerenciar
          </button>
        </div>
        {!canManagePlans && (
          <p className="mt-2 text-xs font-medium text-hpsr-muted">
            Gerenciamento de planos é restrito à Diretora e Vice Diretor. Seu cargo atual: {currentUserProfile.role}.
          </p>
        )}
      </section>

      <section className="mt-5 flex min-h-[310px] flex-1 flex-col">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Tipos disponíveis</p>
        <h2 className="mt-1 text-[clamp(1.25rem,1.8vw,1.5rem)] font-bold text-hpsr-text">
          Escolha o plano ideal
        </h2>

        <div className="mt-3 grid min-h-0 flex-1 gap-3 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} onSelect={() => canRegisterPlan && setModal({ mode: "register" })} />
          ))}
        </div>
      </section>

      <InsuranceModal
        modal={modal}
        onClose={() => setModal(null)}
        registerDraft={registerDraft}
        setRegisterDraft={setRegisterDraft}
        onSavePlan={handleSavePlan}
        insurancePlans={insurancePlans}
        setInsurancePlans={setInsurancePlans}
        onCreateFromClosedPlan={handleOpenRegisterFromClosedPlan}
      />
    </div>
  );
}

function InfoCard({
  eyebrow,
  title,
  description,
  icon,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  icon?: ReactNode;
}) {
  return (
    <article className="min-h-[92px] rounded-[16px] border border-hpsr-border bg-white p-3.5 transition hover:bg-[#fffdf9]">
      <div className="flex h-full items-center gap-3">
        {icon && (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e)] text-white">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && <p className="text-[11px] text-hpsr-wineLight">{eyebrow}</p>}
          <h3 className="mt-0.5 text-[clamp(1rem,1.3vw,1.16rem)] font-black text-hpsr-text">{title}</h3>
          {description && <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{description}</p>}
        </div>
      </div>
    </article>
  );
}

function PlanCard({ plan, onSelect }: { plan: Plan; onSelect: () => void }) {
  const Icon = plan.icon;

  return (
    <article className="group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-[16px] border border-white/70 bg-[linear-gradient(135deg,#ffffff_0%,#fffaf4_45%,#f1dfcd_100%)] p-3.5 transition hover:bg-[#fffdf9]">
      <div className="pointer-events-none absolute -bottom-24 -right-14 h-56 w-56 rounded-full bg-[#d9c7b8]/45" />
      <div className="pointer-events-none absolute -right-10 top-10 h-24 w-48 rotate-[-18deg] rounded-full bg-white/30 blur-xl" />
      <div className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-[linear-gradient(#8a4b32,#e2c18c,#b18a6e)]" />

      {plan.badge && (
        <span className="absolute right-5 top-5 rounded-full bg-hpsr-wine px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-white">
          {plan.badge}
        </span>
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#8a4b32,#b18a6e)] text-white">
          <Icon size={21} />
        </div>

        <h3 className="mt-5 text-lg font-black text-hpsr-text">{plan.name}</h3>

        <div className="mt-5 grid gap-2">
          {plan.features.map((feature) => (
            <Feature key={feature} text={feature} />
          ))}
        </div>

        <button
          type="button"
          onClick={onSelect}
          className="mt-auto flex items-center justify-between rounded-[16px] bg-[linear-gradient(135deg,#74321e,#9b5f43_52%,#b18a6e)] px-4 py-3 text-white"
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em]">Valor</span>
          <span className="text-2xl font-bold">{plan.price}</span>
        </button>
      </div>
    </article>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-medium text-hpsr-muted">
      <span className="flex h-5 w-5 items-center justify-center rounded-full border border-hpsr-border bg-[#fcf6ee] text-hpsr-wine">
        <Check size={12} />
      </span>
      {text}
    </div>
  );
}

function InsuranceModal({
  modal,
  onClose,
  registerDraft,
  setRegisterDraft,
  onSavePlan,
  insurancePlans,
  setInsurancePlans,
  onCreateFromClosedPlan,
}: {
  modal: ModalState;
  onClose: () => void;
  registerDraft: RegisterDraft;
  setRegisterDraft: (draft: RegisterDraft | ((currentDraft: RegisterDraft) => RegisterDraft)) => void;
  onSavePlan: (draft: RegisterDraft) => void;
  insurancePlans: Patient[];
  setInsurancePlans: (plans: Patient[] | ((currentPlans: Patient[]) => Patient[])) => void;
  onCreateFromClosedPlan: (plan: Patient) => void;
}) {
  if (!modal) return null;

  const title =
    modal.mode === "register"
      ? "Cadastrar plano"
      : modal.mode === "manage"
        ? "Gerenciar convênios"
        : modal.mode === "patient"
          ? "Detalhes do plano"
          : modal.plan.name;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center overflow-y-auto px-4 py-3">
      <button
        type="button"
        aria-label="Fechar modal"
        onClick={onClose}
        className="hpsr-modal-backdrop"
      />

      <div className="hpsr-modal-shell flex max-h-[calc(100dvh-1.5rem)] max-w-[900px] flex-col">
        {modal.mode !== "register" && modal.mode !== "manage" && (
          <div className="hpsr-modal-header flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hpsr-wine">Convênios</p>
              <h2 className="mt-1 text-lg font-bold text-hpsr-text">{title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-hpsr-border bg-white/[0.86] text-hpsr-muted transition hover:bg-white hover:text-hpsr-wine"
            >
              <X size={18} />
            </button>
          </div>
        )}

        <div className={modal.mode === "register" || modal.mode === "manage" ? "p-0" : "p-5"}>
          {modal.mode === "register" && (
            <RegisterPlanForm
              draft={registerDraft}
              setDraft={setRegisterDraft}
              onClose={onClose}
              onSavePlan={onSavePlan}
              insurancePlans={insurancePlans}
            />
          )}
          {modal.mode === "manage" && (
            <ManagePlans
              onClose={onClose}
              insurancePlans={insurancePlans}
              setInsurancePlans={setInsurancePlans}
              onCreateFromClosedPlan={onCreateFromClosedPlan}
            />
          )}
          {modal.mode === "patient" && <PatientPlanDetails patient={modal.patient} />}
          {modal.mode === "plan" && <PlanDetails plan={modal.plan} onClose={onClose} />}
        </div>
      </div>
    </div>
  );
}

function RegisterPlanForm({
  draft,
  setDraft,
  onClose,
  onSavePlan,
  insurancePlans,
}: {
  draft: RegisterDraft;
  setDraft: (draft: RegisterDraft | ((currentDraft: RegisterDraft) => RegisterDraft)) => void;
  onClose: () => void;
  onSavePlan: (draft: RegisterDraft) => void;
  insurancePlans: Patient[];
}) {
  const dependentLimit = dependentLimits[draft.selectedPlan];
  const canAddDependent = draft.dependents.length < dependentLimit;

  function updateDraft(field: keyof RegisterDraft, value: RegisterDraft[keyof RegisterDraft]) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
  }

  function handleSelectPlan(planId: Plan["id"]) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      selectedPlan: planId,
      dependents: currentDraft.dependents.slice(0, dependentLimits[planId]),
    }));
  }

  function handleAddDependent() {
    if (!canAddDependent) return;

    setDraft((currentDraft) => ({
      ...currentDraft,
      dependents: [
        ...currentDraft.dependents,
        {
          id: Date.now(),
          name: "",
          passport: "",
        },
      ],
    }));
  }

  function handleUpdateDependent(id: number, field: "name" | "passport", value: string) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      dependents: currentDraft.dependents.map((dependent) =>
        dependent.id === id ? { ...dependent, [field]: value } : dependent
      ),
    }));
  }

  function handleRemoveDependent(id: number) {
    setDraft((currentDraft) => ({
      ...currentDraft,
      dependents: currentDraft.dependents.filter((dependent) => dependent.id !== id),
    }));
  }

  function handleSave() {
    if (!draft.name.trim() || !draft.passport.trim()) {
      void hpsrAlert("Informe nome e passaporte do titular.", "Dados do titular");
      return;
    }

    const duplicatedInForm = draft.dependents
      .map((dependent) => dependent.passport.trim())
      .filter(Boolean)
      .filter((passport, index, list) => list.indexOf(passport) !== index);

    if (draft.dependents.some((dependent) => dependent.passport.trim() === draft.passport.trim())) {
      void hpsrAlert("O titular não pode ser cadastrado como dependente do próprio plano.", "Vínculo inválido");
      return;
    }

    if (duplicatedInForm.length > 0) {
      void hpsrAlert("Há dependentes repetidos neste cadastro.", "Dependentes duplicados");
      return;
    }

    const duplicatedPassports = [draft.passport, ...draft.dependents.map((dependent) => dependent.passport)]
      .filter(Boolean)
      .filter((item, index, list) => list.indexOf(item) === index)
      .filter((item) => isPassportInActivePlan(insurancePlans, item));

    if (duplicatedPassports.length > 0) {
      void hpsrAlert(`Não foi possível salvar. Passaporte já vinculado a plano ativo: ${duplicatedPassports.join(", ")}`, "Passaporte já vinculado");
      return;
    }

    onSavePlan(draft);
  }

  const helperText =
    draft.selectedPlan === "individual"
      ? "Plano individual não permite dependentes."
      : `Este plano permite até ${dependentLimit} dependente${dependentLimit === 1 ? "" : "s"}.`;

  return (
    <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden bg-[#fff8f1]">
      <div className="relative mx-4 mt-4 shrink-0 overflow-hidden rounded-[16px] bg-[linear-gradient(135deg,#2a0700_0%,#672614_52%,#a67a5f_100%)] px-4 py-3 text-white sm:mx-5 sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-10 bottom-[-4.5rem] h-36 w-36 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] border border-white/20 bg-white/10">
              <HeartHandshake size={25} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">Planos HPSR</p>
              <h2 className="mt-1 text-[clamp(1.45rem,2.2vw,1.95rem)] font-bold tracking-tight text-white">Cadastrar novo plano</h2>
              <p className="mt-1 text-sm leading-relaxed text-white/85">Se fechar sem salvar, o rascunho permanece. Ao salvar, os campos são limpos.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-white/25 bg-white/10 text-white transition hover:bg-white/15"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[auto_auto_minmax(0,1fr)_auto] gap-3 overflow-hidden p-3.5 sm:p-5">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome do titular">
            <div className="relative">
              <UserRound size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
              <input
                className={`${inputClass} pl-11`}
                value={draft.name}
                onChange={(event) => updateDraft("name", event.target.value)}
                placeholder="Nome completo"
              />
            </div>
          </Field>

          <Field label="Passaporte">
            <div className="relative">
              <IdCard size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
              <input
                className={`${inputClass} pl-11`}
                value={draft.passport}
                onChange={(event) => updateDraft("passport", event.target.value)}
                placeholder="Número do passaporte"
              />
            </div>
          </Field>

          <Field label="Data de ativação">
            <div className="relative">
              <CalendarDays size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
              <input
                className={`${inputClass} pl-11 pr-11`}
                type="date"
                value={draft.activatedAt}
                onChange={(event) => updateDraft("activatedAt", event.target.value)}
              />
              <CalendarCheck2 size={15} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-hpsr-text" />
            </div>
          </Field>

          <Field label="Plano">
            <div className="relative">
              <select
                className={`${inputClass} appearance-none pr-14 font-semibold`}
                value={draft.selectedPlan}
                onChange={(event) => handleSelectPlan(event.target.value as Plan["id"])}
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.id}>{plan.name}</option>
                ))}
              </select>
              <span className="pointer-events-none absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-[14px] bg-[#f1e4d3]/80 text-hpsr-wine">
                <ChevronDown size={16} />
              </span>
            </div>
          </Field>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          {plans.map((plan) => (
            <button
              key={plan.id}
              type="button"
              onClick={() => handleSelectPlan(plan.id)}
              className={`rounded-[16px] border px-4 py-3 text-left transition ${draft.selectedPlan === plan.id ? 'border-hpsr-wine bg-white' : 'border-hpsr-border bg-white/72 hover:bg-white'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">{planLabels[plan.id]}</p>
                  <p className="mt-1 text-lg font-bold text-hpsr-text">{plan.price}</p>
                </div>
                {draft.selectedPlan === plan.id && (
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-hpsr-wine text-white">
                    <Check size={13} />
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-hpsr-muted">
                {dependentLimits[plan.id] === 0
                  ? "Sem dependentes"
                  : `Até ${dependentLimits[plan.id]} dependente${dependentLimits[plan.id] === 1 ? "" : "s"}`}
              </p>
            </button>
          ))}
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden rounded-[16px] border border-hpsr-border bg-white/74">
          <div className="shrink-0 border-b border-hpsr-border/70 px-4 py-3 sm:px-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-[clamp(1.05rem,1.8vw,1.25rem)] font-bold text-hpsr-text">Dependentes</h3>
                  <span className="rounded-full border border-hpsr-border bg-[#fcf6ee] px-3 py-1 text-xs font-semibold text-hpsr-wine">
                    {draft.dependents.length}/{dependentLimit}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">{helperText}</p>
              </div>
              <button
                type="button"
                onClick={handleAddDependent}
                disabled={!canAddDependent}
                className={`inline-flex items-center justify-center gap-2 rounded-[14px] border px-4 py-2.5 text-sm font-semibold transition ${
                  canAddDependent
                    ? "border-hpsr-border bg-white text-hpsr-text hover:bg-[#fffdfa]"
                    : "cursor-not-allowed border-hpsr-border bg-[#f1e4d3]/70 text-hpsr-muted/60"
                }`}
              >
                <UserPlus size={16} className={canAddDependent ? "text-hpsr-wine" : "text-hpsr-muted/50"} />
                Adicionar
              </button>
            </div>
          </div>

          <div className="min-h-[132px] flex-1 overflow-y-auto px-4 py-3 sm:px-5">
            {draft.dependents.length === 0 ? (
              <div className="flex h-full min-h-[132px] items-center justify-center rounded-[16px] border border-dashed border-hpsr-border bg-[#fcf6ee]/72 px-4 text-center">
                <p className="text-sm leading-relaxed text-hpsr-muted">
                  Nenhum dependente adicionado. Use o botão acima quando o plano permitir.
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {draft.dependents.map((dependent, index) => (
                  <div key={dependent.id} className="rounded-[16px] border border-hpsr-border bg-[#fcf6ee]/80 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">
                        Dependente {index + 1}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleRemoveDependent(dependent.id)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-hpsr-border bg-white text-hpsr-wine transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <div className="relative">
                        <UserRound size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
                        <input
                          className={`${inputClass} py-2.5 pl-11`}
                          value={dependent.name}
                          onChange={(event) => handleUpdateDependent(dependent.id, "name", event.target.value)}
                          placeholder="Nome do dependente"
                        />
                      </div>
                      <div className="relative">
                        <IdCard size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
                        <input
                          className={`${inputClass} py-2.5 pl-11`}
                          value={dependent.passport}
                          onChange={(event) => handleUpdateDependent(dependent.id, "passport", event.target.value)}
                          placeholder="Passaporte do dependente"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-semibold text-white transition"
        >
          <Plus size={16} />
          Salvar plano
        </button>
      </div>
    </div>
  );
}

function ManagePlans({
  onClose,
  insurancePlans,
  setInsurancePlans,
  onCreateFromClosedPlan,
}: {
  onClose: () => void;
  insurancePlans: Patient[];
  setInsurancePlans: (plans: Patient[] | ((currentPlans: Patient[]) => Patient[])) => void;
  onCreateFromClosedPlan: (plan: Patient) => void;
}) {
  const [filter, setFilter] = useState<"todos" | "ativos" | "encerrados">("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);

  const filteredPatients = insurancePlans.filter((patient) => {
    const matchesFilter =
      filter === "todos" ||
      (filter === "ativos" && patient.status === "Ativo") ||
      (filter === "encerrados" && patient.status === "Encerrado");

    const normalizedSearch = searchTerm.trim().toLowerCase();
    const matchesSearch =
      !normalizedSearch ||
      patient.name.toLowerCase().includes(normalizedSearch) ||
      patient.passport.includes(normalizedSearch) ||
      patient.plan.toLowerCase().includes(normalizedSearch);

    return matchesFilter && matchesSearch;
  });

  const activeCount = insurancePlans.filter((patient) => patient.status === "Ativo").length;
  const closedCount = insurancePlans.filter((patient) => patient.status === "Encerrado").length;

  function handleSavePatient(updatedPatient: Patient) {
    if (updatedPatient.status === "Ativo") {
      const duplicatedPassports = [
        updatedPatient.passport,
        ...updatedPatient.dependentsList.map((dependent) => dependent.passport),
      ]
        .filter(Boolean)
        .filter((item, index, list) => list.indexOf(item) === index)
        .filter((item) => isPassportInActivePlan(insurancePlans, item, updatedPatient.id));

      if (duplicatedPassports.length > 0) {
        void hpsrAlert(`Não foi possível salvar. Passaporte já vinculado a plano ativo: ${duplicatedPassports.join(", ")}`, "Passaporte já vinculado");
        return;
      }
    }

    setInsurancePlans((currentPlans) =>
      currentPlans.map((patient) =>
        patient.id === editingPatient?.id ? updatedPatient : patient
      )
    );
    setEditingPatient(null);
  }

  function handleRenewPatient(patientToRenew: Patient) {
    if (patientToRenew.status !== "Ativo") {
      void hpsrAlert("Plano encerrado não pode ser renovado. Crie um novo plano usando estes dados.", "Plano encerrado");
      return;
    }

    if (!isWithinRenewalWindow(patientToRenew)) {
      void hpsrAlert("Renovação liberada apenas quando faltarem 7 dias ou menos para o vencimento.", "Renovação indisponível");
      return;
    }

    const remainingDays = differenceInDays(todayIso(), patientToRenew.expiresAt);
    const renewedPatient = {
      ...patientToRenew,
      expiresAt: addDays(todayIso(), 30 + remainingDays),
    } as Patient;

    setInsurancePlans((currentPlans) =>
      currentPlans.map((patient) =>
        patient.id === patientToRenew.id ? renewedPatient : patient
      )
    );
    setEditingPatient((currentPatient) =>
      currentPatient?.id === patientToRenew.id ? renewedPatient : currentPatient
    );
  }

  function handleClosePlan(patientToClose: Patient) {
    const closedPatient = {
      ...patientToClose,
      status: "Encerrado" as const,
      closedAt: todayIso(),
      closeReason: "decisão administrativa",
      blockedDeletion: false,
    };

    setInsurancePlans((currentPlans) =>
      currentPlans.map((patient) =>
        patient.id === patientToClose.id ? closedPatient : patient
      )
    );
    setEditingPatient((currentPatient) =>
      currentPatient?.id === patientToClose.id ? closedPatient : currentPatient
    );
  }

  return (
    <div className="flex h-[min(760px,calc(100dvh-1.5rem))] min-h-0 flex-col overflow-hidden bg-[#fff8f1]">
      <div className="relative mx-4 mt-4 shrink-0 overflow-hidden rounded-[16px] bg-[linear-gradient(135deg,#2a0700_0%,#672614_52%,#a67a5f_100%)] px-4 py-3 text-white sm:mx-5 sm:px-6">
        <div className="pointer-events-none absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute right-12 bottom-[-4.5rem] h-36 w-36 rounded-full bg-white/10" />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] border border-white/20 bg-white/10">
              <Settings size={23} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/80">Planos HPSR</p>
              <h2 className="mt-1 text-[clamp(1.35rem,2vw,1.8rem)] font-bold tracking-tight text-white">
                Gerenciar convênios
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-white/85">
                Diretoria gerencia planos ativos e encerrados. Encerrados saem do banco após 30 dias se não houver bloqueio.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-white/25 bg-white/10 text-white transition hover:bg-white/15"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="mx-4 mt-4 grid shrink-0 gap-3 rounded-[16px] border border-hpsr-border bg-[#f7ecdf]/80 p-3 sm:mx-5 sm:grid-cols-3 sm:p-4">
        <ManageMetric label="Total" value={String(insurancePlans.length)} note="vínculos" />
        <ManageMetric label="Ativos" value={String(activeCount)} note="liberados" tone="green" />
        <ManageMetric label="Encerrados" value={String(closedCount)} note="histórico 30 dias" tone="amber" />
      </div>

      <div className="mx-4 mt-4 grid shrink-0 gap-3 rounded-[16px] border border-hpsr-border bg-[#fcf6ee]/95 p-3 sm:mx-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:p-4">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
          <input
            className={`${inputClass} py-2.5 pl-11`}
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nome, passaporte ou plano"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: "todos", label: "Todos" },
            { id: "ativos", label: "Ativos" },
            { id: "encerrados", label: "Encerrados" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id as "todos" | "ativos" | "encerrados")}
              className={`rounded-2xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                filter === item.id
                  ? "border-hpsr-wine bg-hpsr-wine text-white"
                  : "border-hpsr-border bg-white/78 text-hpsr-wine hover:bg-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {editingPatient && (
        <EditPlanForm
          patient={editingPatient}
          onCancel={() => setEditingPatient(null)}
          onSave={handleSavePatient}
        />
      )}

      <div className="mx-4 mt-4 min-h-0 flex-1 overflow-y-auto rounded-[16px] border border-hpsr-border bg-white/45 p-3 sm:mx-5 sm:p-4">
        {filteredPatients.length > 0 ? (
          <div className="grid gap-3">
            {filteredPatients.map((patient) => (
              <ManagePlanCard
                key={patient.id}
                patient={patient}
                isEditing={editingPatient?.id === patient.id}
                onEdit={() => setEditingPatient(patient)}
                onRenew={() => handleRenewPatient(patient)}
                onClosePlan={() => handleClosePlan(patient)}
                onCreateNew={() => onCreateFromClosedPlan(patient)}
              />
            ))}
          </div>
        ) : (
          <div className="flex min-h-[220px] items-center justify-center rounded-[16px] border border-dashed border-hpsr-border bg-white/62 p-3.5 text-center">
            <div>
              <p className="text-base font-bold text-hpsr-text">Nenhum vínculo encontrado</p>
              <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">Ajuste a busca ou altere o filtro selecionado.</p>
            </div>
          </div>
        )}
      </div>

      <div className="mx-4 mb-4 mt-4 shrink-0 rounded-[16px] border border-hpsr-border bg-[#fcf6ee]/95 p-3 sm:mx-5 sm:p-4">
        <button
          type="button"
          onClick={onClose}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-semibold text-white transition"
        >
          <Check size={16} />
          Finalizar gerenciamento
        </button>
      </div>
    </div>
  );
}

function EditPlanForm({
  patient,
  onCancel,
  onSave,
}: {
  patient: Patient;
  onCancel: () => void;
  onSave: (patient: Patient) => void;
}) {
  const [form, setForm] = useState<Patient>(patient);
  const selectedPlan = plans.find((plan) => plan.name === form.plan) ?? plans[0];
  const dependentLimit = dependentLimits[selectedPlan.id];
  const isClosed = form.status === "Encerrado";
  const canAddDependent = !isClosed && form.dependentsList.length < dependentLimit;

  function updateField<K extends keyof Patient>(field: K, value: Patient[K]) {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
  }

  function syncDependents(dependentsList: DependentDraft[]) {
    setForm((currentForm) => ({
      ...currentForm,
      dependentsList,
      dependents: getDependentsLabel(dependentsList),
    }));
  }

  function handlePlanChange(planName: string) {
    const nextPlan = plans.find((plan) => plan.name === planName) ?? plans[0];
    const nextDependents = form.dependentsList.slice(0, dependentLimits[nextPlan.id]);

    setForm((currentForm) => ({
      ...currentForm,
      plan: planName,
      dependentsList: nextDependents,
      dependents: getDependentsLabel(nextDependents),
    }));
  }

  function handleAddDependent() {
    if (!canAddDependent) return;
    syncDependents([
      ...form.dependentsList,
      { id: Date.now(), name: "", passport: "" },
    ]);
  }

  function handleUpdateDependent(id: number, field: "name" | "passport", value: string) {
    syncDependents(
      form.dependentsList.map((dependent) =>
        dependent.id === id ? { ...dependent, [field]: value } : dependent
      )
    );
  }

  function handleRemoveDependent(id: number) {
    syncDependents(form.dependentsList.filter((dependent) => dependent.id !== id));
  }

  function handleSave() {
    if (!form.name.trim() || !form.passport.trim()) {
      void hpsrAlert("Informe nome e passaporte do titular.", "Dados do titular");
      return;
    }

    if (form.dependentsList.length > dependentLimit) {
      void hpsrAlert(`Este plano permite até ${dependentLimit} dependente${dependentLimit === 1 ? "" : "s"}.`, "Limite de dependentes");
      return;
    }

    const incompleteDependent = form.dependentsList.some(
      (dependent) => !dependent.name.trim() || !dependent.passport.trim()
    );
    if (incompleteDependent) {
      void hpsrAlert("Preencha nome e passaporte de todos os dependentes ou remova os campos vazios.", "Dependentes incompletos");
      return;
    }

    const dependentPassports = form.dependentsList.map((dependent) => dependent.passport.trim());
    if (dependentPassports.includes(form.passport.trim())) {
      void hpsrAlert("O titular não pode ser cadastrado como dependente do próprio plano.", "Vínculo inválido");
      return;
    }

    const duplicatedDependents = dependentPassports.filter(
      (passport, index, list) => passport && list.indexOf(passport) !== index
    );
    if (duplicatedDependents.length > 0) {
      void hpsrAlert("Há dependentes repetidos neste vínculo.", "Dependentes duplicados");
      return;
    }

    onSave({
      ...form,
      name: form.name.trim(),
      passport: form.passport.trim(),
      dependentsList: form.dependentsList.map((dependent) => ({
        ...dependent,
        name: dependent.name.trim(),
        passport: dependent.passport.trim(),
      })),
      dependents: getDependentsLabel(form.dependentsList),
    });
  }

  const helperText =
    dependentLimit === 0
      ? "O Plano Individual não permite dependentes."
      : `Este plano permite até ${dependentLimit} dependente${dependentLimit === 1 ? "" : "s"}.`;

  return (
    <section className="mx-4 mt-4 max-h-[72vh] overflow-y-auto overscroll-contain rounded-[16px] border border-hpsr-border bg-white/[0.86] p-3.5 sm:mx-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">Editar vínculo</p>
          <h3 className="mt-1 text-lg font-bold text-hpsr-text">{patient.name}</h3>
          <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
            Edite os dados do titular, o plano e os dependentes vinculados. Planos encerrados permanecem somente como histórico.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] border border-hpsr-border bg-white text-hpsr-muted transition hover:text-hpsr-wine"
        >
          <X size={17} />
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Nome do titular">
          <input
            className={inputClass}
            disabled={isClosed}
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
          />
        </Field>

        <Field label="Passaporte">
          <input
            className={inputClass}
            disabled={isClosed}
            value={form.passport}
            onChange={(event) => updateField("passport", event.target.value)}
          />
        </Field>

        <Field label="Plano">
          <select
            className={inputClass}
            disabled={isClosed}
            value={form.plan}
            onChange={(event) => handlePlanChange(event.target.value)}
          >
            {plans.map((plan) => (
              <option key={plan.id} value={plan.name}>{plan.name}</option>
            ))}
          </select>
        </Field>

        <Field label="Status">
          <select
            className={inputClass}
            value={form.status}
            onChange={(event) => {
              const status = event.target.value as InsuranceStatus;
              updateField("status", status);
              if (status === "Encerrado") {
                setForm((currentForm) => ({
                  ...currentForm,
                  status,
                  closedAt: todayIso(),
                  closeReason: currentForm.closeReason ?? "decisão administrativa",
                  blockedDeletion: currentForm.blockedDeletion ?? false,
                }));
              }
            }}
          >
            <option>Ativo</option>
            <option>Encerrado</option>
          </select>
        </Field>

        <Field label="Validade">
          <input
            className={inputClass}
            disabled={isClosed}
            type="date"
            value={form.expiresAt}
            onChange={(event) => updateField("expiresAt", event.target.value)}
          />
        </Field>

        <Field label="Dependentes vinculados">
          <div className="flex min-h-[46px] items-center rounded-[16px] border border-hpsr-border bg-[#fcf6ee] px-4 py-3 text-sm font-semibold text-hpsr-text">
            {getDependentsLabel(form.dependentsList)}
          </div>
        </Field>
      </div>

      <div className="mt-4 overflow-hidden rounded-[16px] border border-hpsr-border bg-[#fffaf4]">
        <div className="flex flex-col gap-3 border-b border-hpsr-border bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-hpsr-text">Dependentes</h4>
              <span className="rounded-full border border-hpsr-border bg-[#fcf6ee] px-2.5 py-1 text-xs font-semibold text-hpsr-wine">
                {form.dependentsList.length}/{dependentLimit}
              </span>
            </div>
            <p className="mt-1 text-sm text-hpsr-muted">{helperText}</p>
          </div>

          <button
            type="button"
            onClick={handleAddDependent}
            disabled={!canAddDependent}
            className={`inline-flex items-center justify-center gap-2 rounded-[14px] border px-3.5 py-2.5 text-sm font-semibold transition ${
              canAddDependent
                ? "border-hpsr-border bg-white text-hpsr-text hover:bg-[#fffdfa]"
                : "cursor-not-allowed border-hpsr-border bg-[#f1e4d3]/65 text-hpsr-muted/55"
            }`}
          >
            <UserPlus size={16} />
            Adicionar dependente
          </button>
        </div>

        <div className="grid gap-3 p-3 sm:p-4">
          {form.dependentsList.length === 0 ? (
            <div className="rounded-[14px] border border-dashed border-hpsr-border bg-white px-4 py-5 text-center text-sm text-hpsr-muted">
              Nenhum dependente vinculado a este plano.
            </div>
          ) : (
            form.dependentsList.map((dependent, index) => (
              <div key={dependent.id} className="rounded-[14px] border border-hpsr-border bg-white p-3">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">
                    Dependente {index + 1}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleRemoveDependent(dependent.id)}
                    disabled={isClosed}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-hpsr-border bg-white text-hpsr-wine transition hover:bg-rose-50 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-45"
                    aria-label={`Remover dependente ${index + 1}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <div className="relative">
                    <UserRound size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
                    <input
                      className={`${inputClass} py-2.5 pl-11`}
                      disabled={isClosed}
                      value={dependent.name}
                      onChange={(event) => handleUpdateDependent(dependent.id, "name", event.target.value)}
                      placeholder="Nome do dependente"
                    />
                  </div>
                  <div className="relative">
                    <IdCard size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-hpsr-muted/45" />
                    <input
                      className={`${inputClass} py-2.5 pl-11`}
                      disabled={isClosed}
                      value={dependent.passport}
                      onChange={(event) => handleUpdateDependent(dependent.id, "passport", event.target.value)}
                      placeholder="Passaporte do dependente"
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isClosed && (
        <div className="mt-4 rounded-[14px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Plano encerrado não pode ser editado ou renovado. Ele será removido após 30 dias se não estiver bloqueado para conferência.
        </div>
      )}

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-semibold text-hpsr-text transition hover:bg-[#fffdfa]"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-semibold text-white transition"
        >
          <Check size={16} />
          Salvar alterações
        </button>
      </div>
    </section>
  );
}


function ManageMetric({
  label,
  value,
  note,
  tone = "wine",
}: {
  label: string;
  value: string;
  note: string;
  tone?: "wine" | "green" | "amber";
}) {
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-[#fcf6ee] text-hpsr-wine border-hpsr-border";

  return (
    <article className={`rounded-[16px] border px-4 py-3 ${toneClass}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">{label}</p>
      <p className="mt-1 text-lg font-bold leading-none">{value}</p>
      <p className="mt-1 text-xs font-medium opacity-75">{note}</p>
    </article>
  );
}

function ManagePlanCard({
  patient,
  onEdit,
  onRenew,
  onClosePlan,
  onCreateNew,
  isEditing,
}: {
  patient: Patient;
  onEdit: () => void;
  onRenew: () => void;
  onClosePlan: () => void;
  onCreateNew: () => void;
  isEditing?: boolean;
}) {
  const isActive = patient.status === "Ativo";
  const canRenew = isActive && isWithinRenewalWindow(patient);
  const deletionMessage =
    patient.status === "Encerrado" && patient.closedAt
      ? patient.blockedDeletion
        ? "Exclusão bloqueada para conferência"
        : `Remoção automática em ${Math.max(0, 30 - differenceInDays(patient.closedAt, todayIso()))} dias`
      : null;

  return (
    <article className={`overflow-hidden rounded-[16px] border bg-white/[0.86] transition ${
      isEditing ? "border-hpsr-wine " : "border-hpsr-border"
    }`}>
      <div className="grid gap-3 p-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#8a4b32,#b18a6e)] text-white">
            <ShieldCheck size={19} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate text-sm font-bold text-hpsr-text">{patient.name}</h3>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-zinc-200 bg-zinc-50 text-zinc-700"
                }`}
              >
                {patient.status}
              </span>
              {isEditing && (
                <span className="rounded-full border border-hpsr-border bg-[#fcf6ee] px-2.5 py-1 text-[10px] font-semibold text-hpsr-wine">
                  Em edição
                </span>
              )}
              {canRenew && (
                <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  Vence em breve
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-hpsr-muted">
              Passaporte {patient.passport} · {patient.plan}
            </p>

            <div className="mt-2 grid gap-2 sm:grid-cols-3">
              <ManageInfo label="Validade" value={formatDate(patient.expiresAt)} />
              <ManageInfo label="Dependentes" value={patient.dependents} />
              <ManageInfo label={isActive ? "Renovação" : "Histórico"} value={isActive ? getRenewalMessage(patient) : deletionMessage ?? "Encerrado"} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-2 rounded-[14px] border border-hpsr-border bg-white px-3 py-2.5 text-xs font-semibold text-hpsr-wine transition hover:bg-[#fffdfa]"
          >
            <FilePenLine size={14} />
            {isEditing ? "Editando" : "Editar"}
          </button>

          {isActive ? (
            <>
              <button
                type="button"
                onClick={onRenew}
                disabled={!canRenew}
                className={`inline-flex items-center gap-2 rounded-[14px] border px-3 py-2.5 text-xs font-semibold transition ${
                  canRenew
                    ? "border-hpsr-border bg-[#fcf6ee] text-hpsr-wine hover:bg-white"
                    : "cursor-not-allowed border-hpsr-border bg-zinc-100 text-zinc-500"
                }`}
              >
                <RefreshCw size={14} />
                Renovar
              </button>
              <button
                type="button"
                onClick={onClosePlan}
                className="inline-flex items-center gap-2 rounded-[14px] border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
              >
                <X size={14} />
                Encerrar
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 rounded-[16px] border border-hpsr-border bg-[#fff8f0] px-3 py-2.5 text-xs font-semibold text-hpsr-wine transition hover:bg-white"
            >
              <Plus size={14} />
              Criar novo
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function ManageInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0]/72 px-3 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</p>
      <p className="mt-0.5 truncate text-xs font-semibold text-hpsr-text">{value}</p>
    </div>
  );
}

function PatientPlanDetails({ patient }: { patient: Patient }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <InfoBox label="Paciente" value={patient.name} />
      <InfoBox label="Passaporte" value={patient.passport} />
      <InfoBox label="Plano" value={patient.plan} />
      <InfoBox label="Status" value={patient.status} />
      <InfoBox label="Dependentes" value={patient.dependents} />
      <InfoBox label="Validade" value={formatDate(patient.expiresAt)} />

      <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5 text-sm leading-relaxed text-hpsr-muted sm:col-span-2">
        O desconto padrão do convênio é de 20% sobre atendimentos elegíveis.
      </div>
    </div>
  );
}

function PlanDetails({ plan, onClose }: { plan: Plan; onClose: () => void }) {
  return (
    <div className="grid gap-3">
      <div className="rounded-[16px] border border-hpsr-border bg-[#fff8f0] p-3.5">
        <p className="text-sm font-bold text-hpsr-text">{plan.name}</p>
        <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
          Valor: {plan.price} · benefício padrão de 20% · validade de 30 dias.
        </p>
      </div>

      <ul className="grid gap-2">
        {plan.features.map((feature) => (
          <li key={feature} className="flex items-center gap-3 rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-medium text-hpsr-muted">
            <Check size={16} className="text-hpsr-wine" />
            {feature}
          </li>
        ))}
      </ul>

      <ModalActions onClose={onClose} actionLabel="Usar este plano" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block min-w-0">
      <span className={labelClass}>{label}</span>
      <div className="mt-2">{children}</div>
    </label>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
      <p className={labelClass}>{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-hpsr-text">{value}</p>
    </div>
  );
}

function ModalActions({ onClose, actionLabel }: { onClose: () => void; actionLabel: string }) {
  return (
    <div className="mt-2 flex flex-col-reverse gap-3 border-t border-hpsr-border pt-4 sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onClose}
        className="rounded-[16px] border border-hpsr-border bg-white px-4 py-3 text-sm font-semibold text-hpsr-text transition hover:bg-[#fff4e8]"
      >
        Cancelar
      </button>
      <button
        type="button"
        onClick={onClose}
        className="rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95"
      >
        {actionLabel}
      </button>
    </div>
  );
}
