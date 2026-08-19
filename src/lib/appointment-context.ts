export type ActiveAppointmentContext = {
  id: string;
  specialty: string;
  doctorName: string;
  date: string;
  time: string;
};

export async function findActiveAppointmentContext(
  client: any,
  patientPassport: string,
  doctor: { id?: string; name?: string },
): Promise<ActiveAppointmentContext | null> {
  const passport = String(patientPassport || "").trim().toUpperCase();
  if (!client || !passport) return null;

  const { data, error } = await client
    .from("appointments")
    .select("id,status,payload,updated_at")
    .eq("passport", passport)
    .eq("status", "Em atendimento")
    .order("updated_at", { ascending: false })
    .limit(8);

  if (error) return null;

  const doctorId = String(doctor.id || "").trim();
  const doctorName = String(doctor.name || "").trim().toLocaleLowerCase("pt-BR");
  for (const row of data || []) {
    const payload = (row?.payload || {}) as Record<string, unknown>;
    const rowDoctorId = String(payload.doctorId || payload.physicianId || "").trim();
    const rowDoctorName = String(payload.physician || payload.doctor || payload.doctorName || "").trim().toLocaleLowerCase("pt-BR");
    const sameDoctor = (doctorId && rowDoctorId === doctorId) || (doctorName && rowDoctorName === doctorName);
    if (!sameDoctor) continue;
    return {
      id: String(row.id),
      specialty: String(payload.specialty || ""),
      doctorName: String(payload.physician || payload.doctor || payload.doctorName || doctor.name || ""),
      date: String(payload.date || payload.preferredDate || payload.proposedDate || ""),
      time: String(payload.time || payload.preferredTime || payload.proposedTime || ""),
    };
  }
  return null;
}
