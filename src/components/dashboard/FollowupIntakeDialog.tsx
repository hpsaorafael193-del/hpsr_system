"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ClipboardList, RefreshCcw, X } from "lucide-react";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { FollowupIntakeFormManager } from "./FollowupIntakeFormManager";
import styles from "./followup-intake.module.css";

type Patient = { passport: string; name: string };

export function FollowupIntakeDialog({ patients, passport, onSelect, onClose, doctorId, doctorName, planType }: {
  patients: Patient[];
  passport: string;
  onSelect: (passport: string) => void;
  onClose: () => void;
  doctorId: string;
  doctorName: string;
  planType: "gestacional" | "in_vitro";
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const selectId = useId();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const patient = patients.find(item => item.passport === passport);

  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
  }, []);

  return createPortal(
    <dialog ref={dialog} aria-labelledby={titleId} onClose={onClose} className={styles.dialog}
      onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <span className={styles.icon}><ClipboardList size={22} aria-hidden="true" /></span>
          <div className={styles.headerText}>
            <p className={styles.eyebrow}>Acompanhamento · {planType === "in_vitro" ? "Fertilização" : "Gestação"}</p>
            <h2 id={titleId}>Gerenciar ficha</h2>
            <p>Solicite uma ficha, acompanhe o preenchimento e consulte as respostas.</p>
          </div>
          <button type="button" aria-label="Fechar modal" className={`${styles.button} ${styles.closeIcon}`} onClick={() => dialog.current?.close()}><X size={18} aria-hidden="true" /></button>
        </header>

        <div className={styles.body}>
          <div className={styles.selection}>
            <label htmlFor={selectId} className={styles.eyebrow}>Paciente</label>
            <div className={styles.selectionRow}>
              <StyledSelect id={selectId} value={passport} onChange={event => onSelect(event.target.value)} className={styles.select} searchable>
                <option value="">Selecionar paciente</option>
                {patients.map(item => <option key={item.passport} value={item.passport}>{item.name} · {item.passport}</option>)}
              </StyledSelect>
              <button type="button" className={`${styles.button} ${styles.refresh}`} disabled={!patient}
                onClick={() => setRefreshVersion(version => version + 1)}><RefreshCcw size={16} aria-hidden="true" />Atualizar</button>
            </div>
          </div>
          {patient && doctorId
            ? <FollowupIntakeFormManager key={patient.passport} patientPassport={patient.passport} doctorId={doctorId} doctorName={doctorName} planType={planType} refreshVersion={refreshVersion} />
            : <div className={styles.empty}><ClipboardList size={24} aria-hidden="true" /><strong>Selecione uma paciente</strong><p>A ficha e o histórico de solicitações aparecem aqui.</p></div>}
        </div>

        <footer className={styles.footer}>
          <button type="button" className={styles.button} onClick={() => dialog.current?.close()}>Fechar</button>
        </footer>
      </div>
    </dialog>, document.body,
  );
}
