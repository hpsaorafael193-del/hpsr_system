export type ClinicalImageKind = "signature" | "attachment";
export async function imageDigest(blob: Blob): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest), value => value.toString(16).padStart(2, "0")).join("");
}
export async function optimizeClinicalImage(blob: Blob, kind: ClinicalImageKind): Promise<Blob> {
  if (!blob.type.startsWith("image/")) throw new Error("Selecione uma imagem válida.");
  // PNG signatures already within the cap need no image decoder or canvas pass.
  if (blob.type === "image/png" && blob.size >= 24 && (kind === "signature" || blob.size < 600000)) {
    const header = new DataView(await blob.slice(0, 24).arrayBuffer());
    if (header.getUint32(0) === 0x89504e47 && header.getUint32(16) > 0 && header.getUint32(20) > 0 && header.getUint32(16) <= (kind === "signature" ? 1600 : 2400) && header.getUint32(20) <= (kind === "signature" ? 600 : 3200)) return blob;
  }
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => { img.onload = () => resolve(); img.onerror = () => reject(new Error("Não foi possível ler a imagem.")); img.src = url; });
    const width = kind === "signature" ? 1600 : 2400, height = kind === "signature" ? 600 : 3200;
    const scale = Math.min(1, width / img.naturalWidth, height / img.naturalHeight);
    if (scale === 1 && (kind === "signature" || blob.size < 600000 || blob.type === "image/webp")) return blob;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("Não foi possível preparar a imagem.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const result = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error("Falha ao otimizar a imagem.")), kind === "signature" ? "image/png" : "image/webp", .94));
    return result.size < blob.size || scale < 1 ? result : blob;
  } finally { URL.revokeObjectURL(url); }
}
export function blobDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error("Falha ao ler imagem.")); reader.readAsDataURL(blob); });
}
