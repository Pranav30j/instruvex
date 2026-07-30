import type { ExtractedResume } from "./types";

/**
 * Mobile-safe resume extraction pipeline.
 * - pdf.js 3.11.174 legacy build (last line widely verified on iOS Safari).
 * - CLASSIC worker (`/pdf.worker.min.js`, served as a static asset) — iOS Safari
 *   module-worker support is what produced "Uninitialized variable".
 */
const PDF_WORKER_URL = "/pdf.worker.min.js";

/** Last real exception thrown by pdf.js, exposed for production debugging. */
export let lastPdfError: { name: string; message: string; stack?: string } | null = null;

const MAX_BYTES = 10 * 1024 * 1024;

const PDF_MIMES = ["application/pdf", "application/x-pdf", "application/acrobat", "text/pdf"];
const DOCX_MIMES = [
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/octet-stream", // many mobile browsers report this
];

export type SupportedInput = File | Blob | ArrayBuffer | Uint8Array;

interface NormalizedInput {
  bytes: Uint8Array;
  fileName: string;
  fileSize: number;
  mimeType: string;
}

function deviceInfo() {
  const ua = typeof navigator !== "undefined" ? navigator.userAgent || "" : "unknown";
  const isMobile = /Android|iPhone|iPad|iPod|Mobile|Silk|Samsung/i.test(ua);
  return { ua, deviceType: isMobile ? "mobile" : "desktop" };
}

function log(stage: string, extra: Record<string, unknown> = {}) {
  const { ua, deviceType } = deviceInfo();
  // eslint-disable-next-line no-console
  console.info(`[ATS] ${stage}`, { deviceType, ua, ...extra });
}

async function toUint8Array(input: SupportedInput): Promise<Uint8Array> {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  if (typeof Blob !== "undefined" && input instanceof Blob) {
    // Prefer the standard API; fall back to FileReader for older mobile browsers.
    if (typeof (input as Blob).arrayBuffer === "function") {
      const buf = await input.arrayBuffer();
      return new Uint8Array(buf);
    }
    const buf = await readViaFileReader(input as Blob);
    return new Uint8Array(buf);
  }
  throw new Error("Unsupported input. Please upload a PDF or DOCX file.");
}

function readViaFileReader(blob: Blob): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result;
        if (res instanceof ArrayBuffer) resolve(res);
        else reject(new Error("Could not read the file on this device."));
      };
      reader.onerror = () => reject(new Error("Could not read the file on this device."));
      reader.readAsArrayBuffer(blob);
    } catch (e) {
      reject(e instanceof Error ? e : new Error("Could not read the file on this device."));
    }
  });
}

function sniffKind(bytes: Uint8Array, mimeType: string, fileName: string): "pdf" | "docx" {
  // Magic bytes are the most reliable signal on mobile.
  if (bytes.length >= 4) {
    const sig = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    if (sig === "%PDF") return "pdf";
    if (sig.slice(0, 2) === "PK") return "docx"; // zip container => docx
  }
  const mime = (mimeType || "").toLowerCase();
  if (PDF_MIMES.includes(mime)) return "pdf";
  if (DOCX_MIMES.includes(mime)) return "docx";
  const name = (fileName || "").toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  throw new Error("Unsupported file type. Please upload a PDF or DOCX resume.");
}

async function normalize(input: SupportedInput): Promise<NormalizedInput> {
  if (input === null || input === undefined) {
    throw new Error("No file received. Please select a resume and try again.");
  }
  const anyInput = input as any;
  const fileName: string = typeof anyInput?.name === "string" && anyInput.name ? anyInput.name : "resume";
  const mimeType: string = typeof anyInput?.type === "string" ? anyInput.type : "";

  const bytes = await toUint8Array(input);
  if (!bytes || bytes.byteLength === 0) {
    throw new Error("This file appears to be empty. Please re-export it and try again.");
  }
  if (bytes.byteLength > MAX_BYTES) {
    throw new Error("File exceeds the 10 MB limit.");
  }
  return { bytes, fileName, fileSize: bytes.byteLength, mimeType };
}

export async function extractResume(input: SupportedInput): Promise<ExtractedResume> {
  const info = await normalize(input);
  const kind = sniffKind(info.bytes, info.mimeType, info.fileName);
  log("normalized", { fileName: info.fileName, fileSize: info.fileSize, mimeType: info.mimeType, kind });

  let extracted: ExtractedResume;
  if (kind === "pdf") {
    extracted = await extractPdfWithRetry(info);
  } else {
    extracted = await extractDocx(info);
  }

  if (!extracted || typeof extracted.text !== "string" || !extracted.text.trim()) {
    throw new Error("Unable to extract text from this resume. Please try another PDF or DOCX file.");
  }
  return extracted;
}

async function extractPdfWithRetry(info: NormalizedInput): Promise<ExtractedResume> {
  try {
    return await extractPdf(info, false);
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    if (/password|encrypted/i.test(err.message)) throw err;
    log("pdf-first-attempt-failed", { message: err.message, stack: err.stack });
    try {
      // Retry without a web worker — fixes most mobile Safari / Samsung Internet failures.
      return await extractPdf(info, true);
    } catch (e2) {
      const err2 = e2 instanceof Error ? e2 : new Error(String(e2));
      log("pdf-retry-failed", { message: err2.message, stack: err2.stack });
      if (/password|encrypted/i.test(err2.message)) throw err2;
      throw new Error(
        "We couldn't read this PDF on your device. Try re-saving it as a standard PDF, or upload a DOCX version."
      );
    }
  }
}

async function extractPdf(info: NormalizedInput, disableWorker: boolean): Promise<ExtractedResume> {
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  if (!pdfjs || typeof pdfjs.getDocument !== "function") {
    throw new Error("PDF engine failed to load. Please refresh and try again.");
  }

  if (disableWorker) {
    try { pdfjs.GlobalWorkerOptions.workerSrc = ""; } catch { /* ignore */ }
  } else {
    try { pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL; } catch { /* ignore */ }
  }

  // Copy the buffer: pdf.js transfers/detaches it, which breaks the retry path.
  const data = new Uint8Array(info.bytes);

  let doc: any = null;
  try {
    doc = await pdfjs.getDocument({
      data,
      disableWorker,
      isEvalSupported: false,
      useSystemFonts: false,
      disableFontFace: true,
    }).promise;
  } catch (e: any) {
    if (e?.name === "PasswordException") {
      throw new Error("This PDF is password protected. Please remove the password and try again.");
    }
    throw e instanceof Error ? e : new Error(String(e));
  }

  if (!doc || typeof doc.numPages !== "number" || doc.numPages < 1) {
    throw new Error("This PDF has no readable pages.");
  }

  const warnings: string[] = [];
  const fontSizes: number[] = [];
  const columnHistogram: number[] = [];
  let fullText = "";
  let imageCount = 0;
  const pageCount = doc.numPages;

  try {
    for (let i = 1; i <= pageCount; i++) {
      let page: any = null;
      try {
        page = await doc.getPage(i);
      } catch {
        warnings.push(`Page ${i} could not be read`);
        continue;
      }
      if (!page) continue;

      try {
        const content = await page.getTextContent();
        const items: any[] = Array.isArray(content?.items) ? content.items : [];
        const lines = new Map<number, { x: number; text: string }[]>();
        for (const item of items) {
          if (!item) continue;
          const t = typeof item.str === "string" ? item.str : "";
          const tx = Array.isArray(item.transform) ? item.transform : null;
          const y = tx ? Math.round(Number(tx[5]) || 0) : 0;
          const x = tx ? Number(tx[4]) || 0 : 0;
          const h = tx ? Math.abs(Number(tx[3]) || 0) || 10 : 10;
          fontSizes.push(h);
          columnHistogram.push(Math.round(x / 40));
          if (!lines.has(y)) lines.set(y, []);
          lines.get(y)!.push({ x, text: t });
        }
        const sortedYs = Array.from(lines.keys()).sort((a, b) => b - a);
        for (const y of sortedYs) {
          const parts = (lines.get(y) || []).sort((a, b) => a.x - b.x).map((p) => p.text);
          fullText += parts.join(" ").replace(/\s+/g, " ").trim() + "\n";
        }
      } catch (e) {
        warnings.push(`Text on page ${i} could not be extracted`);
      }

      try {
        const ops = await page.getOperatorList();
        const fns: number[] = Array.isArray(ops?.fnArray) ? ops.fnArray : [];
        for (const fn of fns) if (fn === 82 || fn === 85) imageCount++;
      } catch { /* non-fatal */ }
    }
  } finally {
    try { await doc.destroy?.(); } catch { /* ignore */ }
  }

  const buckets = new Map<number, number>();
  for (const b of columnHistogram) buckets.set(b, (buckets.get(b) || 0) + 1);
  const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]);
  const top = sortedBuckets[0]?.[1] ?? 0;
  const second = sortedBuckets[1]?.[1] ?? 0;
  const columns = second > top * 0.55 ? 2 : 1;

  const text = fullText.trim();
  if (!text) {
    throw new Error(
      "Unable to extract text from this resume. Please try another PDF or DOCX file. (Scanned or image-only PDFs aren't supported.)"
    );
  }

  log("pdf-extracted", { pageCount, chars: text.length, disableWorker });

  return {
    text,
    fileName: info.fileName,
    fileSize: info.fileSize,
    warnings,
    layout: {
      columns,
      imageCount,
      fontSizes: fontSizes.length ? fontSizes : [11],
      pageCount,
    },
  };
}

async function extractDocx(info: NormalizedInput): Promise<ExtractedResume> {
  const warnings: string[] = [];
  let mammoth: any = null;
  try {
    mammoth = await import("mammoth/mammoth.browser");
  } catch {
    throw new Error("DOCX engine failed to load. Please refresh and try again.");
  }
  const lib = mammoth?.default ?? mammoth;
  if (!lib || typeof lib.extractRawText !== "function") {
    throw new Error("DOCX engine failed to load. Please refresh and try again.");
  }

  let text = "";
  try {
    const copy = new Uint8Array(info.bytes);
    const result = await lib.extractRawText({ arrayBuffer: copy.buffer });
    text = typeof result?.value === "string" ? result.value : "";
    const messages: any[] = Array.isArray(result?.messages) ? result.messages : [];
    for (const m of messages) if (m?.type === "warning" && m?.message) warnings.push(String(m.message));
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    log("docx-failed", { message: err.message, stack: err.stack });
    throw new Error(
      "We couldn't open this DOCX file — it may be corrupted or saved in an older .doc format. Please re-save it as .docx and try again."
    );
  }

  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("Unable to extract text from this resume. Please try another PDF or DOCX file.");
  }

  log("docx-extracted", { chars: trimmed.length });

  return {
    text: trimmed,
    fileName: info.fileName,
    fileSize: info.fileSize,
    warnings,
    layout: { columns: 1, imageCount: 0, fontSizes: [11], pageCount: Math.max(1, Math.ceil(trimmed.length / 3500)) },
  };
}
