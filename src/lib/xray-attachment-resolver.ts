const removeDiacritics = (value: string) =>
  (value || "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toLowerCase();

export type XrayRegionFolder =
  | "torax"
  | "coluna"
  | "cranio"
  | "ombro"
  | "joelho"
  | "perna_coxa_canela"
  | "braco_antebraco"
  | "pe";

export type XrayProfileKey =
  | "normal"
  | "trauma"
  | "fratura"
  | "fratura_com_desvio"
  | "luxacao"
  | "degenerativo"
  | "pos_operatorio";

export const XRAY_ATTACHMENT_MANIFEST: Record<XrayRegionFolder, Record<XrayProfileKey, string>> = {
  torax: {
    normal: "torax_normal.jpg",
    trauma: "torax_trauma.jpg",
    fratura: "torax_fratura.png",
    fratura_com_desvio: "torax_fratura.png",
    luxacao: "torax_luxacao.png",
    degenerativo: "torax_degenerativo.png",
    pos_operatorio: "torax_pos_operatorio.png",
  },
  coluna: {
    normal: "coluna_normal_frontal.jpg",
    trauma: "coluna_trauma_frontal.jpg",
    fratura: "coluna_fratura_vertebral_frontal.jpg",
    fratura_com_desvio: "coluna_fratura_desvio.png",
    luxacao: "coluna_luxacao_desalinhamento_frontal.jpg",
    degenerativo: "coluna_degenerativo.png",
    pos_operatorio: "coluna_pos_operatorio.png",
  },
  cranio: {
    normal: "cranio_normal.jpg",
    trauma: "cranio_trauma.jpg",
    fratura: "cranio_fratura_linear.png",
    fratura_com_desvio: "cranio_fratura_linear.png",
    luxacao: "cranio_luxacao_temporomandibular_mandibula.jpg",
    degenerativo: "cranio_normal.jpg",
    pos_operatorio: "cranio_normal.jpg",
  },
  ombro: {
    normal: "ombro_normal.jpg",
    trauma: "ombro_trauma.jpg",
    fratura: "ombro_fratura_umero_proximal.jpg",
    fratura_com_desvio: "ombro_fratura_desvio.png",
    luxacao: "ombro_luxacao_glenoumeral.jpg",
    degenerativo: "ombro_normal.jpg",
    pos_operatorio: "ombro_normal.jpg",
  },
  joelho: {
    normal: "joelho_normal.jpg",
    trauma: "joelho_trauma.jpg",
    fratura: "joelho_fratura_plato_tibial.jpg",
    fratura_com_desvio: "joelho_fratura_desvio.png",
    luxacao: "joelho_luxacao_patelar.jpg",
    degenerativo: "joelho_normal.jpg",
    pos_operatorio: "joelho_normal.jpg",
  },
  perna_coxa_canela: {
    normal: "perna_normal.jpg",
    trauma: "perna_trauma.jpg",
    fratura: "perna_fratura_tibia_fibula.jpg",
    fratura_com_desvio: "perna_fratura_femur.jpg",
    luxacao: "perna_luxacao.png",
    degenerativo: "perna_normal.jpg",
    pos_operatorio: "perna_pos_operatorio.png",
  },
  braco_antebraco: {
    normal: "braco_antebraco_normal.jpg",
    trauma: "braco_antebraco_trauma.jpg",
    fratura: "braco_antebraco_fratura_radio_ulna.jpg",
    fratura_com_desvio: "braco_antebraco_fratura_desvio.png",
    luxacao: "braco_antebraco_luxacao_cotovelo_lateral_leve.jpg",
    degenerativo: "braco_antebraco_normal.jpg",
    pos_operatorio: "braco_antebraco_normal.jpg",
  },
  pe: {
    normal: "pe_normal.jpg",
    trauma: "pe_trauma.jpg",
    fratura: "pe_fratura_metatarsos.jpg",
    fratura_com_desvio: "pe_fratura_metatarsos.jpg",
    luxacao: "pe_luxacao_desalinhamento.jpg",
    degenerativo: "pe_normal.jpg",
    pos_operatorio: "pe_normal.jpg",
  },
};

export function normalizeXrayKey(value: string) {
  return removeDiacritics(value).replace(/[^a-z0-9]+/g, "_");
}

export function resolveXrayRegionFolder(region: string): XrayRegionFolder {
  const key = normalizeXrayKey(region);
  if (key.includes("torax")) return "torax";
  if (key.includes("coluna")) return "coluna";
  if (key.includes("cranio")) return "cranio";
  if (key.includes("ombro")) return "ombro";
  if (key.includes("joelho")) return "joelho";
  if (key.includes("perna") || key.includes("coxa") || key.includes("canela")) return "perna_coxa_canela";
  if (key.includes("braco") || key.includes("antebraco") || key.includes("cotovelo")) return "braco_antebraco";
  if (key === "pe" || key.includes("pe_") || key.includes("tornozelo")) return "pe";
  return "torax";
}

export function resolveXrayProfileKey(profile: string): XrayProfileKey {
  const key = normalizeXrayKey(profile);
  if (key.includes("fratura") && (key.includes("desvio") || key.includes("desloc"))) return "fratura_com_desvio";
  if (key.includes("pos_operator") || key.includes("posoperator") || key.includes("controle_pos_operatorio")) return "pos_operatorio";
  if (key.includes("degenerativo") || key.includes("artrose") || key.includes("osteoart") || key.includes("espondilose")) return "degenerativo";
  if (key.includes("luxacao") || key.includes("sublux")) return "luxacao";
  if (key.includes("trauma") || key.includes("contus") || key.includes("entorse")) return "trauma";
  if (key.includes("fratura")) return "fratura";
  return "normal";
}

export function resolveXrayAttachmentAsset(region: string, profile: string) {
  const regionFolder = resolveXrayRegionFolder(region);
  const profileKey = resolveXrayProfileKey(profile);
  const file = XRAY_ATTACHMENT_MANIFEST[regionFolder][profileKey];
  return `/anexos/raio-x/${regionFolder}/${file}`;
}
