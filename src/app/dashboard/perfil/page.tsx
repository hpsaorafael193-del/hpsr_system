"use client";

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
import { createClient } from "@/lib/supabase";
import { readSystemActivities, registerSystemActivity, type SystemActivity } from "@/lib/administrative-storage";

type EditableProfile = {
  characterName: string;
  passport: string;
  crm: string;
  cityPhone: string;
  email: string;
  department: string;
  signatureName: string;
};



const inputClass =
  "min-h-[38px] w-full rounded-[14px] border border-hpsr-border bg-white/[0.92] px-3 text-sm font-bold text-hpsr-text outline-none transition placeholder:text-zinc-400 focus:border-hpsr-wineLight focus:ring-2 focus:ring-hpsr-wineLight/20";

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
    const storedStatus = localStorage.getItem(statusStorageKey);
    if (storedStatus) setServiceStatus(storedStatus);

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
    const local = readSystemActivities().filter((item) =>
      item.actor === currentUserProfile.systemName ||
      item.actor === currentUserProfile.characterName ||
      item.reference === currentUserProfile.passport
    );
    setActivities(local);
    const client = createClient();
    if (!client) return;
    void client.from("system_activities").select("id,module,action,description,actor,reference,created_at").or(`actor.eq.${currentUserProfile.systemName},reference.eq.${currentUserProfile.passport}`).order("created_at", { ascending: false }).limit(100).then(({ data }) => {
      if (!data) return;
      setActivities(data.map((row: any) => ({ id: row.id, module: row.module, action: row.action, description: row.description, actor: row.actor, reference: row.reference, createdAt: row.created_at })));
    });
  }, [currentUserProfile.systemName, currentUserProfile.characterName, currentUserProfile.passport]);

  async function toggleServiceStatus() {
    const next = serviceStatus === "Em serviço" ? "Fora de serviço" : "Em serviço";
    const result = await persistProfile({ serviceStatus: next });
    if (!result.ok) { setSaveMessage(result.error || "Não foi possível alterar o status."); return; }
    setServiceStatus(next);
    localStorage.setItem(statusStorageKey, next);
    registerSystemActivity({ module: "Perfil", action: "Status alterado", description: `Status alterado para ${next}.`, actor: currentUserProfile.systemName, reference: currentUserProfile.passport });
    setSaveMessage(`Status alterado para ${next}.`);
  }

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
      { label: "Nome do personagem", value: profile.characterName, icon: UserRound },
      { label: "Passaporte", value: profile.passport, icon: Hash },
      { label: "Cargo", value: currentUserProfile.role, icon: BadgeCheck },
      { label: "Especialidade", value: currentUserProfile.specialty, icon: Stethoscope },
      { label: "CRM-RP", value: profile.crm, icon: ClipboardCheck },
      { label: "Telefone na cidade", value: profile.cityPhone, icon: Phone },
      { label: "E-mail", value: profile.email, icon: Mail },
      { label: "Departamento", value: profile.department, icon: Building2 },
    ],
    [profile]
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
    localStorage.setItem("hpsr-profile-edits", JSON.stringify(profile));
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
        updated_at: new Date().toISOString(),
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
      updated_at: new Date().toISOString(),
    }).eq("id", userId);
    if (!error && signaturePath && !signaturePath.startsWith("data:") && !/^https?:\/\//i.test(signaturePath)) {
      await client.storage.from("signatures").remove([signaturePath]);
    }
    if (!error) await refreshProfile();
    setSaveMessage(error ? `Assinatura removida localmente, mas não sincronizada: ${error.message}` : "Assinatura removida do perfil.");
  }

  return (
    <div className="hpsr-page max-w-[1500px] gap-3">
      <div className="hpsr-topbar" />

      <section className="hpsr-page-scroll overflow-y-auto pr-2">
        <div className="space-y-4">
          <section className="overflow-hidden rounded-[18px] border border-hpsr-border bg-white/[0.86]">
            <div className="bg-[linear-gradient(135deg,#672614,#2a0700)] px-4 py-3 text-white">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[16px] border border-white/15 bg-white/10 text-white">
                    <UserRound size={30} />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="break-words text-lg font-black leading-tight">{profile.characterName}</h1>
                      <span
                        className={
                          isInService
                            ? "inline-flex items-center gap-1 rounded-full border border-emerald-200/30 bg-emerald-400/15 px-3 py-1 text-xs font-bold text-emerald-50"
                            : "inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-orange-50/80"
                        }
                      >
                        <Circle
                          size={7}
                          className={isInService ? "fill-emerald-200 text-emerald-200" : "fill-orange-50/60 text-orange-50/60"}
                        />
                        {serviceStatus}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-semibold text-orange-50/85">
                      {currentUserProfile.role} · {currentUserProfile.specialty}
                    </p>
                    <p className="mt-1 text-xs text-orange-50/70">
                      Passaporte {profile.passport} · {profile.crm}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={toggleServiceStatus} className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/20 bg-white px-4 py-2.5 text-sm font-black text-hpsr-wine transition hover:bg-[#fff8f0]">
                    <Circle size={10} className={isInService ? "fill-orange-500 text-orange-500" : "fill-emerald-600 text-emerald-600"} />
                    {isInService ? "Ficar fora de serviço" : "Entrar em serviço"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing((value) => !value)}
                    className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/15"
                  >
                    <PenLine size={16} />
                    {editing ? "Fechar edição" : "Editar dados"}
                  </button>
                  {editing && (
                    <button
                      type="button"
                      onClick={saveProfile}
                      className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-white px-4 py-2.5 text-sm font-black text-hpsr-wine transition hover:bg-[#fff8f0]"
                    >
                      <Save size={16} />
                      Salvar
                    </button>
                  )}
                </div>
              </div>
            </div>

            {saveMessage && <p className="mx-3.5 mt-3 rounded-[14px] border border-hpsr-border bg-[#fffaf4] px-3 py-2 text-xs font-bold text-hpsr-text">{saveMessage}</p>}

            {editing ? (
              <div className="grid gap-3 p-3.5 md:grid-cols-2 xl:grid-cols-3">
                <ProfileInput label="Nome completo" value={profile.characterName} onChange={(value) => updateField("characterName", value)} />
                <ProfileInput label="Passaporte" value={profile.passport} onChange={(value) => updateField("passport", value)} />
                <ProfileInput label="CRM-RP" value={profile.crm} onChange={(value) => updateField("crm", value)} />
                <ProfileInput label="Telefone na cidade" value={profile.cityPhone} onChange={(value) => updateField("cityPhone", value)} />
                <ProfileInput label="E-mail" value={profile.email} onChange={(value) => updateField("email", value)} />
                <ProfileInput label="Departamento" value={profile.department} onChange={(value) => updateField("department", value)} />
                <ProfileInput label="Nome da assinatura" value={profile.signatureName} onChange={(value) => updateField("signatureName", value)} />

                <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Cargo</p>
                  <p className="mt-2 text-sm font-black text-hpsr-text">{currentUserProfile.role}</p>
                  <p className="mt-1 text-xs font-semibold text-hpsr-muted">Não editável pelo perfil.</p>
                </div>

                <div className="rounded-[16px] border border-hpsr-border bg-[#fffaf4] p-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">Especialidade</p>
                  <p className="mt-2 text-sm font-black text-hpsr-text">{currentUserProfile.specialty}</p>
                  <p className="mt-1 text-xs font-semibold text-hpsr-muted">Não editável pelo perfil.</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-3 p-3.5 sm:grid-cols-2 xl:grid-cols-4">
                {profileItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-[16px] border border-hpsr-border bg-[#fcf6ee] p-3">
                      <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[14px] bg-white text-hpsr-wine">
                        <Icon size={17} />
                      </div>
                      <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-muted">{item.label}</p>
                      <p className="mt-1 break-words text-sm font-black text-hpsr-text">{item.value}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(280px,380px)]">
            <article className="rounded-[24px] border border-hpsr-border bg-white/[0.86] p-3.5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Documentos médicos</p>
                  <h2 className="mt-1 text-lg font-black text-hpsr-text">Assinatura e carimbo</h2>
                </div>
                <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#f7f2ea] text-hpsr-wine">
                  <PenLine size={18} />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
                <div className="rounded-[16px] border border-dashed border-hpsr-wine/30 bg-[#fcf6ee] p-3.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-muted">Prévia da assinatura</p>

                  <div className="mt-5 flex min-h-[120px] items-center justify-center rounded-[16px] border border-hpsr-border bg-white p-3.5">
                    {signatureImage ? (
                      <img
                        src={signatureImage}
                        alt="Assinatura enviada"
                        className="max-h-24 max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-full max-w-md border-b border-hpsr-text/50 pb-3">
                        <p className="break-words font-serif text-4xl italic leading-tight text-hpsr-text">{profile.signatureName}</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    <p className="font-black text-hpsr-text">{currentUserProfile.signatureRole}</p>
                    <p className="text-sm font-semibold text-hpsr-muted">{profile.crm}</p>
                  </div>
                </div>

                <div className="rounded-[16px] border border-hpsr-border bg-white p-3.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,#672614,#2a0700)] text-white">
                    <Stamp size={20} />
                  </div>
                  <p className="mt-4 text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-muted">Carimbo institucional</p>
                  <p className="mt-2 text-sm font-black leading-relaxed text-hpsr-text">{currentUserProfile.stampText}</p>
                  <p className="mt-1 text-sm font-semibold text-hpsr-muted">{profile.crm}</p>

                  <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-[16px] border border-dashed border-hpsr-wine/30 bg-[#fcf6ee] px-4 py-3 text-center transition hover:bg-[#fff8f0]">
                    <Upload size={20} className="text-hpsr-wine" />
                    <span className="text-sm font-black text-hpsr-text">Enviar assinatura PNG</span>
                    <span className="text-xs font-semibold leading-relaxed text-hpsr-muted">
                      Caneta preta, fundo transparente.
                    </span>
                    <input type="file" accept="image/png" className="hidden" onChange={handleSignatureUpload} />
                  </label>

                  {signatureImage && (
                    <button
                      type="button"
                      onClick={() => { void removeSignatureImage(); }}
                      className="mt-3 w-full rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine transition hover:bg-[#fff8f0]"
                    >
                      Remover PNG
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-[16px] border border-blue-200 bg-blue-50 p-3">
                <div className="flex gap-2">
                  <FileImage size={17} className="mt-0.5 shrink-0 text-blue-700" />
                  <p className="text-xs font-bold leading-relaxed text-blue-900">
                    Para melhor resultado, envie uma assinatura em PNG, feita em caneta preta e com fundo transparente.
                  </p>
                </div>
              </div>
            </article>

            <aside className="rounded-[24px] border border-hpsr-border bg-[#f9f0df] p-3.5">
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Documentos</p>
              <h2 className="mt-1 text-lg font-black text-hpsr-text">Uso da assinatura</h2>

              <div className="mt-4 rounded-[16px] border border-hpsr-border bg-white/70 p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-muted">Documentos habilitados</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profileDocuments.map((document) => (
                    <span key={document} className="rounded-full bg-[#fcf6ee] px-3 py-1.5 text-xs font-bold text-hpsr-wine">
                      {document}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4 rounded-[16px] border border-hpsr-border bg-[#fcf6ee] p-3">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-[14px] bg-white text-hpsr-wine">
                  <FileText size={17} />
                </div>
                <p className="text-sm font-black text-hpsr-text">Identidade médica</p>
                <p className="mt-1 text-sm leading-relaxed text-hpsr-muted">
                  Os documentos usam nome profissional, cargo, CRM-RP e carimbo institucional definidos neste perfil.
                </p>
              </div>
            </aside>
          </section>

          <section className="rounded-[24px] border border-hpsr-border bg-white/[0.86] p-3.5">
            <div className="flex items-center gap-3"><div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#f7f2ea] text-hpsr-wine"><KeyRound size={18} /></div><div><p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Segurança</p><h2 className="text-xl font-black text-hpsr-text">Alterar senha</h2></div></div>
            <div className="mt-4 rounded-[14px] border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-black text-amber-900 shadow-sm">
              A nova senha deve ter no mínimo 6 caracteres.
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <ProfileInput label="Senha atual" value={passwordForm.current} type={showPasswords ? "text" : "password"} onChange={(value) => setPasswordForm((current) => ({ ...current, current: value }))} />
              <ProfileInput label="Nova senha" value={passwordForm.next} type={showPasswords ? "text" : "password"} minLength={6} onChange={(value) => setPasswordForm((current) => ({ ...current, next: value }))} />
              <ProfileInput label="Confirmar nova senha" value={passwordForm.confirm} type={showPasswords ? "text" : "password"} minLength={6} onChange={(value) => setPasswordForm((current) => ({ ...current, confirm: value }))} />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3"><button type="button" onClick={() => setShowPasswords((v) => !v)} className="rounded-[14px] border border-hpsr-border bg-white px-3 py-2 text-xs font-black text-hpsr-wine">{showPasswords ? "Ocultar senhas" : "Mostrar senhas"}</button><button type="button" onClick={changePassword} className="rounded-[14px] bg-hpsr-wine px-4 py-2 text-xs font-black text-white">Salvar nova senha</button>{passwordMessage && <span className={`rounded-[12px] border px-3 py-2 text-xs font-black ${passwordMessage === "Senha alterada com sucesso." ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-red-300 bg-red-50 text-red-800"}`}>{passwordMessage}</span>}</div>
          </section>

          <section className="rounded-[24px] border border-hpsr-border bg-white/[0.86] p-3.5">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#f7f2ea] text-hpsr-wine">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Histórico</p>
                <h2 className="text-xl font-black text-hpsr-text">Atividade do perfil</h2>
              </div>
            </div>

            <div className="mt-4 max-h-[420px] overflow-y-auto pr-2 [scrollbar-color:#7a2f1b_#f3e8dc] [scrollbar-width:thin]">
              <div className="space-y-2">
                {activities.map((item) => (
                  <details key={item.id} className="group overflow-hidden rounded-[14px] border border-hpsr-border bg-[#fcf6ee] open:bg-white">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-3 py-2.5 marker:hidden">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-hpsr-text">{item.action}</p>
                        <p className="mt-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">
                          {item.module} · {new Date(item.createdAt).toLocaleString("pt-BR")}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full border border-hpsr-border bg-white px-2.5 py-1 text-[10px] font-black text-hpsr-wine transition group-open:bg-hpsr-wine group-open:text-white">
                        Detalhes
                      </span>
                    </summary>

                    <div className="border-t border-hpsr-border bg-white px-3 py-3">
                      <p className="text-xs font-semibold leading-relaxed text-hpsr-muted">{item.description}</p>
                      <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                        <div className="rounded-[12px] bg-[#fcf6ee] px-3 py-2">
                          <dt className="text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">Responsável</dt>
                          <dd className="mt-1 font-bold text-hpsr-text">{item.actor || "Não informado"}</dd>
                        </div>
                        <div className="rounded-[12px] bg-[#fcf6ee] px-3 py-2">
                          <dt className="text-[9px] font-black uppercase tracking-[0.12em] text-hpsr-wineLight">Referência</dt>
                          <dd className="mt-1 break-words font-bold text-hpsr-text">{item.reference || "Sem referência"}</dd>
                        </div>
                      </dl>
                    </div>
                  </details>
                ))}

                {activities.length === 0 && (
                  <div className="rounded-[16px] border border-dashed border-hpsr-border bg-[#fcf6ee] p-5 text-sm font-semibold text-hpsr-muted">
                    Nenhuma atividade registrada para este médico.
                  </div>
                )}
              </div>
            </div>
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</span>
      <input type={type} minLength={minLength} className={`${inputClass} mt-1.5`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
