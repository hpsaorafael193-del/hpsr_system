export function monitoringBaselineFocus(variables: Record<string, string | boolean>): "follicles" | "endometrium" | null {
  const focus = String(variables.foco_monitorizacao ?? variables.papel_no_protocolo ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const mode = /folicul|doadora/.test(focus) ? "follicles" : /endometr|receptora|gestante/.test(focus) ? "endometrium" : null;
  if (!mode) return null;
  const clinicalFields = mode === "follicles"
    ? ["ovario_direito", "ovario_esquerdo", "foliculos_od", "foliculos_oe", "foliculo_dominante", "sinais_ovulacao"]
    : ["endometrio", "espessura_endometrial"];
  if (clinicalFields.some(id => variables[id] !== undefined && String(variables[id]).trim() !== "")) return null;
  const raw = String(variables[mode === "follicles" ? "dia_estimulacao" : "dia_preparo_endometrial"] ?? "").trim();
  // Missing day is unknown, never day zero; a hidden field from the other focus
  // must not alter the selected examination.
  return /^0+(?:[.,]0+)?$/.test(raw) ? mode : null;
}

/** Simulated normal baseline template only. This is not a treatment/growth rule. */
export function normalBaselineMonitoringResult(focus: "follicles" | "endometrium", parameterId: string, seed: number): string | undefined {
  const step = Math.abs(Math.trunc(seed || 0)) % 3;
  const results: Record<string, string> = focus === "follicles" ? {
    ovario_direito: "Folículos antrais no ovário direito, sem dominância folicular nesta avaliação basal",
    foliculos_od: `${4 + step} mm, ${5 + step} mm e ${6 + step} mm`,
    ovario_esquerdo: "Folículos antrais no ovário esquerdo, sem dominância folicular nesta avaliação basal",
    foliculos_oe: `${3 + step} mm, ${4 + step} mm e ${6 + step} mm`,
    foliculo_dominante: "Não identificado nesta avaliação basal",
    sinais_ovulacao: "Sem sinais ultrassonográficos de ovulação recente nesta avaliação",
    liquido_fundo_saco: "Ausente",
    impressao: "Aspecto ovariano basal, antes do início da estimulação, sem dominância folicular",
  } : {
    endometrio: "Padrão homogêneo na avaliação basal, antes do preparo endometrial",
    espessura_endometrial: (3.8 + step * .3).toFixed(1).replace(".", ","),
    liquido_fundo_saco: "Ausente",
    impressao: "Aspecto endometrial basal, antes do início do preparo; sem avaliação de resposta ao tratamento",
  };
  return results[parameterId];
}
