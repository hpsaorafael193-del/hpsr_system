"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { currentUserProfile as localDevProfile } from "@/data/current-user-profile";
import { createClient, isSupabaseConfigured } from "@/lib/supabase";

export type CurrentUserProfile = typeof localDevProfile;

type ProfileUpdate = Partial<Pick<CurrentUserProfile,
  "characterName" | "passport" | "crm" | "cityPhone" | "email" | "department" | "signatureName" | "serviceStatus"
>>;

type CurrentUserProfileContextValue = {
  profile: CurrentUserProfile;
  loading: boolean;
  refreshProfile: () => Promise<void>;
  updateProfile: (changes: ProfileUpdate) => Promise<{ ok: boolean; error?: string }>;
};

const CurrentUserProfileContext = createContext<CurrentUserProfileContextValue | null>(null);

function mapDatabaseProfile(row: Record<string, unknown>): CurrentUserProfile {
  const name = String(row.name || "Médico");
  const role = String(row.role || "Médico Clínico");
  const specialty = String(row.specialty || "Clínico Geral");
  const passport = String(row.passport || "—");
  const crm = String(row.crm || "—");
  const cityPhone = String(row.city_phone || "—");
  const email = String(row.email || "");
  const serviceStatus = String(row.service_status || "Fora de serviço");

  return {
    ...localDevProfile,
    systemName: name,
    characterName: name,
    passport,
    role,
    systemRole: role,
    accessLevel: role === "Dev / Desenvolvedor do Sistema" ? "Total" : "Padrão",
    department: "Hospital São Rafael",
    specialty,
    specialties: [specialty],
    crm,
    cityPhone,
    discordId: String(row.discord || ""),
    email,
    serviceStatus,
    signatureName: name,
    signatureRole: role,
    joinedAt: String(row.created_at || localDevProfile.joinedAt),
  };
}

export function CurrentUserProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CurrentUserProfile>(() => isSupabaseConfigured() ? { ...localDevProfile, systemName: "Carregando...", characterName: "Carregando...", passport: "—", role: "Médico", systemRole: "Médico", specialty: "Não informado", specialties: ["Não informado"], crm: "—", cityPhone: "—", email: "", signatureName: "Carregando...", signatureRole: "Médico" } : localDevProfile);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      setProfile(localDevProfile);
      setLoading(false);
      return;
    }

    const client = createClient();
    if (!client) {
      setLoading(false);
      return;
    }

    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) {
      setProfile({ ...localDevProfile, systemName: "Sessão não encontrada", characterName: "Sessão não encontrada", passport: "—", role: "Médico", systemRole: "Médico", specialty: "Não informado", specialties: ["Não informado"], crm: "—", cityPhone: "—", email: "", signatureName: "Sessão não encontrada", signatureRole: "Médico" });
      setLoading(false);
      return;
    }

    const { data, error } = await client
      .from("profiles")
      .select("id, name, email, passport, crm, role, specialty, city_phone, discord, service_status, signature_path, created_at")
      .eq("id", user.id)
      .maybeSingle();

    if (!error && data) setProfile(mapDatabaseProfile(data as Record<string, unknown>));
    else if (!data) setProfile({ ...localDevProfile, systemName: "Perfil não localizado", characterName: "Perfil não localizado", passport: "—", role: "Médico", systemRole: "Médico", specialty: "Não informado", specialties: ["Não informado"], crm: "—", cityPhone: "—", email: "", signatureName: "Perfil não localizado", signatureRole: "Médico" });
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshProfile();
  }, [refreshProfile]);

  const updateProfile = useCallback(async (changes: ProfileUpdate) => {
    if (!isSupabaseConfigured()) {
      setProfile((current) => ({ ...current, ...changes, systemName: changes.characterName || current.systemName }));
      return { ok: true };
    }

    const client = createClient();
    if (!client) return { ok: false, error: "Supabase indisponível." };

    const { data: sessionData } = await client.auth.getSession();
    const user = sessionData.session?.user;
    if (!user) return { ok: false, error: "Sessão não encontrada." };

    const payload: Record<string, string | null> = {};
    if (changes.characterName !== undefined) payload.name = changes.characterName.trim();
    if (changes.passport !== undefined) payload.passport = changes.passport.trim() || null;
    if (changes.crm !== undefined) payload.crm = changes.crm.trim() || null;
    if (changes.cityPhone !== undefined) payload.city_phone = changes.cityPhone.trim() || null;
    if (changes.email !== undefined) payload.email = changes.email.trim() || null;
    if (changes.serviceStatus !== undefined) payload.service_status = changes.serviceStatus;
    payload.updated_at = new Date().toISOString();

    const { error } = await client.from("profiles").update(payload).eq("id", user.id);
    if (error) return { ok: false, error: error.message };

    await refreshProfile();
    return { ok: true };
  }, [refreshProfile]);

  const value = useMemo(() => ({ profile, loading, refreshProfile, updateProfile }), [profile, loading, refreshProfile, updateProfile]);

  if (loading && isSupabaseConfigured()) {
    return (
      <div className="grid min-h-screen place-items-center bg-hpsr-bg px-4">
        <div className="rounded-[18px] border border-hpsr-border bg-white px-6 py-5 text-center shadow-soft">
          <p className="text-sm font-black text-hpsr-text">Carregando perfil médico...</p>
        </div>
      </div>
    );
  }

  return <CurrentUserProfileContext.Provider value={value}>{children}</CurrentUserProfileContext.Provider>;
}

export function useCurrentUserProfile() {
  const context = useContext(CurrentUserProfileContext);
  if (!context) throw new Error("useCurrentUserProfile deve ser usado dentro de CurrentUserProfileProvider.");
  return context;
}
