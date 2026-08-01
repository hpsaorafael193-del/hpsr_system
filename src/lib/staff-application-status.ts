export type StaffApplicationStatusLike = {
  status?: string | null;
  triageDecision?: string | null;
  interviewStatus?: string | null;
  interviewResult?: string | null;
};

function normalize(value: unknown) {
  return String(value || "").trim().toLocaleLowerCase("pt-BR");
}

export function isStaffApplicationPending(item: StaffApplicationStatusLike) {
  const status = normalize(item.status);
  const triageDecision = normalize(item.triageDecision);
  const interviewStatus = normalize(item.interviewStatus);
  const interviewResult = normalize(item.interviewResult);

  if (["aprovado", "recusado"].includes(triageDecision)) return false;
  if (["realizada", "sem resposta"].includes(interviewStatus)) return false;
  if (interviewResult && interviewResult !== "pendente") return false;

  return ![
    "aprovado",
    "recusado",
    "entrevista",
    "contratado",
    "não contratado",
    "nao contratado",
    "sem resposta",
  ].includes(status);
}
