import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync("src/app/api/paciente/notificacoes/route.ts", "utf8");
assert(source.includes("patient_notification_title:payload->>patientNotificationTitle"));
assert(source.includes("patient_notification:payload->>patientNotification"));
assert(source.includes("patient_notification_at:payload->>patientNotificationAt"));
assert(source.includes("appointment-notice:${a.id}"));
assert(source.includes('section: "appointments"'));
console.log("PASS patient appointment notification v1.1.16-test.75");
