/** Read clipboard image bytes first; copied web images may instead supply HTML.
 * Import remote bytes once, never retain a hotlink that can later disappear. */
export async function clipboardAttachmentImages(data: DataTransfer): Promise<File[]> {
  const items = Array.from(data.items || []);
  const files = items.filter(item => item.kind === "file" && item.type.startsWith("image/"))
    .map(item => item.getAsFile()).filter((file): file is File => Boolean(file));
  if (files.length) return files;
  const fallback = Array.from(data.files || []).filter(file => file.type.startsWith("image/"));
  if (fallback.length) return fallback;
  const html = data.getData("text/html");
  const src = html ? new DOMParser().parseFromString(html, "text/html").querySelector("img")?.getAttribute("src") : null;
  if (!src) return [];
  if (!/^https?:\/\//i.test(src) && !/^data:image\/(png|jpe?g|webp|gif|bmp|avif);base64,/i.test(src)) {
    throw new Error("Não foi possível ler esta imagem. Use ‘Copiar imagem’ no navegador ou selecione o arquivo.");
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(src, { signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer" });
    if (!response.ok) throw new Error("Imagem indisponível");
    const blob = await response.blob();
    if (!/^image\/(png|jpe?g|webp|gif|bmp|avif)$/i.test(blob.type) || !blob.size) throw new Error("Formato inválido");
    const extension = blob.type.split("/")[1].replace("jpeg", "jpg");
    return [new File([blob], `imagem-colada.${extension}`, { type: blob.type })];
  } catch {
    throw new Error("O site de origem não permitiu importar esta imagem. Use ‘Copiar imagem’ para copiar a imagem em si, ou selecione o arquivo.");
  } finally {
    clearTimeout(timeout);
  }
}
