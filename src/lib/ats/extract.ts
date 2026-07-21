import type { ExtractedResume } from "./types";

const PDF_WORKER_URL = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.7.76/build/pdf.worker.min.mjs";

export async function extractResume(file: File): Promise<ExtractedResume> {
  const name = file.name.toLowerCase();
  if (file.size > 10 * 1024 * 1024) throw new Error("File exceeds 10 MB limit.");
  if (name.endsWith(".pdf")) return extractPdf(file);
  if (name.endsWith(".docx")) return extractDocx(file);
  throw new Error("Unsupported file type. Please upload a PDF or DOCX.");
}

async function extractPdf(file: File): Promise<ExtractedResume> {
  const pdfjs: any = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_URL;
  const buf = await file.arrayBuffer();
  let doc;
  try {
    doc = await pdfjs.getDocument({ data: buf }).promise;
  } catch (e: any) {
    if (e?.name === "PasswordException") throw new Error("This PDF is password protected. Please remove the password and try again.");
    throw new Error("Could not read the PDF. The file may be corrupted.");
  }

  const warnings: string[] = [];
  let fullText = "";
  const fontSizes: number[] = [];
  const columnHistogram: number[] = [];
  let imageCount = 0;

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lines = new Map<number, { x: number; text: string }[]>();
    for (const item of content.items as any[]) {
      const t = item.str as string;
      const tx = item.transform;
      const y = Math.round(tx[5]);
      const x = tx[4];
      const h = Math.abs(tx[3]) || 10;
      fontSizes.push(h);
      columnHistogram.push(Math.round(x / 40));
      if (!lines.has(y)) lines.set(y, []);
      lines.get(y)!.push({ x, text: t });
    }
    const sortedYs = Array.from(lines.keys()).sort((a, b) => b - a);
    for (const y of sortedYs) {
      const parts = lines.get(y)!.sort((a, b) => a.x - b.x).map((p) => p.text);
      fullText += parts.join(" ").replace(/\s+/g, " ").trim() + "\n";
    }

    try {
      const ops = await page.getOperatorList();
      for (const fn of ops.fnArray) {
        // 82 = paintImageXObject in pdfjs
        if (fn === 82 || fn === 85) imageCount++;
      }
    } catch { /* ignore */ }
  }

  const buckets = new Map<number, number>();
  for (const b of columnHistogram) buckets.set(b, (buckets.get(b) || 0) + 1);
  const sortedBuckets = Array.from(buckets.entries()).sort((a, b) => b[1] - a[1]);
  const top = sortedBuckets[0]?.[1] ?? 0;
  const second = sortedBuckets[1]?.[1] ?? 0;
  const columns = second > top * 0.55 ? 2 : 1;

  if (!fullText.trim()) warnings.push("Very little text extracted — the resume may be image-based");

  return {
    text: fullText.trim(),
    fileName: file.name,
    fileSize: file.size,
    warnings,
    layout: { columns, imageCount, fontSizes, pageCount: doc.numPages },
  };
}

async function extractDocx(file: File): Promise<ExtractedResume> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buf = await file.arrayBuffer();
  const warnings: string[] = [];
  try {
    const result = await (mammoth as any).extractRawText({ arrayBuffer: buf });
    const text: string = result.value;
    for (const m of result.messages || []) if (m.type === "warning") warnings.push(m.message);
    return {
      text: text.trim(),
      fileName: file.name,
      fileSize: file.size,
      warnings,
      layout: { columns: 1, imageCount: 0, fontSizes: [11], pageCount: Math.max(1, Math.ceil(text.length / 3500)) },
    };
  } catch {
    throw new Error("Could not read the DOCX file. It may be corrupted.");
  }
}
