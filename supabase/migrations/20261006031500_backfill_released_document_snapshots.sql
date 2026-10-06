-- HPSR v1.1.16-test.30
-- Congela a versão atualmente publicada dos documentos históricos antes da edição estruturada.
-- Apenas documentos já liberados, sem snapshot, são preenchidos. Nenhum conteúdo é apagado.

update public.clinical_records
   set payload = jsonb_set(
     payload,
     '{releasedSnapshot}',
     jsonb_strip_nulls(jsonb_build_object(
       'schemaVersion', coalesce(payload -> 'schemaVersion', '1'::jsonb),
       'documentKind', coalesce(payload -> 'documentKind', '"legacy-medical-document"'::jsonb),
       'documentTitle', payload -> 'documentTitle',
       'documentModelId', payload -> 'documentModelId',
       'documentCategory', payload -> 'documentCategory',
       'documentHtml', payload -> 'documentHtml',
       'guidedValues', payload -> 'guidedValues',
       'useModel', payload -> 'useModel',
       'patient', payload -> 'patient',
       'doctor', payload -> 'doctor',
       'selectedDoctorId', payload -> 'selectedDoctorId',
       'previewImage', payload -> 'previewImage',
       'previewImages', payload -> 'previewImages',
       'savedAt', payload -> 'savedAt',
       'appointmentId', payload -> 'appointmentId',
       'appointmentSpecialty', payload -> 'appointmentSpecialty',
       'appointmentDoctor', payload -> 'appointmentDoctor',
       'appointmentDate', payload -> 'appointmentDate',
       'appointmentTime', payload -> 'appointmentTime',
       'releasedAt', to_jsonb(released_at),
       'releasedBy', to_jsonb(released_by)
     )),
     true
   ),
   updated_at = updated_at
 where lower(record_type) = 'documento'
   and is_confidential = false
   and released_at is not null
   and not (payload ? 'releasedSnapshot');
