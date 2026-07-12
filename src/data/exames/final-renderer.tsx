import type { CSSProperties, RefObject } from "react";
import type { AdaptiveResolvedExam } from "./adaptive-engine";

export type RenderAttachmentFile = {
  id: string;
  name: string;
  url: string;
  size: string;
};

export type RenderPatient = {
  name: string;
  passport: string;
  age: string;
  bloodType: string;
};

export type RenderDoctor = {
  name: string;
  crm: string;
};

export type RenderMetadata = {
  examName: string;
  protocol: string;
  date: string;
  time: string;
  patient: RenderPatient;
  doctor: RenderDoctor;
  signatureImage: string | null;
};

export type AutomaticAttachment = {
  id: string;
  title: string;
  subtitle: string;
  legend: string;
  orientation: "portrait" | "landscape";
  scale: "compact" | "normal" | "expanded";
  sections: string[];
  imageUrl?: string;
  notes?: string;
};

export type RenderedExamPage = {
  id: string;
  type: "report" | "auto-attachment" | "manual-attachments";
  label: string;
  reportHtml?: string;
  automaticAttachment?: AutomaticAttachment;
  manualAttachments?: RenderAttachmentFile[];
};

export type RenderedExamDocument = {
  pages: RenderedExamPage[];
  automaticAttachments: AutomaticAttachment[];
  metadata: RenderMetadata;
};

type ClinicalBlock = {
  html: string;
  kind: "heading" | "paragraph" | "list" | "table" | "custom";
  weight: number;
};

const FIRST_PAGE_CAPACITY = 680;
const CONTINUATION_PAGE_CAPACITY = 850;

function textOnly(html: string) {
  return html.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

function lower(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function resolveXrayAttachmentAsset(region: string, profileId: string) {
  const key = lower(region).replace(/[^a-z0-9]+/g, "_");
  const profile = lower(profileId).replace(/[^a-z0-9]+/g, "_");
  const regionFolder = key.includes("torax")
    ? "torax"
    : key.includes("coluna")
      ? "coluna"
      : key.includes("cranio")
        ? "cranio"
        : key.includes("ombro")
          ? "ombro"
          : key.includes("joelho")
            ? "joelho"
            : key.includes("perna") || key.includes("coxa") || key.includes("canela")
              ? "perna_coxa_canela"
              : key.includes("braco") || key.includes("antebraco") || key.includes("cotovelo")
                ? "braco_antebraco"
                : key === "pe" || key.includes("pe_")
                  ? "pe"
                  : "torax";

  const fileByRegion: Record<string, Record<string, string>> = {
    braco_antebraco: { normal: "braco_antebraco_normal.jpg", trauma: "braco_antebraco_trauma.jpg", fratura: "braco_antebraco_fratura_radio_ulna.jpg", luxacao: "braco_antebraco_luxacao_cotovelo_lateral_leve.jpg" },
    coluna: { normal: "coluna_normal_frontal.jpg", trauma: "coluna_trauma_frontal.jpg", fratura: "coluna_fratura_vertebral_frontal.jpg", luxacao: "coluna_luxacao_desalinhamento_frontal.jpg" },
    cranio: { normal: "cranio_normal.jpg", trauma: "cranio_trauma.jpg", fratura: "cranio_fratura_craniana.jpg", luxacao: "cranio_luxacao_temporomandibular_mandibula.jpg" },
    joelho: { normal: "joelho_normal.jpg", trauma: "joelho_trauma.jpg", fratura: "joelho_fratura_plato_tibial.jpg", luxacao: "joelho_luxacao_patelar.jpg" },
    ombro: { normal: "ombro_normal.jpg", trauma: "ombro_trauma.jpg", fratura: "ombro_fratura_umero_proximal.jpg", luxacao: "ombro_luxacao_glenoumeral.jpg" },
    pe: { normal: "pe_normal.jpg", trauma: "pe_trauma.jpg", fratura: "pe_fratura_metatarsos.jpg", luxacao: "pe_luxacao_desalinhamento.jpg" },
    perna_coxa_canela: { normal: "perna_normal.jpg", trauma: "perna_trauma.jpg", fratura: "perna_fratura_femur.jpg" },
    torax: { normal: "torax_normal.jpg", trauma: "torax_trauma.jpg", fratura: "torax_fratura_multiplas_costelas.jpg" },
  };

  const requestedProfile = profile.includes("fratura")
    ? "fratura"
    : profile.includes("luxacao") || profile.includes("sublux")
      ? "luxacao"
      : profile.includes("trauma")
        ? "trauma"
        : "normal";
  const file = fileByRegion[regionFolder]?.[requestedProfile]
    || fileByRegion[regionFolder]?.trauma
    || fileByRegion[regionFolder]?.normal
    || fileByRegion.torax.normal;
  return `/anexos/raio-x/${regionFolder}/${file}`;
}


function normalizeClinicalHtml(value: string) {
  return (value || "")
    .replace(/<!--\s*HPSR_PAGE_BREAK\s*-->/g, "")
    .replace(/<div[^>]*data-hpsr-editor-page-placeholder=["'][^"']*["'][^>]*>[\s\S]*?<\/div>/gi, "")
    .trim();
}

function stripInstitutionalShell(html: string, signatureImage?: string | null) {
  let output = normalizeClinicalHtml(html);

  // O documento único usa a folha institucional como camada fixa.
  // Qualquer cabeçalho/rodapé/assinatura antiga embutida no corpo é descartado.
  output = output
    .replace(/<img[^>]*modelo-documento-hpsr[^>]*>/gi, "")
    .replace(/<img[^>]*assinatura[^>]*>/gi, "")
    .replace(/<svg[\s\S]*?<\/svg>/gi, "")
    .replace(/<[^>]+class=["'][^"']*(absolute|pointer-events-none|hpsr-render-page|hpsr-editor-page)[^"']*["'][^>]*>[\s\S]*?<\/[^>]+>/gi, "")
    .replace(/<p[^>]*>\s*(Hospital S[aã]o Rafael|Identifica[cç][aã]o do Paciente|Data da Emiss[aã]o|Protocolo:|P[aá]gina\s+\d+\s*\/\s*\d+|C[oó]digo interno)[\s\S]*?<\/p>/gi, "")
    .replace(/<div[^>]*data-signature[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<figure[^>]*data-signature[^>]*>[\s\S]*?<\/figure>/gi, "")
    .replace(/<p[^>]*>\s*_{5,}[\s\S]*?(CRM|Dr\.?|Assinatura)[\s\S]*?<\/p>/gi, "")
    .replace(/<p[^>]*>\s*(Dr\s*\(?a\)?\.?|CRM:)[\s\S]*?<\/p>/gi, "");

  if (signatureImage) {
    // Não insere o conteúdo base64 em uma RegExp. Em produção, assinaturas PNG
    // podem conter caracteres que tornam uma expressão dinâmica inválida.
    output = output.replace(
      /<img\b[^>]*\bsrc\s*=\s*(["'])([\s\S]*?)\1[^>]*>/gi,
      (tag, _quote: string, src: string) => src === signatureImage ? "" : tag,
    );
  }

  return output.trim();
}

function blockKind(block: string): ClinicalBlock["kind"] {
  if (/^<h[1-3][\s>]/i.test(block)) return "heading";
  if (/^<table[\s>]/i.test(block)) return "table";
  if (/^<(ul|ol)[\s>]/i.test(block)) return "list";
  if (/^<p[\s>]/i.test(block)) return "paragraph";
  return "custom";
}

function estimateBlockWeight(block: string) {
  const kind = blockKind(block);
  const text = textOnly(block);
  if (!text && !/<br\s*\/?\s*>/i.test(block)) return 12;
  if (kind === "heading") return 36;
  if (kind === "table") {
    const rows = block.match(/<tr[\s>]/gi)?.length || 1;
    const cells = block.match(/<(td|th)[\s>]/gi)?.length || 0;
    const textExtra = Math.ceil(Math.max(0, text.length - rows * 75) / 95) * 12;
    return 34 + rows * 28 + cells * 0.8 + textExtra;
  }
  if (kind === "list") {
    const items = block.match(/<li[\s>]/gi)?.length || 1;
    return 16 + items * 23 + Math.ceil(text.length / 130) * 8;
  }
  return Math.max(24, Math.ceil(Math.max(text.length, 1) / 92) * 20 + 8);
}

function splitLongTable(tableHtml: string) {
  const thead = tableHtml.match(/<thead[\s\S]*?<\/thead>/i)?.[0] || "";
  const tbody = tableHtml.match(/<tbody[\s\S]*?<\/tbody>/i)?.[0] || "";
  const rows = tbody.match(/<tr[\s\S]*?<\/tr>/gi) || [];
  if (!rows.length) return [tableHtml];

  // Tabelas são divididas em blocos menores para aproveitar o espaço restante
  // da página atual. Antes, uma tabela inteira era empurrada para a página
  // seguinte, mesmo quando ainda havia quase meia página disponível.
  const rowsPerChunk = 5;
  if (rows.length <= rowsPerChunk) return [tableHtml];

  const chunks: string[] = [];
  for (let index = 0; index < rows.length; index += rowsPerChunk) {
    chunks.push(`<table>${thead}<tbody>${rows.slice(index, index + rowsPerChunk).join("")}</tbody></table>`);
  }
  return chunks;
}

function splitLongList(listHtml: string) {
  const opening = listHtml.match(/^<(ul|ol)[^>]*>/i)?.[0];
  const tag = listHtml.match(/^<(ul|ol)[\s>]/i)?.[1]?.toLowerCase();
  const items = listHtml.match(/<li[\s\S]*?<\/li>/gi) || [];
  if (!opening || !tag || items.length <= 7) return [listHtml];

  const chunks: string[] = [];
  for (let index = 0; index < items.length; index += 7) {
    const start = tag === "ol" && index > 0 ? ` start="${index + 1}"` : "";
    chunks.push(`<${tag}${start}>${items.slice(index, index + 7).join("")}</${tag}>`);
  }
  return chunks;
}

function parseClinicalBlocks(html: string) {
  const clean = normalizeClinicalHtml(html);
  if (!clean) return [] as ClinicalBlock[];
  const raw = clean.match(/<(h[1-3]|p|table|ul|ol|blockquote|div)[^>]*>[\s\S]*?<\/\1>|<hr[^>]*>/gi) || [clean];
  return raw
    .flatMap((block) => {
      if (/^<table[\s>]/i.test(block)) return splitLongTable(block);
      if (/^<(ul|ol)[\s>]/i.test(block)) return splitLongList(block);
      return [block];
    })
    .filter((block) => textOnly(block) || /<(table|br|hr)[\s>]/i.test(block))
    .map((block) => ({ html: block, kind: blockKind(block), weight: estimateBlockWeight(block) }));
}

function mergeConclusionWithText(blocks: ClinicalBlock[]) {
  const output: ClinicalBlock[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    const isConclusion = block.kind === "heading" && /conclus[aã]o/i.test(textOnly(block.html));
    if (!isConclusion || !blocks[index + 1]) {
      output.push(block);
      continue;
    }
    const next = blocks[index + 1];
    output.push({ html: `${block.html}${next.html}`, kind: "custom", weight: block.weight + next.weight + 16 });
    index += 1;
  }
  return output;
}

export function splitClinicalReportHtmlIntoPages(html: string, signatureImage?: string | null) {
  const body = stripInstitutionalShell(html, signatureImage);
  const blocks = mergeConclusionWithText(parseClinicalBlocks(body));
  if (!blocks.length) return [""];

  const pages: string[][] = [];
  let current: string[] = [];
  let used = 0;
  let capacity = FIRST_PAGE_CAPACITY;

  const commit = () => {
    pages.push(current);
    current = [];
    used = 0;
    capacity = CONTINUATION_PAGE_CAPACITY;
  };

  for (const block of blocks) {
    const oversized = block.weight > capacity;
    if (current.length && !oversized && used + block.weight > capacity) commit();
    current.push(block.html);
    used += block.weight;
  }

  if (current.length || !pages.length) commit();

  // Economia de páginas: se a última página ficou muito pequena e couber na anterior, junta novamente.
  for (let index = pages.length - 1; index > 0; index -= 1) {
    const lastWeight = parseClinicalBlocks(pages[index].join("")).reduce((sum, block) => sum + block.weight, 0);
    const prevWeight = parseClinicalBlocks(pages[index - 1].join("")).reduce((sum, block) => sum + block.weight, 0);
    const prevCapacity = index - 1 === 0 ? FIRST_PAGE_CAPACITY : CONTINUATION_PAGE_CAPACITY;
    if (lastWeight < 120 && prevWeight + lastWeight <= prevCapacity * 1.05) {
      pages[index - 1].push(...pages[index]);
      pages.splice(index, 1);
    }
  }

  return pages.map((page) => page.join(""));
}

function automaticAttachmentFor(resolved?: AdaptiveResolvedExam | null): AutomaticAttachment[] {
  if (!resolved) return [];
  const exam = lower(resolved.model.nome);
  const adapter = lower(resolved.adapterValue || "");
  const context = lower(resolved.clinicalContext || "");
  const full = `${exam} ${adapter} ${context}`;

  if (full.includes("ultrassonografia") || full.includes("ultrassom")) {
    if (full.includes("obst")) return [{ id: "anexo-us-obstetrico", title: "Anexo obstétrico", subtitle: "Medidas biométricas e acompanhamento gestacional", legend: "Anexo sugerido automaticamente conforme o tipo obstétrico selecionado.", orientation: "portrait", scale: "normal", sections: ["Idade gestacional", "Biometria fetal", "Placenta e líquido amniótico", "Batimentos cardíacos fetais"] }];
    if (full.includes("tireoide")) return [{ id: "anexo-us-tireoide", title: "Anexo tireoidiano", subtitle: "Mapa de nódulos e medidas", legend: "Anexo técnico para registro estruturado de tireoide.", orientation: "portrait", scale: "compact", sections: ["Lobo direito", "Lobo esquerdo", "Istmo", "Nódulos / TI-RADS"] }];
    if (full.includes("mama")) return [{ id: "anexo-us-mamas", title: "Anexo mamário", subtitle: "Mapa setorial de mamas", legend: "Anexo técnico para localização e acompanhamento de achados mamários.", orientation: "portrait", scale: "normal", sections: ["Mama direita", "Mama esquerda", "Axilas", "Classificação sugerida"] }];
    return [{ id: "anexo-us-abdominal", title: "Anexo ultrassonográfico", subtitle: "Mapa anatômico e medidas principais", legend: "Anexo técnico compatível com o tipo de ultrassonografia selecionado.", orientation: "portrait", scale: "normal", sections: ["Órgãos avaliados", "Medidas principais", "Achados adicionais", "Observações"] }];
  }

  if (full.includes("raio-x") || full.includes("radiograf")) {
    const region = resolved.adapterValue || "Região examinada";
    const profileId = lower(resolved.profile?.id || "normal");
    const profileName = resolved.profile?.name || "Perfil não definido";
    const regionKey = lower(region);
    const slug = `${lower(region).replace(/\s+/g, "-")}-${profileId}`;

    let sections = ["Incidências", "Alinhamento", "Estruturas ósseas", "Partes moles"];
    let subtitle = `Região: ${region} · Perfil: ${profileName}`;
    let legend = "Anexo radiográfico automático gerado conforme região examinada e perfil de resultado selecionado.";

    if (regionKey.includes("torax") || regionKey.includes("tórax")) {
      sections = ["Projeções PA / perfil", "Campos pulmonares", "Grade costal", "Cardiomediastino"];
    } else if (regionKey.includes("coluna")) {
      sections = ["Alinhamento sagital", "Corpos vertebrais", "Espaços discais", "Elementos posteriores"];
    } else if (regionKey.includes("joelho")) {
      sections = ["Incidências AP / perfil", "Compartimentos articulares", "Patela / fêmoro-patelar", "Partes moles"];
    } else if (regionKey.includes("pé") || regionKey.includes("pe") || regionKey.includes("tornozelo")) {
      sections = ["Incidências", "Arcos / alinhamento", "Ossos do tarso/metatarso", "Partes moles"];
    } else if (regionKey.includes("ombro")) {
      sections = ["Articulação glenoumeral", "Articulação acromioclavicular", "Clavícula / escápula", "Partes moles"];
    } else if (regionKey.includes("punho") || regionKey.includes("mão") || regionKey.includes("mao")) {
      sections = ["Incidências", "Carpo / metacarpos", "Falanges", "Partes moles"];
    }

    if (profileId.includes("fratura")) {
      sections = ["Sítio da fratura", "Traço / fragmentos", "Desvio / angulação", "Partes moles"];
      subtitle = `Fratura · ${region}`;
      legend = "Anexo radiográfico para documentação de fratura, incluindo localização, alinhamento, desvio e repercussão em partes moles.";
    } else if (profileId.includes("trauma")) {
      sections = ["Mecanismo traumático", "Corticais ósseas", "Alinhamento articular", "Edema / partes moles"];
      subtitle = `Trauma · ${region}`;
      legend = "Anexo radiográfico para avaliação pós-trauma, com foco em fratura oculta, alinhamento e alterações de partes moles.";
    } else if (profileId.includes("luxacao")) {
      sections = ["Congruência articular", "Direção do deslocamento", "Fratura associada", "Controle pós-redução"];
      subtitle = `Luxação / subluxação · ${region}`;
      legend = "Anexo radiográfico para documentar perda de congruência articular e possíveis lesões associadas.";
    } else if (profileId.includes("degenerativo")) {
      sections = ["Espaço articular", "Osteófitos", "Esclerose / geodos", "Eixo / alinhamento"];
      subtitle = `Alterações degenerativas · ${region}`;
      legend = "Anexo radiográfico para graduação e localização de alterações degenerativas do segmento avaliado.";
    } else if (profileId.includes("pos_operatorio")) {
      sections = ["Material cirúrgico", "Posicionamento", "Alinhamento", "Sinais de complicação"];
      subtitle = `Controle pós-operatório · ${region}`;
      legend = "Anexo radiográfico para controle de material cirúrgico, alinhamento e sinais de complicação pós-operatória.";
    }

    return [{
      id: `anexo-rx-${slug}`,
      title: `Anexo radiográfico - ${region}`,
      subtitle,
      legend,
      orientation: "landscape",
      scale: "normal",
      sections,
      imageUrl: resolveXrayAttachmentAsset(region, profileId),
    }];
  }

  if (full.includes("tomografia")) {
    const region = resolved.adapterValue || "Região examinada";
    return [{ id: `anexo-tc-${lower(region).replace(/\s+/g, "-")}`, title: `Anexo tomográfico - ${region}`, subtitle: "Série técnica e mapa de cortes", legend: "Anexo compatível com a região e protocolo de tomografia.", orientation: "portrait", scale: "normal", sections: ["Aquisição", "Contraste", "Planos avaliados", "Reconstruções"] }];
  }

  if (full.includes("ressonancia") || full.includes("ressonância")) {
    const region = resolved.adapterValue || "Região examinada";
    return [{ id: `anexo-rm-${lower(region).replace(/\s+/g, "-")}`, title: `Anexo de ressonância - ${region}`, subtitle: "Sequências e planos avaliados", legend: "Anexo compatível com o protocolo de ressonância magnética.", orientation: "portrait", scale: "normal", sections: ["Sequências", "Planos", "Contraste", "Observações técnicas"] }];
  }

  if (full.includes("mamografia")) return [{ id: "anexo-mamografia-birads", title: "Anexo mamográfico", subtitle: "Layout BI-RADS", legend: "Anexo mamográfico automático para classificação e localização dos achados.", orientation: "portrait", scale: "normal", sections: ["Composição mamária", "Achados", "Localização", "Categoria BI-RADS"] }];
  if (full.includes("densitometria")) return [{ id: "anexo-densitometria-oms", title: "Anexo densitométrico", subtitle: "Tabela OMS e gráfico de referência", legend: "Anexo automático para organização de T-score/Z-score e classificação OMS.", orientation: "portrait", scale: "normal", sections: ["Coluna lombar", "Fêmur proximal", "T-score", "Classificação OMS"] }];
  return [];
}

export function createFinalExamDocument(input: {
  metadata: RenderMetadata;
  reportHtml: string;
  manualAttachments: RenderAttachmentFile[];
  resolvedExam?: AdaptiveResolvedExam | null;
  automaticAttachments?: AutomaticAttachment[];
}): RenderedExamDocument {
  const reportPages = splitClinicalReportHtmlIntoPages(input.reportHtml, input.metadata.signatureImage);
  const automaticAttachments = input.automaticAttachments ?? automaticAttachmentFor(input.resolvedExam);
  const manualAttachmentGroups: RenderAttachmentFile[][] = [];
  for (let index = 0; index < input.manualAttachments.length; index += 1) manualAttachmentGroups.push(input.manualAttachments.slice(index, index + 1));

  const pages: RenderedExamPage[] = [
    ...reportPages.map((reportHtml, index) => ({ id: `report-${index + 1}`, type: "report" as const, label: "", reportHtml })),
    ...automaticAttachments.map((attachment) => ({ id: attachment.id, type: "auto-attachment" as const, label: "", automaticAttachment: attachment })),
    ...manualAttachmentGroups.map((group, index) => ({ id: `manual-attachments-${index + 1}`, type: "manual-attachments" as const, label: "", manualAttachments: group })),
  ];

  const labeledPages = (pages.length ? pages : [{ id: "report-1", type: "report" as const, label: "", reportHtml: "" }]).map((page, index, array) => ({ ...page, label: `Página ${index + 1} de ${array.length}` }));
  return { pages: labeledPages, automaticAttachments, metadata: input.metadata };
}

function formatDate(value: string) {
  if (!value) return "-";
  const [year, month, day] = value.split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function ReportHtml({ html }: { html: string }) {
  return (
    <div
      className="hpsr-document-body [&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-[#5b1809]/35 [&_blockquote]:bg-[#fffaf4] [&_blockquote]:px-2 [&_blockquote]:py-1.5 [&_h1]:mb-2 [&_h1]:text-center [&_h1]:text-base [&_h1]:font-black [&_h1]:uppercase [&_h1]:tracking-[0.06em] [&_h1]:text-[#5b1809] [&_h2]:mb-1.5 [&_h2]:mt-3 [&_h2]:break-after-avoid [&_h2]:border-b [&_h2]:border-[#5b1809]/20 [&_h2]:pb-1 [&_h2]:text-sm [&_h2]:font-black [&_h2]:uppercase [&_h2]:tracking-[0.04em] [&_h2]:text-[#5b1809] [&_h3]:mb-1 [&_h3]:mt-2 [&_h3]:break-after-avoid [&_h3]:text-xs [&_h3]:font-black [&_h3]:text-[#5b1809] [&_li]:ml-5 [&_ol]:my-1.5 [&_p]:my-1.5 [&_table]:my-2 [&_table]:w-full [&_table]:break-inside-avoid [&_table]:border-collapse [&_td]:border [&_td]:border-[#5b1809]/20 [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_th]:border [&_th]:border-[#5b1809]/25 [&_th]:bg-[#5b1809]/10 [&_th]:px-2 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-black [&_th]:text-[#5b1809] [&_ul]:my-1.5"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function FullHeader({ metadata }: { metadata: RenderMetadata }) {
  return (
    <>
      <div className="pointer-events-none absolute right-[3.55%] top-[3.5%] text-right text-[12px] text-[#5b1809]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Data da Emissão: {formatDate(metadata.date)}</div>
      <div className="pointer-events-none absolute right-[3.55%] top-[5.28%] text-right text-[11px] text-[#b1adac]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Protocolo: {metadata.protocol || "-"}</div>
      <div className="pointer-events-none absolute left-1/2 top-[10.08%] flex h-[2.05%] w-[32.9%] -translate-x-1/2 items-center justify-center rounded-full border border-[#5b1809] text-center text-[14px] font-black uppercase text-[#5b1809]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>{metadata.examName || "EXAME"}</div>
      <div className="pointer-events-none absolute left-[3.55%] top-[14.1%] h-[8%] w-[92.9%] rounded-[16px] border border-[#5b1809]" />
      <div className="pointer-events-none absolute left-0 top-[15.1%] w-full text-center text-[14px] font-normal uppercase tracking-wide text-[#5b1809]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Identificação do Paciente</div>
      <div className="pointer-events-none absolute left-[5.25%] top-[17.82%] text-[12px] text-[#5b1809]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Nome: {metadata.patient.name || "-"}</div>
      <div className="pointer-events-none absolute left-[45.4%] top-[17.82%] text-[12px] text-[#5b1809]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Passaporte: {metadata.patient.passport || "-"}</div>
      <div className="pointer-events-none absolute left-[79.95%] top-[17.82%] text-[12px] text-[#5b1809]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Tipo Sanguíneo: {metadata.patient.bloodType || "-"}</div>
      <div className="pointer-events-none absolute left-[5.25%] top-[19.98%] text-[12px] text-[#5b1809]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>Idade: {metadata.patient.age || "-"}</div>
    </>
  );
}

function Footer({ metadata, pageIndex, totalPages }: { metadata: RenderMetadata; pageIndex: number; totalPages: number }) {
  return (
    <div className="pointer-events-none absolute bottom-[12px] left-[42px] right-[42px] h-[126px] overflow-hidden border-t border-[#5b1809]/20 bg-[#fffaf4]/95 pt-2 text-[#7a5148]" style={{ fontFamily: "Georgia, 'Times New Roman', serif", zIndex: 4 }}>
      <div className="flex h-[82px] items-end justify-center overflow-hidden">
        <div className="w-[52%] text-center">
          {metadata.signatureImage && <img src={metadata.signatureImage} alt="Assinatura cadastrada" className="mx-auto block object-contain" style={{ width: 280, height: 52, maxWidth: 280, maxHeight: 52 }} />}
          <div className="mx-auto mt-1 h-px w-[82%] border-b border-dotted border-[#5b1809]" />
          <p className="mt-1 text-[11px]"><span className="font-bold text-[#5b1809]">Dr(a).</span> {metadata.doctor.name || "Nome do médico"}</p>
          <p className="text-[9px]"><span className="font-bold text-[#5b1809]">CRM:</span> {metadata.doctor.crm || "000000"}</p>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-[#5b1809]/20 pt-1.5 text-[8.5px]">
        <span>Hospital São Rafael</span>
        <span>Emitido em {formatDate(metadata.date)} · Código interno: {metadata.protocol || "-"}</span>
        <span>Página {pageIndex + 1}/{totalPages}</span>
      </div>
    </div>
  );
}

function AutoAttachmentContent({ attachment }: { attachment: AutomaticAttachment }) {
  return (
    <div
      style={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      {attachment.imageUrl ? (
        <img
          src={attachment.imageUrl}
          alt={attachment.title}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
            borderRadius: 14,
            border: "1px solid rgba(91,24,9,0.20)",
            background: "#050505",
          }}
        />
      ) : (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed rgba(91,24,9,0.35)", borderRadius: 16, color: "#7a5148", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: 13 }}>
          Imagem de anexo não definida.
        </div>
      )}
    </div>
  );
}

function ManualAttachmentsContent({ attachments }: { attachments: RenderAttachmentFile[] }) {
  const file = attachments[0];
  if (!file) return null;
  const isImage = /^data:image\//i.test(file.url) || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
  return (
    <div className="flex h-full items-center justify-center">
      {isImage ? (
        <img src={file.url} alt={file.name} className="block h-full w-full rounded-[14px] border border-[#5b1809]/20 bg-black object-contain" />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-[14px] border border-dashed border-[#5b1809]/30 bg-white/70 text-center text-sm font-semibold text-[#7a5148]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Este anexo não é uma imagem visualizável diretamente nesta página.
        </div>
      )}
    </div>
  );
}

export function RenderedExamPageView({
  page,
  metadata,
  pageIndex,
  totalPages,
  refNode,
}: {
  page: RenderedExamPage;
  metadata: RenderMetadata;
  pageIndex: number;
  totalPages: number;
  refNode?: RefObject<HTMLDivElement>;
}) {
  const isFirstPage = pageIndex === 0;
  const contentStyle: CSSProperties = {
    position: "absolute",
    left: "5.25%",
    top: isFirstPage ? "25.2%" : "9.5%",
    width: "89.5%",
    height: isFirstPage ? "61.8%" : "77.2%",
    overflow: "hidden",
    fontSize: 12,
    lineHeight: 1.42,
    color: "#4b2118",
    fontFamily: "Georgia, 'Times New Roman', serif",
    zIndex: 2,
  };

  return (
    <div ref={refNode} data-page-index={pageIndex} className="hpsr-render-page relative h-[1123px] w-[794px] overflow-hidden bg-white shadow-[0_20px_48px_rgba(42,7,0,0.18)] ring-1 ring-black/5" style={{ position: "relative", width: 794, height: 1123, overflow: "hidden", background: "#fff" }}>
      <img src="/modelo-documento-hpsr.png" alt="Modelo institucional" className="pointer-events-none absolute inset-0 h-full w-full select-none object-fill" draggable={false} style={{ zIndex: 0 }} />
      {isFirstPage && <FullHeader metadata={metadata} />}
      <div className="absolute overflow-hidden" style={contentStyle}>
        {page.type === "report" && <ReportHtml html={page.reportHtml || ""} />}
        {page.type === "auto-attachment" && page.automaticAttachment && <AutoAttachmentContent attachment={page.automaticAttachment} />}
        {page.type === "manual-attachments" && <ManualAttachmentsContent attachments={page.manualAttachments || []} />}
      </div>
      <Footer metadata={metadata} pageIndex={pageIndex} totalPages={totalPages} />
    </div>
  );
}
