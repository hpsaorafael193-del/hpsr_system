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
} from "lucide-react";
import { profileDocuments, profileHistory } from "@/data/current-user-profile";
import { useCurrentUserProfile } from "@/components/auth/CurrentUserProfileProvider";
import { hpsrAlert } from "@/components/ui/HpsrDialogProvider";

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
  const { profile: currentUserProfile, updateProfile: persistProfile } = useCurrentUserProfile();
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

  useEffect(() => {
    const storedStatus = localStorage.getItem(statusStorageKey);
    if (storedStatus) setServiceStatus(storedStatus);

    const storedSignature = localStorage.getItem("hpsr-profile-signature-png");
    if (storedSignature) setSignatureImage(storedSignature);
  }, [statusStorageKey]);

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
    reader.onload = () => {
      const image = String(reader.result);
      setSignatureImage(image);
      localStorage.setItem("hpsr-profile-signature-png", image);
    };
    reader.readAsDataURL(file);
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
                      onClick={() => {
                        setSignatureImage(null);
                        localStorage.removeItem("hpsr-profile-signature-png");
                      }}
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
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[16px] bg-[#f7f2ea] text-hpsr-wine">
                <FileText size={18} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-hpsr-wineLight">Histórico</p>
                <h2 className="text-xl font-black text-hpsr-text">Atividade do perfil</h2>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {profileHistory.map((item) => (
                <div key={item.title} className="rounded-[16px] border border-hpsr-border bg-[#fcf6ee] p-3">
                  <p className="text-sm font-black text-hpsr-text">{item.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-hpsr-muted">{item.description}</p>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{item.date}</p>
                </div>
              ))}
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
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.14em] text-hpsr-wineLight">{label}</span>
      <input className={`${inputClass} mt-1.5`} value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
