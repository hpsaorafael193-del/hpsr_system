"use client";

import { useEffect, useState } from "react";
import { loadSignaturePreview, EXAM_SIGNATURE_IMAGE_WIDTH, EXAM_SIGNATURE_IMAGE_HEIGHT } from "@/lib/exam-signature-image";

export function ExamSignatureImage({ source }: { source: string }) {
  const [cropped, setCropped] = useState<{ source: string; url: string } | null>(null);
  useEffect(() => {
    let active = true;
    void loadSignaturePreview(source).then((url) => {
      if (active && url) setCropped({ source, url });
    });
    return () => { active = false; };
  }, [source]);

  return <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "flex-end", justifyContent: "center" }}><img src={cropped?.source === source ? cropped.url : source}
    alt="Assinatura cadastrada" className="mx-auto block object-contain"
    style={{ width: EXAM_SIGNATURE_IMAGE_WIDTH, height: EXAM_SIGNATURE_IMAGE_HEIGHT, maxWidth: "100%", maxHeight: EXAM_SIGNATURE_IMAGE_HEIGHT,
      objectFit: "contain", objectPosition: "center bottom", mixBlendMode: "multiply", background: "transparent" }} /></div>;
}
