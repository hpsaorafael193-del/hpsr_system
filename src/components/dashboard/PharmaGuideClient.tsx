"use client";

import { useMemo, useState } from "react";
import {
  Bone,
  ChevronDown,
  FlaskConical,
  Leaf,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Syringe,
  Waves,
  Zap,
} from "lucide-react";

type Medication = {
  category: string;
  name: string;
  realName: string;
  use: string;
  allergyAlternative: string;
};

const medications: Medication[] = [
  {
    category: "Endócrino",
    name: "GlicoVida",
    realName: "Insulina",
    use: "Controle da glicemia em pacientes diabéticos, hiperglicemia e descompensação metabólica.",
    allergyAlternative: "Não possui substituição simples. Em suspeita de alergia, revisar formulação/protocolo e encaminhar para avaliação médica responsável.",
  },
  {
    category: "Fertilidade",
    name: "OrgaBloq",
    realName: "Orgalutran",
    use: "Bloqueio hormonal em protocolos de fertilidade para evitar ovulação precoce.",
    allergyAlternative: "Avaliar bloqueador hormonal alternativo dentro do protocolo de fertilidade e registrar justificativa no prontuário.",
  },
  {
    category: "Fertilidade",
    name: "FertiPlus",
    realName: "Puregon",
    use: "Estimulação ovariana, maturação folicular e indução reprodutiva.",
    allergyAlternative: "Considerar outro protocolo de estimulação ovariana conforme avaliação do especialista responsável.",
  },
  {
    category: "Gestacional",
    name: "GestaVida",
    realName: "Ogestan",
    use: "Suporte vitamínico e gestacional durante tentativa de gravidez e início da gestação.",
    allergyAlternative: "Alternativa institucional: MaterPlus, desde que o componente relacionado à alergia não esteja presente.",
  },
  {
    category: "Suplementação",
    name: "CalciFort",
    realName: "Caltrate",
    use: "Reposição de cálcio, fragilidade óssea, osteopenia e suplementação mineral.",
    allergyAlternative: "Usar suplementação mineral alternativa sem o componente relacionado à alergia e acompanhar tolerância.",
  },
  {
    category: "Pré-natal",
    name: "MaterPlus",
    realName: "Materna",
    use: "Suplementação pré-natal com vitaminas e minerais.",
    allergyAlternative: "Alternativa institucional: GestaVida, se compatível com o quadro e sem componente alergênico.",
  },
  {
    category: "Dor intensa",
    name: "DorMax",
    realName: "Morfina",
    use: "Analgesia em dor intensa aguda, trauma relevante e pós-operatório.",
    allergyAlternative: "Em alergia a opioide, considerar Analgex, Parador, Inflamol ou Inflamax conforme intensidade e avaliação médica.",
  },
  {
    category: "Cefaleia",
    name: "Cefaliv",
    realName: "Neosaldina",
    use: "Alívio de cefaleia, enxaqueca leve e dor de cabeça por tensão.",
    allergyAlternative: "Alternativas: Parador ou Analgex para dor/cefaleia simples, conforme tolerância do paciente.",
  },
  {
    category: "Muscular",
    name: "Musculiv",
    realName: "Dorflex",
    use: "Dor muscular, contratura, tensão cervical e desconforto osteomuscular.",
    allergyAlternative: "Alternativas: Parador ou Analgex para dor; Inflamol ou Inflamax se houver componente inflamatório.",
  },
  {
    category: "Analgésico",
    name: "Analgex",
    realName: "Dipirona",
    use: "Controle de febre e dor leve a moderada.",
    allergyAlternative: "Alternativas: Parador para febre/dor; Inflamax ou Inflamol se houver dor com componente inflamatório.",
  },
  {
    category: "Analgésico",
    name: "Parador",
    realName: "Paracetamol",
    use: "Febre, cefaleia, mialgia e mal-estar.",
    allergyAlternative: "Alternativas: Analgex para febre/dor; Inflamax ou Inflamol quando houver inflamação associada.",
  },
  {
    category: "Controle",
    name: "Calmivita",
    realName: "Rivotril",
    use: "Ansiedade, crise de agitação, insônia e efeito calmante controlado.",
    allergyAlternative: "Não substituir automaticamente. Encaminhar para avaliação médica/psiquiátrica e registrar conduta de suporte.",
  },
  {
    category: "Alergia",
    name: "Alergicor",
    realName: "Desloratadina",
    use: "Sintomas alérgicos como coriza, espirros, prurido, urticária e rinite.",
    allergyAlternative: "Alternativa: Alergix, se não houver histórico de reação ao mesmo grupo terapêutico.",
  },
  {
    category: "Alergia",
    name: "Alergix",
    realName: "Loratadina",
    use: "Controle de coriza, espirros, prurido, urticária e rinite alérgica.",
    allergyAlternative: "Alternativa: Alergicor, se não houver histórico de reação ao mesmo grupo terapêutico.",
  },
  {
    category: "Respiratório",
    name: "Respimax",
    realName: "Salbutamol",
    use: "Broncodilatação em crise asmática, chiado, falta de ar e broncoespasmo.",
    allergyAlternative: "Não há troca simples no guia. Em alergia ou falha terapêutica, acionar médico responsável e manter suporte respiratório.",
  },
  {
    category: "Gripal",
    name: "Gripex",
    realName: "Benegripe",
    use: "Sintomas gripais, congestão, mal-estar, febre e coriza.",
    allergyAlternative: "Usar tratamento por sintoma: Parador ou Analgex para febre/dor; Alergicor ou Alergix para sintomas alérgicos.",
  },
  {
    category: "Antibiótico",
    name: "Bactrimed",
    realName: "Azitromicina",
    use: "Infecções bacterianas conforme avaliação clínica.",
    allergyAlternative: "Alternativa possível: Bacteron, apenas quando adequado ao quadro e sem alergia relacionada. Exige avaliação médica.",
  },
  {
    category: "Antibiótico",
    name: "Bacteron",
    realName: "Amoxicilina",
    use: "Infecções bacterianas de vias aéreas, garganta e pele.",
    allergyAlternative: "Alternativa possível: Bactrimed, especialmente em alergia a penicilina, conforme avaliação médica.",
  },
  {
    category: "Anti-inflamatório",
    name: "Inflamol",
    realName: "Nimesulida",
    use: "Inflamação, dor e edema em quadros musculares, articulares e traumáticos.",
    allergyAlternative: "Alternativas: Inflamax se tolerado; Parador ou Analgex quando o objetivo principal for controle de dor/febre.",
  },
  {
    category: "Anti-inflamatório",
    name: "Inflamax",
    realName: "Ibuprofeno",
    use: "Controle de inflamação, dor e edema leves a moderados.",
    allergyAlternative: "Alternativas: Inflamol se tolerado; Parador ou Analgex se houver alergia a anti-inflamatórios.",
  },
  {
    category: "Digestivo",
    name: "Gastrix",
    realName: "Omeprazol",
    use: "Refluxo, gastrite, azia e desconforto epigástrico.",
    allergyAlternative: "Sem equivalente direto no guia. Para sintomas associados, avaliar HepaVida ou Gasiliv conforme queixa predominante.",
  },
  {
    category: "Digestivo",
    name: "Gasiliv",
    realName: "Luftal",
    use: "Distensão abdominal, excesso de gases e desconforto intestinal.",
    allergyAlternative: "Alternativa por sintoma: HepaVida se predominar má digestão; CólicaCalm se houver espasmo/cólica.",
  },
  {
    category: "Digestivo",
    name: "HepaVida",
    realName: "Eparema",
    use: "Má digestão, desconforto hepático, estômago pesado e lentidão digestiva.",
    allergyAlternative: "Alternativas por sintoma: Gastrix para azia/refluxo; Gasiliv para gases/distensão.",
  },
  {
    category: "Náusea",
    name: "NáuseaZero",
    realName: "Dramin",
    use: "Náusea, enjoo, tontura labiríntica e desconforto vestibular.",
    allergyAlternative: "Sem equivalente direto no guia. Avaliar causa da náusea; se houver cólica associada, considerar CólicaCalm.",
  },
  {
    category: "Cólica",
    name: "CólicaCalm",
    realName: "Buscopam",
    use: "Cólicas abdominais, espasmos gastrointestinais e dor visceral.",
    allergyAlternative: "Alternativas por sintoma: Analgex ou Parador para dor; NáuseaZero se houver enjoo associado.",
  },
  {
    category: "Suporte",
    name: "Ressak",
    realName: "Engov",
    use: "Mal-estar, dor de cabeça, náusea e indisposição pós-álcool.",
    allergyAlternative: "Tratar por sintoma: Parador ou Analgex para dor; Gastrix para azia; NáuseaZero para enjoo.",
  },
];


const categoryGroups = [
  {
    title: "Hormonal / Endócrino / Fertilidade",
    description: "Controle glicêmico, fertilidade, suporte gestacional e pré-natal.",
    categories: ["Endócrino", "Fertilidade", "Gestacional", "Pré-natal"],
    icon: FlaskConical,
    tint: "bg-[#f8f2f7]",
    soft: "bg-[#fcf8fb]",
    border: "border-[#eadfe8]",
    iconTint: "bg-[#f3e9f1]",
  },
  {
    title: "Dor / Analgésicos",
    description: "Dor intensa, cefaleia, febre, desconforto muscular e analgesia geral.",
    categories: ["Dor intensa", "Cefaleia", "Muscular", "Analgésico"],
    icon: Zap,
    tint: "bg-[#fff7f5]",
    soft: "bg-[#fffafa]",
    border: "border-[#eeded9]",
    iconTint: "bg-[#f7ebe8]",
  },
  {
    title: "Estômago / Digestivo",
    description: "Refluxo, gases, má digestão, náusea, cólicas e desconforto gastrointestinal.",
    categories: ["Digestivo", "Náusea", "Cólica"],
    icon: Stethoscope,
    tint: "bg-[#f8f6ef]",
    soft: "bg-[#fcf6ee]",
    border: "border-[#ece4d6]",
    iconTint: "bg-[#f2ede2]",
  },
  {
    title: "Alergia / Respiratório",
    description: "Rinite, urticária, sintomas alérgicos, broncoespasmo e suporte respiratório.",
    categories: ["Alergia", "Respiratório"],
    icon: Waves,
    tint: "bg-[#f3f8f8]",
    soft: "bg-[#f9fdfd]",
    border: "border-[#dfeaea]",
    iconTint: "bg-[#e8f2f2]",
  },
  {
    title: "Gripe / Sintomas gerais",
    description: "Sintomas gripais, mal-estar, febre, coriza, indisposição e suporte geral.",
    categories: ["Gripal", "Suporte"],
    icon: Pill,
    tint: "bg-[#f5f7fb]",
    soft: "bg-[#fbfcff]",
    border: "border-[#e1e6ef]",
    iconTint: "bg-[#eaedf5]",
  },
  {
    title: "Antibióticos",
    description: "Medicamentos para infecções bacterianas conforme avaliação clínica.",
    categories: ["Antibiótico"],
    icon: Syringe,
    tint: "bg-[#f4f8f2]",
    soft: "bg-[#fbfef9]",
    border: "border-[#dfeada]",
    iconTint: "bg-[#eaf3e7]",
  },
  {
    title: "Anti-inflamatórios",
    description: "Inflamação, dor, edema, quadros musculares, articulares e traumáticos.",
    categories: ["Anti-inflamatório"],
    icon: Bone,
    tint: "bg-[#f8f5f2]",
    soft: "bg-[#fffdfb]",
    border: "border-[#ebe1d8]",
    iconTint: "bg-[#f2ebe5]",
  },
  {
    title: "Vitaminas / Suplementos",
    description: "Reposições minerais, vitaminas e suporte complementar.",
    categories: ["Suplementação"],
    icon: Leaf,
    tint: "bg-[#f8f7ef]",
    soft: "bg-[#fffef9]",
    border: "border-[#e9e5d8]",
    iconTint: "bg-[#f1eee2]",
  },
  {
    title: "Calmantes / Controlados",
    description: "Medicações controladas, ansiedade, agitação, insônia e suporte psiquiátrico.",
    categories: ["Controle"],
    icon: Sparkles,
    tint: "bg-[#f6f4f8]",
    soft: "bg-[#fcfbfe]",
    border: "border-[#e5e0eb]",
    iconTint: "bg-[#eee9f3]",
  },
];

const groupOptions = ["Todos", ...categoryGroups.map((group) => group.title)];

function getGroupForCategory(category: string) {
  return categoryGroups.find((group) => group.categories.includes(category));
}

function getMedicationsForGroup(groupTitle: string, filteredMedications: Medication[]) {
  const group = categoryGroups.find((item) => item.title === groupTitle);
  if (!group) return [];
  return filteredMedications.filter((item) => group.categories.includes(item.category));
}

function shortUse(item: Medication) {
  const replacements: Record<string, string> = {
    "Controle da glicemia em pacientes diabéticos, hiperglicemia e descompensação metabólica.": "Controle de glicose",
    "Bloqueio hormonal em protocolos de fertilidade para evitar ovulação precoce.": "Bloqueador hormonal",
    "Estimulação ovariana, maturação folicular e indução reprodutiva.": "Estímulo de fertilidade",
    "Suporte vitamínico e gestacional durante tentativa de gravidez e início da gestação.": "Suporte gestacional",
    "Reposição de cálcio, fragilidade óssea, osteopenia e suplementação mineral.": "Reposição de cálcio",
    "Suplementação pré-natal com vitaminas e minerais.": "Vitaminas pré-natal",
    "Analgesia em dor intensa aguda, trauma relevante e pós-operatório.": "Dor intensa",
    "Alívio de cefaleia, enxaqueca leve e dor de cabeça por tensão.": "Dor de cabeça",
    "Dor muscular, contratura, tensão cervical e desconforto osteomuscular.": "Dor muscular",
    "Controle de febre e dor leve a moderada.": "Dor leve / febre",
    "Febre, cefaleia, mialgia e mal-estar.": "Dor leve / febre",
    "Ansiedade, crise de agitação, insônia e efeito calmante controlado.": "Ansiedade / insônia",
    "Sintomas alérgicos como coriza, espirros, prurido, urticária e rinite.": "Sintomas alérgicos",
    "Controle de coriza, espirros, prurido, urticária e rinite alérgica.": "Rinite alérgica",
    "Broncodilatação em crise asmática, chiado, falta de ar e broncoespasmo.": "Broncoespasmo",
    "Sintomas gripais, congestão, mal-estar, febre e coriza.": "Sintomas gripais",
    "Infecções bacterianas conforme avaliação clínica.": "Infecção bacteriana",
    "Infecções bacterianas de vias aéreas, garganta e pele.": "Infecção bacteriana",
    "Inflamação, dor e edema em quadros musculares, articulares e traumáticos.": "Inflamação / edema",
    "Controle de inflamação, dor e edema leves a moderados.": "Inflamação leve",
    "Refluxo, gastrite, azia e desconforto epigástrico.": "Refluxo / gastrite",
    "Distensão abdominal, excesso de gases e desconforto intestinal.": "Gases / distensão",
    "Má digestão, desconforto hepático, estômago pesado e lentidão digestiva.": "Má digestão",
    "Náusea, enjoo, tontura labiríntica e desconforto vestibular.": "Náusea / enjoo",
    "Cólicas abdominais, espasmos gastrointestinais e dor visceral.": "Cólicas",
    "Mal-estar, dor de cabeça, náusea e indisposição pós-álcool.": "Mal-estar pós-álcool",
  };

  return replacements[item.use] ?? item.use;
}


function getGroupHeight(title: string) {
  const fixedHeights: Record<string, number> = {
    "Hormonal / Endócrino / Fertilidade": 520,
    "Vitaminas / Suplementos": 430,
    "Dor / Analgésicos": 560,
    "Calmantes / Controlados": 390,
    "Alergia / Respiratório": 430,
    "Gripe / Sintomas gerais": 390,
    "Antibióticos": 390,
    "Anti-inflamatórios": 390,
    "Estômago / Digestivo": 520,
  };

  return fixedHeights[title] ?? 420;
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

export function PharmaGuideClient() {
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>([]);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return medications.filter((item) => {
      const group = getGroupForCategory(item.category);

      const searchableContent = [
        group?.title ?? "",
        item.category,
        item.name,
        item.realName,
        item.use,
        shortUse(item),
      ].join(" ");

      const matchesQuery =
        !normalizedQuery || normalizeSearch(searchableContent).includes(normalizedQuery);

      const matchesGroup =
        selectedGroup === "Todos" || Boolean(normalizedQuery) || group?.title === selectedGroup;

      return matchesGroup && matchesQuery;
    });
  }, [query, selectedGroup]);

  const visibleGroups = categoryGroups
    .map((group) => ({
      ...group,
      medications: getMedicationsForGroup(group.title, filtered),
    }))
    .filter((group) => group.medications.length > 0);


  function toggleGroup(title: string) {
    setOpenGroups((current) =>
      current.includes(title) ? current.filter((item) => item !== title) : [...current, title]
    );
  }

  return (
    <div className="hpsr-page flex h-[calc(100dvh-2.4rem)] min-h-0 flex-col gap-3 overflow-hidden">
      <section className="shrink-0 rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-3">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-hpsr-border bg-white px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wine">
            <Pill size={15} />
            Guia Farmacêutico
          </span>

          <h1 className="mt-2 text-[clamp(1.25rem,2vw,1.75rem)] font-black leading-tight text-hpsr-text">
            Consulta rápida de medicamentos do RP
          </h1>

          <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-hpsr-muted">
            Medicamentos por área de uso, com nome fictício, referência real, indicação resumida e alternativa em caso de alergia.
          </p>
        </div>
      </section>

      <section className="shrink-0 rounded-[16px] border border-hpsr-border bg-white px-4 py-3">
        <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(240px,300px)_auto] xl:items-center">
          <label className="flex min-h-[38px] items-center gap-3 rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 focus-within:border-hpsr-wineLight focus-within:ring-2 focus-within:ring-hpsr-wineLight/20">
            <Search size={17} className="text-hpsr-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar medicamento, alergia, dor..."
              className="w-full bg-transparent text-sm font-semibold text-hpsr-text outline-none placeholder:text-zinc-400"
            />
          </label>

          <div className="relative">
            <select
              value={selectedGroup}
              onChange={(event) => setSelectedGroup(event.target.value)}
              className="min-h-[44px] w-full appearance-none rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 pr-10 text-sm font-semibold text-hpsr-text outline-none focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20"
            >
              {groupOptions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-hpsr-wine" />
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <span className="rounded-full border border-hpsr-border bg-[#fffaf4] px-3 py-1 text-[11px] font-black text-hpsr-wine">
              {medications.length} medicamentos
            </span>
            <span className="rounded-full border border-hpsr-border bg-[#fffaf4] px-3 py-1 text-[11px] font-black text-hpsr-wine">
              {filtered.length} filtrados
            </span>
            <span className="rounded-full border border-hpsr-border bg-[#fffaf4] px-3 py-1 text-[11px] font-black text-hpsr-wine">
              {categoryGroups.length} grupos
            </span>
          </div>
        </div>
      </section>

      <section className="min-h-0 flex-1 overflow-hidden">
        {filtered.length > 0 ? (
          <div className="h-full overflow-y-auto pr-2">
            <div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleGroups.map((group) => {
                const Icon = group.icon;
                const isExpanded = openGroups.includes(group.title);
                const visibleMeds = isExpanded ? group.medications : group.medications.slice(0, 6);

                return (
                  <article
                    key={group.title}
                    className={`flex min-h-[360px] flex-col overflow-hidden rounded-[16px] border ${group.border} bg-white transition hover:bg-[#fffdf9]`}
                  >
                    <header className={`shrink-0 border-b ${group.border} ${group.tint} px-4 py-3`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[16px] ${group.iconTint} text-hpsr-wine`}>
                            <Icon size={18} />
                          </div>
                          <div>
                            <h2 className="text-base font-black leading-tight text-hpsr-text">
                              {group.title}
                            </h2>
                            <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{group.description}</p>
                          </div>
                        </div>

                        <span className="shrink-0 rounded-full border border-hpsr-border bg-white/[0.86] px-3 py-1 text-[11px] font-black text-hpsr-wine">
                          {group.medications.length}
                        </span>
                      </div>
                    </header>

                    <div className="flex-1 p-3">
                      <div className="grid gap-3">
                        {visibleMeds.map((item) => (
                          <button
                            key={`${item.category}-${item.name}`}
                            type="button"
                            onClick={() => setSelectedMedication(item)}
                            className={`w-full rounded-[16px] border ${group.border} ${group.soft} p-3 text-left transition hover:bg-[#fffdf9]`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-hpsr-wineLight">
                                  {item.realName}
                                </p>
                                <h3 className="mt-1 text-sm font-black text-hpsr-text">
                                  {item.name}
                                </h3>
                                <p className="mt-1.5 flex items-start gap-1.5 text-xs leading-relaxed text-hpsr-muted">
                                  <ShieldCheck size={13} className="mt-0.5 shrink-0 text-hpsr-wine" />
                                  {shortUse(item)}
                                </p>
                              </div>

                              <span className="mt-0.5 shrink-0 rounded-full border border-hpsr-border bg-white/75 px-2.5 py-1 text-[10px] font-bold text-hpsr-wine">
                                {item.category}
                              </span>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {group.medications.length > 6 && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.title)}
                        className="mx-3 mb-3 mt-0 flex shrink-0 items-center justify-center gap-2 rounded-[16px] border border-hpsr-border bg-[#fffaf4] px-4 py-2.5 text-xs font-black text-hpsr-wine transition hover:bg-[#fffdf9]"
                      >
                        {isExpanded ? "Mostrar menos" : `Ver todos (${group.medications.length})`}
                        <ChevronDown size={15} className={`transition ${isExpanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5 text-center">
            <p className="text-lg font-black text-hpsr-text">Nenhum medicamento encontrado</p>
            <p className="mt-2 text-sm text-hpsr-muted">
              Tente buscar por outro nome, grupo, categoria ou medicamento real.
            </p>
          </div>
        )}
      </section>

      {selectedMedication && (
        <MedicationDetailsModal
          item={selectedMedication}
          onClose={() => setSelectedMedication(null)}
        />
      )}
    </div>
  );
}

function MedicationDetailsModal({ item, onClose }: { item: Medication; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] grid place-items-center px-4 py-3">
      <button
        type="button"
        aria-label="Fechar detalhes"
        onClick={onClose}
        className="hpsr-modal-backdrop"
      />

      <article className="hpsr-modal-shell max-w-2xl">
        <div className="hpsr-modal-header p-3.5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hpsr-wineLight">{item.category}</p>
          <h2 className="mt-2 text-lg font-semibold text-hpsr-text">{item.name}</h2>
          <p className="mt-1 text-sm font-bold text-hpsr-muted">
            Medicamento real: <span className="text-hpsr-wine">{item.realName}</span>
          </p>
        </div>

        <div className="space-y-4 p-3.5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">Uso indicado</p>
            <p className="mt-2 text-sm leading-relaxed text-hpsr-muted">{item.use}</p>
          </div>

          <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
            <div className="flex items-start gap-3">
              <ShieldCheck size={18} className="mt-0.5 shrink-0 text-hpsr-wine" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-hpsr-wineLight">
                  Alternativa em alergia
                </p>
                <p className="mt-2 text-sm leading-relaxed text-hpsr-muted">{item.allergyAlternative}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-2 w-full rounded-[16px] bg-[linear-gradient(135deg,#672614,#74321e)] px-4 py-3 text-sm font-semibold text-white transition"
          >
            Fechar
          </button>
        </div>
      </article>
    </div>
  );
}


function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5 transition hover:bg-[#fffdf9]">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">{label}</p>
      <p className="mt-1 text-lg font-black text-hpsr-text">{value}</p>
    </div>
  );
}
