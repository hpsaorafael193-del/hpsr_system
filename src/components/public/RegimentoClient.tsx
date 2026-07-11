"use client";

import { useMemo, useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  ChevronsDownUp,
  ChevronsUpDown,
  Search,
  ShieldCheck,
} from "lucide-react";
import { mandatorySummary, regimentoTitles } from "@/data/regimento";

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function RegimentoClient() {
  const [query, setQuery] = useState("");
  const [openTitles, setOpenTitles] = useState<string[]>([]);

  const filteredTitles = useMemo(() => {
    const normalized = normalizeSearch(query.trim());

    if (!normalized) return regimentoTitles;

    return regimentoTitles.filter((item) => {
      const content = [item.title, item.summary, ...item.articles].join(" ");
      return normalizeSearch(content).includes(normalized);
    });
  }, [query]);

  const allFilteredOpen =
    filteredTitles.length > 0 &&
    filteredTitles.every((item) => openTitles.includes(item.title));

  function toggleTitle(title: string) {
    setOpenTitles((current) =>
      current.includes(title)
        ? current.filter((item) => item !== title)
        : [...current, title]
    );
  }

  function toggleAll() {
    if (allFilteredOpen) {
      setOpenTitles((current) =>
        current.filter(
          (title) => !filteredTitles.some((item) => item.title === title),
        ),
      );
      return;
    }

    setOpenTitles((current) =>
      Array.from(new Set([...current, ...filteredTitles.map((item) => item.title)])),
    );
  }

  return (
    <section className="public-pattern min-h-screen px-4 py-10 lg:px-5">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <span className="inline-flex rounded-full border border-hpsr-border bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-hpsr-wineLight">
            Institucional
          </span>
          <h1 className="mt-5 text-[clamp(1.45rem,4vw,2rem)] font-semibold tracking-tight text-hpsr-text lg:text-[clamp(1.7rem,5vw,2.55rem)]">
            Regimento de Normas
          </h1>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-relaxed text-hpsr-muted">
            Consulte os tópicos principais do Hospital São Rafael. Expanda cada seção para ler os artigos completos.
          </p>
        </div>

        <section className="mt-8 rounded-[22px] border border-hpsr-border bg-white/[0.86] p-3.5  lg:p-5">
          <div className="flex items-start gap-3">
            <div className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white sm:flex">
              <ShieldCheck size={20} />
            </div>

            <div className="w-full">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-hpsr-wineLight">
                Resumo obrigatório
              </p>
              <h2 className="mt-1 text-lg font-semibold text-hpsr-text">
                Todo membro deve observar:
              </h2>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {mandatorySummary.map((item) => (
                  <div
                    key={item}
                    className="rounded-2xl border border-hpsr-border bg-[#fcf6ee] px-4 py-3 text-sm leading-relaxed text-hpsr-muted"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6 rounded-[18px] border border-hpsr-border bg-white/[0.86] p-3 ">
          <div className="flex flex-col gap-3 lg:flex-row">
            <label className="flex min-h-[48px] flex-1 items-center gap-3 rounded-[14px] border border-hpsr-border bg-[#fcf6ee] px-4">
              <Search size={18} className="text-hpsr-muted" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por título, resumo ou artigo..."
                className="w-full bg-transparent text-sm text-hpsr-text outline-none placeholder:text-zinc-400"
              />
            </label>

            <button
              type="button"
              onClick={toggleAll}
              className="inline-flex min-h-[48px] items-center justify-center gap-3 rounded-[14px] border border-hpsr-border bg-[#fcf6ee] px-4 text-sm font-semibold text-hpsr-wine transition hover:bg-[#f7f2ea]"
            >
              {allFilteredOpen ? <ChevronsDownUp size={18} /> : <ChevronsUpDown size={18} />}
              {allFilteredOpen ? "Recolher tudo" : "Expandir tudo"}
            </button>
          </div>

          <p className="mt-3 px-1 text-xs text-hpsr-muted">
            {filteredTitles.length} tópico{filteredTitles.length === 1 ? "" : "s"} encontrado{filteredTitles.length === 1 ? "" : "s"}.
          </p>
        </section>

        <section className="mt-6 space-y-3">
          {filteredTitles.map((item) => {
            const isOpen = openTitles.includes(item.title);

            return (
              <article
                key={item.title}
                className="overflow-hidden rounded-[22px] border border-hpsr-border bg-white/[0.88] "
              >
                <button
                  type="button"
                  onClick={() => toggleTitle(item.title)}
                  className="flex w-full items-start justify-between gap-3 bg-white px-4 py-3 text-left transition hover:bg-[#fcf6ee] lg:px-5"
                >
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[14px] bg-[#f7f2ea] text-hpsr-wine">
                      <BookOpenText size={19} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-lg font-semibold leading-tight text-hpsr-text lg:text-xl">
                          {item.title}
                        </h2>

                        <span className="rounded-full border border-hpsr-border bg-[#fcf6ee] px-3 py-1 text-[11px] font-medium text-hpsr-wine">
                          {item.articles.length} artigos
                        </span>
                      </div>

                      <p className="mt-2 max-w-4xl text-sm leading-relaxed text-hpsr-muted">
                        {item.summary}
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    size={21}
                    className={`mt-1 shrink-0 text-hpsr-wine transition ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isOpen && (
                  <div className="border-t border-hpsr-border bg-[#fcf6ee] px-4 py-3 lg:px-5">
                    <div className="border-l-2 border-[#e9e2d7] pl-4 lg:pl-5">
                      <div className="space-y-3">
                        {item.articles.map((article) => {
                          const [firstLine, ...rest] = article.split("\n");
                          return (
                            <section
                              key={article}
                              className="rounded-[20px] border border-hpsr-border bg-white px-4 py-3"
                            >
                              <h3 className="text-sm font-semibold leading-relaxed text-hpsr-text lg:text-base">
                                {firstLine}
                              </h3>

                              {rest.length > 0 && (
                                <div className="mt-3 space-y-2 text-sm leading-relaxed text-hpsr-muted">
                                  {rest.map((line) => (
                                    <p key={line}>{line}</p>
                                  ))}
                                </div>
                              )}
                            </section>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </section>

        {filteredTitles.length === 0 && (
          <div className="mt-6 rounded-[18px] border border-hpsr-border bg-white/[0.86] p-3.5 text-center ">
            <p className="text-lg font-semibold text-hpsr-text">Nenhum tópico encontrado</p>
            <p className="mt-2 text-sm text-hpsr-muted">
              Tente pesquisar outro termo do regimento.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
