"use client";

import { StyledSelect } from "@/components/ui/StyledSelect";
import { useMemo, useState } from "react";
import { Bone, BookOpen, Bookmark, FileText, FlaskConical, Info,
  Leaf, Pill, Search, Sparkles, Stethoscope, Syringe, TriangleAlert, Waves, Zap } from "lucide-react";
import styles from "./PharmaGuideClient.module.css";

type Medication = {
  category: string;
  name: string;
  realName: string;
  use: string;
  allergyAlternative: string;
  information?: string;
  observations?: string;
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
    border: "border-[#cda8c5]",
    iconTint: "bg-[#f3e9f1]",
  },
  {
    title: "Dor / Analgésicos",
    description: "Dor intensa, cefaleia, febre, desconforto muscular e analgesia geral.",
    categories: ["Dor intensa", "Cefaleia", "Muscular", "Analgésico"],
    icon: Zap,
    tint: "bg-[#fff7f5]",
    soft: "bg-[#fffafa]",
    border: "border-[#d8aea4]",
    iconTint: "bg-[#f7ebe8]",
  },
  {
    title: "Estômago / Digestivo",
    description: "Refluxo, gases, má digestão, náusea, cólicas e desconforto gastrointestinal.",
    categories: ["Digestivo", "Náusea", "Cólica"],
    icon: Stethoscope,
    tint: "bg-[#f8f6ef]",
    soft: "bg-[#fcf6ee]",
    border: "border-[#d1bf98]",
    iconTint: "bg-[#f2ede2]",
  },
  {
    title: "Alergia / Respiratório",
    description: "Rinite, urticária, sintomas alérgicos, broncoespasmo e suporte respiratório.",
    categories: ["Alergia", "Respiratório"],
    icon: Waves,
    tint: "bg-[#f3f8f8]",
    soft: "bg-[#f9fdfd]",
    border: "border-[#a8c8c6]",
    iconTint: "bg-[#e8f2f2]",
  },
  {
    title: "Gripe / Sintomas gerais",
    description: "Sintomas gripais, mal-estar, febre, coriza, indisposição e suporte geral.",
    categories: ["Gripal", "Suporte"],
    icon: Pill,
    tint: "bg-[#f5f7fb]",
    soft: "bg-[#fbfcff]",
    border: "border-[#aebfd7]",
    iconTint: "bg-[#eaedf5]",
  },
  {
    title: "Antibióticos",
    description: "Medicamentos para infecções bacterianas conforme avaliação clínica.",
    categories: ["Antibiótico"],
    icon: Syringe,
    tint: "bg-[#f4f8f2]",
    soft: "bg-[#fbfef9]",
    border: "border-[#b2caa9]",
    iconTint: "bg-[#eaf3e7]",
  },
  {
    title: "Anti-inflamatórios",
    description: "Inflamação, dor, edema, quadros musculares, articulares e traumáticos.",
    categories: ["Anti-inflamatório"],
    icon: Bone,
    tint: "bg-[#f8f5f2]",
    soft: "bg-[#fffdfb]",
    border: "border-[#d1b8a6]",
    iconTint: "bg-[#f2ebe5]",
  },
  {
    title: "Vitaminas / Suplementos",
    description: "Reposições minerais, vitaminas e suporte complementar.",
    categories: ["Suplementação"],
    icon: Leaf,
    tint: "bg-[#f8f7ef]",
    soft: "bg-[#fffef9]",
    border: "border-[#c9bf9d]",
    iconTint: "bg-[#f1eee2]",
  },
  {
    title: "Calmantes / Controlados",
    description: "Medicações controladas, ansiedade, agitação, insônia e suporte psiquiátrico.",
    categories: ["Controle"],
    icon: Sparkles,
    tint: "bg-[#f6f4f8]",
    soft: "bg-[#fcfbfe]",
    border: "border-[#b9aed0]",
    iconTint: "bg-[#eee9f3]",
  },
];

const groupOptions = ["Todos", ...categoryGroups.map((group) => group.title)];

function getGroupForCategory(category: string) {
  return categoryGroups.find((group) => group.categories.includes(category));
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


function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

const badgeColors: Record<string, string> = {
  "Hormonal / Endócrino / Fertilidade": "#ebe0f2",
  "Dor / Analgésicos": "#f9ded9",
  "Estômago / Digestivo": "#fae8cf",
  "Alergia / Respiratório": "#dfefed",
  "Gripe / Sintomas gerais": "#e6ebf4",
  "Antibióticos": "#dfeddb",
  "Anti-inflamatórios": "#eee0d7",
  "Vitaminas / Suplementos": "#deebf7",
  "Calmantes / Controlados": "#e9def0",
};

export function PharmaGuideClient() {
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("Todos");
  const [selectedName, setSelectedName] = useState("Analgex");
  const [sort, setSort] = useState("asc");
  const [marked, setMarked] = useState<string[]>([]);
  const [alternativesOpen, setAlternativesOpen] = useState(false);

  const filtered = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);
    return medications.filter((item) => {
      const group = getGroupForCategory(item.category);
      const searchable = [group?.title, item.category, item.name, item.realName,
        item.use, shortUse(item), item.allergyAlternative, item.information, item.observations].join(" ");
      return (selectedGroup === "Todos" || group?.title === selectedGroup)
        && (!normalizedQuery || normalizeSearch(searchable).includes(normalizedQuery));
    }).sort((a, b) => (sort === "desc" ? -1 : 1) * a.name.localeCompare(b.name, "pt-BR"));
  }, [query, selectedGroup, sort]);

  const selectedMedication = filtered.find((item) => item.name === selectedName) || filtered[0] || null;
  function selectMedication(item: Medication) { setSelectedName(item.name); setAlternativesOpen(false); }
  function toggleMark(name: string) {
    setMarked((current) => current.includes(name) ? current.filter((item) => item !== name) : [...current, name]);
  }
  function categoryBadge(item: Medication) {
    const title = getGroupForCategory(item.category)?.title || item.category;
    return <span className={styles.badge} style={{ background: badgeColors[title] || "#eee2d8" }}>{title}</span>;
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <span className={styles.headerIcon}><Pill size={26} /></span>
        <div><h1>Guia farmacêutico</h1><p>Informações para apoiar seus atendimentos.</p></div>
      </header>

      <section className={styles.filters} aria-label="Busca e filtros de medicamentos">
        <label className={styles.search}><Search size={21} aria-hidden="true" />
          <input value={query} onChange={(event) => { setQuery(event.target.value); setAlternativesOpen(false); }}
            aria-label="Buscar medicamento, referência, alergia ou dor" placeholder="Buscar medicamento, alergia, dor..." />
        </label>
        <div className={styles.selectWrap}>
          <StyledSelect value={selectedGroup} onChange={(event) => { setSelectedGroup(event.target.value); setAlternativesOpen(false); }}
            aria-label="Filtrar por grupo" className={styles.select}>
            {groupOptions.map((item) => <option key={item} value={item}>{item}</option>)}
          </StyledSelect>
        </div>
        <div className={styles.counters} aria-live="polite">
          <span>{medications.length} medicamentos</span><span>{filtered.length} filtrados</span><span>{categoryGroups.length} grupos</span>
        </div>
      </section>

      <div className={styles.workspace}>
        <section className={styles.listPanel} aria-label="Medicamentos">
          <header className={styles.listHeader}>
            <h2>Medicamentos <span>{filtered.length} itens</span></h2>
            <label><span className="sr-only">Ordenar medicamentos</span>
              <select aria-label="Ordenar medicamentos" value={sort} onChange={(event) => { setSort(event.target.value); setAlternativesOpen(false); }}>
                <option value="asc">Nome A – Z</option><option value="desc">Nome Z – A</option>
              </select>
            </label>
          </header>
          <div className={styles.list}>
            {filtered.map((item) => <div key={item.name} className={`${styles.row} ${selectedMedication?.name === item.name ? styles.selected : ""}`}>
              <button type="button" className={styles.medicationButton} onClick={() => selectMedication(item)}
                aria-pressed={selectedMedication?.name === item.name} aria-label={`Ver detalhes de ${item.name}`}>
                <span className={styles.pillIcon}><Pill size={23} /></span>
                <span className={styles.medicationName}><strong>{item.name}</strong><span>Referência: {item.realName}</span></span>
                {categoryBadge(item)}
              </button>
              <button type="button" className={styles.bookmark} aria-label={`${marked.includes(item.name) ? "Desmarcar" : "Marcar"} ${item.name}`}
                aria-pressed={marked.includes(item.name)} onClick={() => toggleMark(item.name)}>
                <Bookmark size={21} fill={marked.includes(item.name) ? "currentColor" : "none"} />
              </button>
            </div>)}
            {!filtered.length && <div className={styles.empty}><Search size={28} /><h3>Nenhum medicamento encontrado</h3><p>Tente outro nome, referência ou grupo.</p></div>}
          </div>
        </section>

        <article className={styles.details} aria-label="Detalhes do medicamento">
          {selectedMedication ? <>
            <header className={styles.detailHeader}>
              <p className={styles.eyebrow}><Pill size={22} /> Medicamento do RP</p>
              <div className={styles.detailTitle}>
                <h2>{selectedMedication.name}</h2>
                {categoryBadge(selectedMedication)}
                <button type="button" className={styles.detailBookmark} aria-label={`${marked.includes(selectedMedication.name) ? "Desmarcar" : "Marcar"} ${selectedMedication.name}`}
                  aria-pressed={marked.includes(selectedMedication.name)} onClick={() => toggleMark(selectedMedication.name)}>
                  <Bookmark size={23} fill={marked.includes(selectedMedication.name) ? "currentColor" : "none"} />
                </button>
              </div>
              <p className={styles.reference}>Referência: <span>{selectedMedication.realName}</span></p>
            </header>
            <section className={styles.detailSection}><span className={styles.sectionIcon}><FileText size={30} /></span>
              <div><h3>Para que é utilizado</h3><p>{selectedMedication.use}</p></div>
            </section>
            <section className={styles.detailSection}><span className={styles.sectionIcon}><Info size={30} /></span>
              <div><h3>Informações do medicamento</h3><p>{selectedMedication.information || `Categoria no guia: ${selectedMedication.category}.`}</p></div>
            </section>
            <section className={styles.detailSection}><span className={styles.sectionIcon}><FileText size={30} /></span>
              <div><h3>Cuidados e observações</h3><p>{selectedMedication.observations || "Confira as informações e alternativas cadastradas neste guia."}</p></div>
            </section>
            <section className={styles.allergies}>
              <span className={styles.warningIcon}><TriangleAlert size={34} /></span>
              <div><h3>Alergias e alternativas</h3><p>Consulte as opções registradas para este medicamento.</p></div>
              <button type="button" aria-expanded={alternativesOpen} aria-controls="pharma-alternatives" onClick={() => setAlternativesOpen((value) => !value)}>
                {alternativesOpen ? "Ocultar alternativas" : "Ver alternativas"}
              </button>
            </section>
            {alternativesOpen && <div id="pharma-alternatives" className={styles.alternatives} role="region" aria-label={`Alternativas de ${selectedMedication.name}`}>{selectedMedication.allergyAlternative}</div>}
            <footer className={styles.footer}><BookOpen size={25} /><span>Guia de apoio aos atendimentos no RP.</span></footer>
          </> : <div className={styles.empty}><Pill size={36} /><h3>Selecione um medicamento</h3><p>Os detalhes aparecerão aqui após a busca.</p></div>}
        </article>
      </div>
    </div>
  );
}
