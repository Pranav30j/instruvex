import jsPDF from "jspdf";
import type { AnalysisResult } from "./types";

export function exportReportPdf(result: AnalysisResult) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = M;

  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 80, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("Instruvex ATS Resume Report", M, 40);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(new Date().toLocaleString("en-IN"), M, 60);
  y = 110;

  doc.setTextColor(15, 23, 42);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(`File: ${result.fileName}`, M, y); y += 20;
  doc.setFontSize(28);
  doc.setTextColor(37, 99, 235);
  doc.text(`Overall Score: ${result.overallScore}/100`, M, y); y += 22;
  doc.setFontSize(11);
  doc.setTextColor(60, 60, 60);
  doc.text(`ATS Pass Probability: ${result.passProbability}%`, M, y); y += 16;
  doc.text(result.recruiterImpression, M, y, { maxWidth: W - M * 2 }); y += 28;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text("Category Scores", M, y); y += 8;
  doc.setDrawColor(220);
  doc.line(M, y, W - M, y); y += 14;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  for (const c of Object.values(result.categories)) {
    if (y > 760) { doc.addPage(); y = M; }
    doc.setTextColor(15, 23, 42);
    doc.text(`${c.label}`, M, y);
    doc.text(`${c.score}/${c.max}`, W - M - 40, y);
    doc.setFillColor(230, 236, 245);
    doc.rect(M, y + 4, W - M * 2, 6, "F");
    doc.setFillColor(37, 99, 235);
    doc.rect(M, y + 4, ((W - M * 2) * c.score) / c.max, 6, "F");
    y += 22;
  }

  y += 6;
  addSection(doc, "Strengths", result.strengths, [16, 122, 66]);
  addSection(doc, "Warnings", result.warnings.slice(0, 15), [180, 40, 40]);
  addSection(doc, "AI Recruiter Notes", result.aiSummary ? [result.aiSummary] : [], [37, 99, 235]);

  if (result.suggestions.length) {
    y = ensure(doc, y, 40);
    doc.setFont("helvetica", "bold"); doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text("Rewrite Suggestions", M, y); y += 16;
    doc.setFont("helvetica", "normal"); doc.setFontSize(10);
    for (const s of result.suggestions.slice(0, 6)) {
      y = ensure(doc, y, 60);
      doc.setTextColor(120, 40, 40);
      const bLines = doc.splitTextToSize(`Before: ${s.before}`, W - M * 2);
      doc.text(bLines, M, y); y += bLines.length * 12 + 2;
      doc.setTextColor(16, 122, 66);
      const aLines = doc.splitTextToSize(`After: ${s.after}`, W - M * 2);
      doc.text(aLines, M, y); y += aLines.length * 12 + 10;
    }
  }

  doc.save(`ATS-Report-${result.fileName.replace(/\.[^.]+$/, "")}.pdf`);

  function addSection(d: jsPDF, title: string, items: string[], color: number[]) {
    if (!items.length) return;
    y = ensure(d, y, 40);
    d.setFont("helvetica", "bold"); d.setFontSize(13);
    d.setTextColor(15, 23, 42);
    d.text(title, M, y); y += 14;
    d.setFont("helvetica", "normal"); d.setFontSize(10);
    d.setTextColor(color[0], color[1], color[2]);
    for (const it of items) {
      const lines = d.splitTextToSize(`• ${it}`, W - M * 2);
      y = ensure(d, y, lines.length * 12 + 4);
      d.text(lines, M, y); y += lines.length * 12 + 4;
    }
    y += 8;
  }

  function ensure(d: jsPDF, cur: number, need: number) {
    if (cur + need > 800) { d.addPage(); return M; }
    return cur;
  }
}