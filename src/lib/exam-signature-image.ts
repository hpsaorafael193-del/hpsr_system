export const EXAM_SIGNATURE_WIDTH = 540;
export const EXAM_SIGNATURE_HEIGHT = 100;
export const EXAM_SIGNATURE_IMAGE_WIDTH = 360;
export const EXAM_SIGNATURE_IMAGE_HEIGHT = 68;

export function normalizeSignatureImage(image: HTMLImageElement) {
      const sourceCanvas = document.createElement("canvas");
      sourceCanvas.width = image.naturalWidth || image.width;
      sourceCanvas.height = image.naturalHeight || image.height;
      const sourceContext = sourceCanvas.getContext("2d", { willReadFrequently: true });
      if (!sourceContext) return image;
      sourceContext.drawImage(image, 0, 0);
      let pixels: ImageData;
      try {
        pixels = sourceContext.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
      } catch (error) {
        console.warn("[HPSR][Exames] A assinatura não pôde ser normalizada por restrição de origem e será omitida do PNG.", error);
        return null;
      }
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
          const isNearWhite = red > 242 && green > 242 && blue > 242;
          if (isNearWhite) {
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
      if (maxX < minX || maxY < minY) return sourceCanvas;

      const padding = Math.max(2, Math.round(Math.min(sourceCanvas.width, sourceCanvas.height) * 0.01));
      const cropX = Math.max(0, minX - padding);
      const cropY = Math.max(0, minY - padding);
      const cropWidth = Math.min(sourceCanvas.width - cropX, maxX - minX + 1 + padding * 2);
      const cropHeight = Math.min(sourceCanvas.height - cropY, maxY - minY + 1 + padding * 2);
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropWidth;
      croppedCanvas.height = cropHeight;
      const croppedContext = croppedCanvas.getContext("2d");
      if (!croppedContext) return sourceCanvas;
      croppedContext.drawImage(sourceCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
      return croppedCanvas;
    }

// Bounded, memory-only reuse across pages of the same exam preview.
const signaturePreviews = new Map<string, Promise<string | null>>();
export function loadSignaturePreview(source: string): Promise<string | null> {
  const cached = signaturePreviews.get(source);
  if (cached) {
    signaturePreviews.delete(source);
    signaturePreviews.set(source, cached);
    return cached;
  }
  const result = new Promise<string | null>((resolve) => {
    const image = new Image();
    if (!source.startsWith("data:")) image.crossOrigin = "anonymous";
    image.onerror = () => { signaturePreviews.delete(source); resolve(null); };
    image.onload = () => {
      try {
        const normalized = normalizeSignatureImage(image);
        const url = normalized instanceof HTMLCanvasElement ? normalized.toDataURL("image/png") : null;
        if (!url || url.length > 2_000_000) signaturePreviews.delete(source);
        resolve(url);
      } catch { signaturePreviews.delete(source); resolve(null); }
    };
    image.src = source;
  });
  signaturePreviews.set(source, result);
  if (signaturePreviews.size > 8) signaturePreviews.delete(signaturePreviews.keys().next().value!);
  return result;
}
