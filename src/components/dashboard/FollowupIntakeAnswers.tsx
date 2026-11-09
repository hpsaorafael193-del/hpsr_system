import { formatFollowupBirthType } from "@/lib/followup-birth-options";
import { followupIntakeSections } from "@/lib/followup-intake-questions";
import type { FollowupFormType } from "@/lib/pediatric-intake-form";
import styles from "./followup-intake.module.css";

type Answer = { id: string; label: string; values: string[]; wide: boolean };

function answerValues(value: unknown): string[] {
  return (Array.isArray(value) ? value : [value]).flatMap(item => {
    if (typeof item === "string") return item.trim() ? [item] : [];
    if (typeof item === "number") return [String(item)];
    if (typeof item === "boolean") return [item ? "Sim" : "Não"];
    return [];
  });
}

function fitAnswerRows(answers: Answer[]): Answer[] {
  let startsRow = true;
  return answers.map((answer, index) => {
    const next = answers[index + 1];
    const wide = answer.wide || (startsRow && (!next || next.wide));
    startsRow = wide || !startsRow;
    return { ...answer, wide };
  });
}

export function FollowupIntakeAnswers({ formType, answers }: { formType: FollowupFormType; answers: Record<string, unknown> | null }) {
  const saved = answers ?? {};
  const known = new Set<string>();
  const groups = followupIntakeSections[formType].map(section => ({
    title: section.title,
    answers: section.questions.flatMap(({ key, label, type }): Answer[] => {
      known.add(key);
      const value = saved[key];
      const values = answerValues(key === "birthType" && typeof value === "string" ? formatFollowupBirthType(value) : value);
      return values.length ? [{ id: key, label, values, wide: type === "textarea" || label.length > 95 || values.some(item => item.length > 100 || item.includes("\n")) }] : [];
    }),
  })).filter(section => section.answers.length);
  const additional = Object.entries(saved).filter(([key]) => !known.has(key)).flatMap(([key, value]): Answer[] => {
    const values = answerValues(value);
    return values.length ? [{ id: key, label: "", values, wide: true }] : [];
  }).map((item, index) => ({ ...item, label: `Resposta adicional ${index + 1}` }));
  if (additional.length) groups.push({ title: "Respostas de versões anteriores", answers: additional });

  if (!groups.length) return <p className={styles.hint}>{formType === "pediatric" ? "O responsável ainda não enviou respostas para esta ficha." : "O paciente ainda não enviou respostas para esta ficha."}</p>;

  const count = groups.reduce((total, group) => total + group.answers.length, 0);
  return <div className={styles.responses}>
    <p className={styles.hint}>{count} {count === 1 ? "resposta registrada" : "respostas registradas"}</p>
    {groups.map(group => <section className={styles.answerSection} key={group.title}>
      <h5>{group.title}</h5>
      <dl className={styles.answerList}>
        {fitAnswerRows(group.answers).map(({ id, label, values, wide }) => <div className={styles.answer} data-wide={wide || undefined} key={id}>
          <dt>{label}</dt>
          <dd>{values.length === 1 ? values[0] : <ul className={styles.answerChoices}>{values.map((value, index) => <li key={index}>{value}</li>)}</ul>}</dd>
        </div>)}
      </dl>
    </section>)}
  </div>;
}
