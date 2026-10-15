"use client";
import {useManualRefresh} from "@/lib/manual-data-refresh";

import styles from "./profile.module.css";

import { brazilIso } from "@/lib/brazil-datetime";
import { formatPhoneNumber } from "@/lib/phone";

import { ChangeEvent, useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Building2,
  Circle,
  ClipboardCheck,
  FileImage,
  FileText,
  Hash,
  Mail,
  PenLine,
  Phone,
  Save,
  Stamp,
  Stethoscope,
  Upload,
  UserRound,
  KeyRound,
} from "lucide-react";
import { profileDocuments } from "@/data/current-user-profile";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrAlert } from "@/components/ui/HpsrDialogProvider";
import { ClinicalCapacitySettings } from "@/components/dashboard/ClinicalCapacitySettings";
import { createClient } from "@/lib/supabase";
import { registerSystemActivity, type SystemActivity } from "@/lib/administrative-storage";

type EditableProfile = {
  characterName: string;
  passport: string;
  crm: string;
  cityPhone: string;
  email: string;
  department: string;
  signatureName: string;
};




export default function PerfilPage() {
  const { profile: currentUserProfile, updateProfile: persistProfile, refreshProfile } = useCurrentUserProfile();
  const initialEditableProfile: EditableProfile = {
    characterName: currentUserProfile.characterName,
    passport: currentUserProfile.passport,
    crm: currentUserProfile.crm,
    cityPhone: currentUserProfile.cityPhone,
    email: currentUserProfile.email,
    department: currentUserProfile.department,
    signatureName: currentUserProfile.signatureName,
  };
  const [serviceStatus, setServiceStatus] = useState(currentUserProfile.serviceStatus);
  const statusStorageKey = `hpsr-service-status:${currentUserProfile.passport || currentUserProfile.systemName}`;
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<EditableProfile>(initialEditableProfile);
  const [saveMessage, setSaveMessage] = useState("");
  const [signatureImage, setSignatureImage] = useState<string | null>(null);
  const [activities, setActivities] = useState<SystemActivity[]>([]);
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  useEffect(() => {
    setServiceStatus(currentUserProfile.serviceStatus);

    const profileSignature = currentUserProfile.signatureImage || null;
    if (profileSignature) {
      setSignatureImage(profileSignature);
      return;
    }
    const cacheKey = `hpsr-profile-signature-png:${currentUserProfile.id}`;
    setSignatureImage(localStorage.getItem(cacheKey));
  }, [statusStorageKey, currentUserProfile.id, currentUserProfile.signatureImage]);

  useEffect(() => {
    setProfile({
      characterName: currentUserProfile.characterName,
      passport: currentUserProfile.passport,
      crm: currentUserProfile.crm,
      cityPhone: currentUserProfile.cityPhone,
      email: currentUserProfile.email,
      department: currentUserProfile.department,
      signatureName: currentUserProfile.signatureName,
    });
    setServiceStatus(currentUserProfile.serviceStatus);
  }, [currentUserProfile]);

  useEffect(() => {
    setActivities([]);
    const client = createClient();
    if (!client) return;
    void client.from("system_activities").select("id,module,action,description,actor,reference,created_at").or(`actor.eq.${currentUserProfile.systemName},reference.eq.${currentUserProfile.passport}`).order("created_at", { ascending: false }).limit(100).then(({ data }) => {
      if (!data) return;
      setActivities(data.map((row: any) => ({ id: row.id, module: row.module, action: row.action, description: row.description, actor: row.actor, reference: row.reference, createdAt: row.created_at })));
    });
  }, [currentUserProfile.systemName, currentUserProfile.characterName, currentUserProfile.passport]);


  useManualRefresh("profile",refreshProfile,editing);

  async function changePassword() {
    setPasswordMessage("");
    if (!passwordForm.current || passwordForm.next.length < 6 || passwordForm.next !== passwordForm.confirm) {
      setPasswordMessage("Confira a senha atual. A nova senha deve ter no mínimo 6 caracteres e coincidir com a confirmação.");
      return;
    }
    const client = createClient();
    if (!client) { setPasswordMessage("Supabase não configurado."); return; }
    const { data: sessionData } = await client.auth.getSession();
    const email = sessionData.session?.user.email;
    if (!email) { setPasswordMessage("Sessão não encontrada."); return; }
    const { error: verifyError } = await client.auth.signInWithPassword({ email, password: passwordForm.current });
    if (verifyError) { setPasswordMessage("Senha atual incorreta."); return; }
    const { error } = await client.auth.updateUser({ password: passwordForm.next });
    if (error) { setPasswordMessage(error.message); return; }
    setPasswordForm({ current: "", next: "", confirm: "" });
    setPasswordMessage("Senha alterada com sucesso.");
    registerSystemActivity({ module: "Perfil", action: "Senha alterada", description: "A senha de acesso foi atualizada pelo próprio usuário.", actor: currentUserProfile.systemName, reference: currentUserProfile.passport });
  }

  const isInService = serviceStatus === "Em serviço";

  const profileItems = useMemo(
    () => [
      { label: "Nome profissional", value: profile.characterName, icon: UserRound },
      { label: "Passaporte", value: profile.passport, icon: Hash },
      { label: "Cargo", value: currentUserProfile.role, icon: BadgeCheck },
      { label: "Especialidades", value: currentUserProfile.specialty, icon: Stethoscope },
      { label: "CRM-RP", value: profile.crm, icon: ClipboardCheck },
      { label: "Telefone na cidade", value: profile.cityPhone, icon: Phone },
      { label: "E-mail", value: profile.email, icon: Mail },
      { label: "Departamento", value: profile.department, icon: Building2 },
    ],
    [profile, currentUserProfile.role, currentUserProfile.specialty]
  );

  function updateField(field: keyof EditableProfile, value: string) {
    setProfile((current) => ({ ...current, [field]: value }));
  }

  async function saveProfile() {
    setSaveMessage("Salvando...");
    const result = await persistProfile(profile);
    if (!result.ok) {
      setSaveMessage(`Não foi possível salvar: ${result.error || "erro desconhecido"}`);
      return;
    }
    setEditing(false);
    setSaveMessage("Dados atualizados no sistema.");
  }

  function handleSignatureUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== "image/png") {
      void hpsrAlert("Envie apenas arquivo PNG.", "Arquivo inválido");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const originalImage = String(reader.result);
      const image = await new Promise<string>((resolve) => {
        const source = new Image();
        source.onload = () => {
          const sourceCanvas = document.createElement("canvas");
          sourceCanvas.width = source.naturalWidth || source.width;
          sourceCanvas.height = source.naturalHeight || source.height;
          const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
          if (!sourceContext) { resolve(originalImage); return; }
          sourceContext.drawImage(source, 0, 0);
          const pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
          const data = pixels.data;
          let minX = sourceCanvas.width;
          let minY = sourceCanvas.height;
          let maxX = -1;
          let maxY = -1;
          for (let y = 0; y < sourceCanvas.height; y += 1) {
            for (let x = 0; x < sourceCanvas.width; x += 1) {
              const index = (y * sourceCanvas.width + x) * 4;
              const red = data[index];
              const green = data[index + 1];
              const blue = data[index + 2];
              const alpha = data[index + 3];
              if (alpha === 0) continue;
              if (red > 242 && green > 242 && blue > 242) {
                data[index + 3] = 0;
                continue;
              }
              if (alpha > 20) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
              }
            }
          }
          sourceContext.putImageData(pixels, 0, 0);
          if (maxX < minX || maxY < minY) { resolve(sourceCanvas.toDataURL("image/png")); return; }
          const padding = Math.max(8, Math.round(Math.min(sourceCanvas.width, sourceCanvas.height) * 0.025));
          const cropX = Math.max(0, minX - padding);
          const cropY = Math.max(0, minY - padding);
          const cropWidth = Math.min(sourceCanvas.width - cropX, maxX - minX + 1 + padding * 2);
          const cropHeight = Math.min(sourceCanvas.height - cropY, maxY - minY + 1 + padding * 2);
          const output = document.createElement("canvas");
          output.width = cropWidth;
          output.height = cropHeight;
          const outputContext = output.getContext("2d");
          if (!outputContext) { resolve(originalImage); return; }
          outputContext.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
          resolve(output.toDataURL("image/png"));
        };
        source.onerror = () => resolve(originalImage);
        source.src = originalImage;
      });
      setSignatureImage(image);

      const client = createClient();
      if (!client) {
        localStorage.setItem(`hpsr-profile-signature-png:${currentUserProfile.id}`, image);
        setSaveMessage("Assinatura salva apenas neste navegador.");
        return;
      }

      const { data: sessionData } = await client.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) {
        setSaveMessage("Não foi possível vincular a assinatura ao perfil.");
        return;
      }

      const storagePath = `${userId}/signature.png`;
      const signatureBlob = await fetch(image).then((response) => response.blob());
      const { error: uploadError } = await client.storage
        .from("signatures")
        .upload(storagePath, signatureBlob, { contentType: "image/png", upsert: true });
      if (uploadError) {
        localStorage.setItem(`hpsr-profile-signature-png:${userId}`, image);
        setSaveMessage(`Não foi possível enviar a assinatura ao Supabase: ${uploadError.message}`);
        return;
      }

      const { error } = await client.from("profiles").update({
        signature_path: storagePath,
        updated_at: brazilIso(),
      }).eq("id", userId);
      if (error) {
        localStorage.setItem(`hpsr-profile-signature-png:${userId}`, image);
        setSaveMessage(`Assinatura enviada, mas não vinculada ao perfil: ${error.message}`);
        return;
      }

      localStorage.removeItem("hpsr-profile-signature-png");
      localStorage.removeItem(`hpsr-profile-signature-png:${userId}`);
      await refreshProfile();
      setSaveMessage("Assinatura sincronizada com o perfil no Supabase.");
    };
    reader.readAsDataURL(file);
  }

  async function removeSignatureImage() {
    setSignatureImage(null);
    localStorage.removeItem("hpsr-profile-signature-png");
    localStorage.removeItem(`hpsr-profile-signature-png:${currentUserProfile.id}`);
    const client = createClient();
    if (!client) return;
    const { data: sessionData } = await client.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;
    const signaturePath = currentUserProfile.signaturePath;
    const { error } = await client.from("profiles").update({
      signature_path: null,
      updated_at: brazilIso(),
    }).eq("id", userId);
    if (!error && signaturePath && !signaturePath.startsWith("data:") && !/^https?:\/\//i.test(signaturePath)) {
      await client.storage.from("signatures").remove([signaturePath]);
    }
    if (!error) await refreshProfile();
    setSaveMessage(error ? `Assinatura removida localmente, mas não sincronizada: ${error.message}` : "Assinatura removida do perfil.");
  }

  return (
    <div className={`hpsr-page ${styles.page}`}>
      <div className={styles.topSpace} aria-hidden="true" />
      <section className="hpsr-page-scroll">
        <div className={styles.stack}>
          <header className={`${styles.panel} ${styles.header}`}>
            <div className={styles.identity}>
              <span className={styles.avatar}><UserRound size={36} strokeWidth={1.7} /></span>
              <div className={styles.identityText}>
                <div className={styles.nameRow}>
                  <h1>{profile.characterName}</h1>
                  <span className={`${styles.status} ${isInService ? styles.inService : ""}`}><Circle size={7} fill="currentColor" />{serviceStatus}</span>
                </div>
                <p className={styles.role}>{currentUserProfile.role} · {currentUserProfile.specialty}</p>
                <p className={styles.passport}>Passaporte {profile.passport} · CRM-RP {profile.crm}</p>
              </div>
            </div>
            <div className={styles.headerActions}>
              <span className={styles.clockHint}>Controle de ponto disponível no menu do usuário</span>
              <button type="button" onClick={() => setEditing((value) => !value)} className={styles.secondaryButton}><PenLine size={16} />{editing ? "Fechar edição" : "Editar dados"}</button>
              {editing && <button type="button" onClick={saveProfile} className={styles.primaryButton}><Save size={16} />Salvar</button>}
            </div>
          </header>

          {saveMessage && <p role="status" className={styles.message}>{saveMessage}</p>}

          {editing ? (
            <section aria-label="Editar dados profissionais" className={`${styles.panel} ${styles.editGrid}`}>
              <ProfileInput label="Nome completo" value={profile.characterName} onChange={(value) => updateField("characterName", value)} />
              <ProfileInput label="Passaporte" value={profile.passport} onChange={(value) => updateField("passport", value)} />
              <ProfileInput label="CRM-RP" value={profile.crm} onChange={(value) => updateField("crm", value)} />
              <ProfileInput label="Telefone na cidade" value={profile.cityPhone} onChange={(value) => updateField("cityPhone", formatPhoneNumber(value))} />
              <ProfileInput label="E-mail" value={profile.email} onChange={(value) => updateField("email", value)} />
              <ProfileInput label="Departamento" value={profile.department} onChange={(value) => updateField("department", value)} />
              <ProfileInput label="Nome da assinatura" value={profile.signatureName} onChange={(value) => updateField("signatureName", value)} />
              <div className={styles.readOnlyField}><p className={styles.eyebrow}>Cargo</p><strong>{currentUserProfile.role}</strong><small>Não editável pelo perfil.</small></div>
              <div className={styles.readOnlyField}><p className={styles.eyebrow}>Especialidades</p><strong>{currentUserProfile.specialty}</strong><small>Não editável pelo perfil.</small></div>
            </section>
          ) : (
            <section aria-label="Dados profissionais" className={styles.profileGrid}>
              {profileItems.map((item) => {
                const Icon = item.icon;
                return <article key={item.label} className={styles.infoCard}>
                  <span className={styles.iconCircle}><Icon size={22} strokeWidth={1.9} /></span>
                  <div><p className={styles.eyebrow}>{item.label}</p><p className={styles.infoValue}>{item.value || "Não informado"}</p></div>
                </article>;
              })}
            </section>
          )}

          <ClinicalCapacitySettings />

          <section className={styles.documentsGrid} aria-label="Assinatura e documentos">
            <article id="assinatura" className={`${styles.panel} ${styles.signaturePanel}`}>
              <div className={styles.sectionHeading}>
                <div><p className={styles.eyebrow}>Documentos médicos</p><h2>Assinatura e carimbo</h2></div>
                <span className={styles.iconCircle}><PenLine size={20} /></span>
              </div>
              <div className={styles.signatureGrid}>
                <div className={styles.subPanel}>
                  <p className={styles.eyebrow}>Prévia da assinatura</p>
                  <div className={styles.signaturePreview}>
                    {signatureImage ? <img src={signatureImage} alt="Assinatura enviada" className={styles.signatureImage} /> : <div className={styles.emptySignature}><FileImage size={25} /><span>Envie sua assinatura em PNG</span></div>}
                  </div>
                  <p className={styles.signatureRole}>{currentUserProfile.signatureRole}</p>
                  <p className={styles.muted}>{profile.crm}</p>
                </div>
                <div className={styles.subPanel}>
                  <div className={styles.stampHeading}>
                    <span className={styles.stampIcon}><Stamp size={22} /></span>
                    <div><p className={styles.eyebrow}>Carimbo institucional</p><p className={styles.stampText}>{currentUserProfile.stampText}</p><p className={styles.muted}>{profile.crm}</p></div>
                  </div>
                  <label className={styles.uploadTarget}>
                    <Upload size={21} /><span>Enviar assinatura PNG</span><small>Caneta preta, fundo transparente.</small>
                    <input type="file" accept="image/png" className={styles.fileInput} onChange={handleSignatureUpload} aria-label="Enviar assinatura PNG" />
                  </label>
                  {signatureImage && <button type="button" onClick={() => { void removeSignatureImage(); }} className={`${styles.secondaryButton} ${styles.removeButton}`}>Remover PNG</button>}
                </div>
              </div>
            </article>
            <aside className={styles.panel}>
              <div className={styles.sectionHeading}><div><p className={styles.eyebrow}>Documentos</p><h2>Uso da assinatura</h2></div></div>
              <div className={`${styles.subPanel} ${styles.usagePanel}`}>
                <p className={styles.eyebrow}>Documentos habilitados</p>
                <div className={styles.documentTags}>{profileDocuments.map((document) => <span key={document}>{document}</span>)}</div>
                <div className={styles.medicalIdentity}>
                  <span className={styles.outlineIcon}><FileText size={25} /></span>
                  <div><h3>Identidade médica</h3><p>Os documentos utilizam os dados profissionais deste perfil.</p></div>
                </div>
              </div>
            </aside>
          </section>

          <section className={styles.bottomGrid} aria-label="Segurança e histórico">
            <article className={styles.panel}>
              <div className={styles.sectionHeading}><span className={styles.iconCircle}><KeyRound size={22} /></span><div><p className={styles.eyebrow}>Segurança</p><h2>Alterar senha</h2></div></div>
              <div className={styles.passwordGrid}>
                <ProfileInput label="Senha atual" value={passwordForm.current} type={showPasswords ? "text" : "password"} autoComplete="current-password" onChange={(value) => setPasswordForm((current) => ({ ...current, current: value }))} />
                <div><ProfileInput label="Nova senha" value={passwordForm.next} type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={6} onChange={(value) => setPasswordForm((current) => ({ ...current, next: value }))} /><p className={styles.passwordHint}>Mínimo de 6 caracteres.</p></div>
                <ProfileInput label="Confirmar nova senha" value={passwordForm.confirm} type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={6} onChange={(value) => setPasswordForm((current) => ({ ...current, confirm: value }))} />
              </div>
              <div className={styles.passwordActions}>
                <button type="button" onClick={() => setShowPasswords((v) => !v)} className={styles.secondaryButton}>{showPasswords ? "Ocultar senhas" : "Mostrar senhas"}</button>
                <button type="button" onClick={changePassword} className={styles.primaryButton}>Salvar nova senha</button>
              </div>
              {passwordMessage && <p role="status" className={`${styles.message} ${passwordMessage === "Senha alterada com sucesso." ? styles.success : styles.error}`}>{passwordMessage}</p>}
            </article>
            <article className={styles.panel}>
              <div className={styles.sectionHeading}><span className={styles.iconCircle}><FileText size={22} /></span><div><p className={styles.eyebrow}>Histórico</p><h2>Atividade do perfil</h2></div></div>
              <div className={styles.activityList} tabIndex={0} aria-label="Atividades recentes do perfil">
                {activities.map((item) => <details key={item.id} className={styles.activity}>
                  <summary><FileText size={20} className={styles.activityIcon} /><div><p>{item.action}</p><small>{item.module} · {new Date(item.createdAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}</small></div><span className={styles.detailsButton}>Detalhes</span></summary>
                  <div className={styles.activityDetails}><p>{item.description}</p><dl><div><dt>Responsável</dt><dd>{item.actor || "Não informado"}</dd></div><div><dt>Referência</dt><dd>{item.reference || "Sem referência"}</dd></div></dl></div>
                </details>)}
                {activities.length === 0 && <p className={styles.emptyActivity}>Nenhuma atividade registrada para este médico.</p>}
              </div>
            </article>
          </section>
        </div>
      </section>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
  minLength,
  autoComplete,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  minLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className={styles.field}>
      <span className={styles.eyebrow}>{label}</span>
      <input type={type} minLength={minLength} autoComplete={autoComplete} className={styles.input} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
