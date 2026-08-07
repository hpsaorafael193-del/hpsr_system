declare module "@/vendor/jszip.min.js" {
  type GenerateOptions = {
    type: "blob" | "uint8array";
    compression?: "STORE" | "DEFLATE";
    compressionOptions?: { level?: number };
    mimeType?: string;
    platform?: "DOS" | "UNIX";
  };

  export default class JSZip {
    file(path: string, data: string | Uint8Array): this;
    generateAsync(options: GenerateOptions): Promise<Blob | Uint8Array>;
    static loadAsync(data: Blob | Uint8Array | ArrayBuffer): Promise<JSZip>;
  }
}
