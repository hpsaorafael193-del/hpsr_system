import { brazilDate } from "@/lib/brazil-datetime";

export type ProcedureType =
  | "parto-normal"
  | "cesarea"
  | "parto-humanizado"
  | "fiv"
  | "procedimento-geral";

export type ProcedureProfessional = {
  id: string;
  name: string;
  passport: string;
  role: string;
  specialty: string;
};

export type DoctorOption = ProcedureProfessional;

export type ProcedureFormState = {
  patient: string;
  passport: string;
  procedureType: ProcedureType;
  room: string;
  date: string;
  start: string;
  observations: string;
  professionals: ProcedureProfessional[];
};

export const procedureDurations: Record<ProcedureType, number> = {
  "parto-normal": 4,
  cesarea: 4,
  "parto-humanizado": 4,
  fiv: 1,
  "procedimento-geral": 2,
};

export const procedureOptions: Array<{ value: ProcedureType; label: string }> = [
  { value: "parto-normal", label: "Parto normal" },
  { value: "cesarea", label: "Cesárea" },
  { value: "parto-humanizado", label: "Parto humanizado" },
  { value: "fiv", label: "FIV" },
  { value: "procedimento-geral", label: "Procedimento geral" },
];

export const roomOptions = [
  "Sala Cirúrgica 01",
  "Sala de Procedimentos 02",
  "Centro Obstétrico",
  "Sala de Observação",
];

export function createInitialProcedureForm(): ProcedureFormState {
  return {
    patient: "",
    passport: "",
    procedureType: "procedimento-geral",
    room: "Sala Cirúrgica 01",
    date: brazilDate(),
    start: "18:00",
    observations: "",
    professionals: [],
  };
}

export function getProcedureRule(type: ProcedureType) {
  if (type === "parto-normal" || type === "cesarea" || type === "parto-humanizado") return "4 horas";
  if (type === "fiv") return "1 hora";
  return "2 horas";
}

export function getProcedureLabel(type: ProcedureType) {
  return procedureOptions.find((option) => option.value === type)?.label ?? "Procedimento geral";
}
