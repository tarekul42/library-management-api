import PDFDocument from "pdfkit";
import type { Context } from "hono";

function getColumnWidths(headers: string[], totalWidth: number = 700): number[] {
  const avg = Math.floor(totalWidth / headers.length);
  return headers.map((h) => Math.max(60, avg));
}

export function generatePDF(
  title: string,
  headers: string[],
  rows: Record<string, unknown>[],
  filename: string,
  options?: { layout?: "portrait" | "landscape"; fontSize?: number; colWidths?: number[] },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 30,
      size: "A4",
      layout: options?.layout ?? "landscape",
    });
    const buffers: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => buffers.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(buffers)));
    doc.on("error", reject);

    const fontSize = options?.fontSize ?? 8;
    doc.fontSize(16).text(title, { align: "center" });
    doc.moveDown();
    doc.fontSize(fontSize);

    const colWidths = options?.colWidths ?? getColumnWidths(headers);
    let y = doc.y;
    const left = 30;

    headers.forEach((h, i) => {
      const x = left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
      doc.font("Helvetica-Bold").text(h, x, y, { width: colWidths[i], lineBreak: false });
    });
    y += 14;
    doc.font("Helvetica");

    for (const row of rows) {
      if (y > 550) { doc.addPage(); y = 30; }
      headers.forEach((h, i) => {
        const x = left + colWidths.slice(0, i).reduce((a, b) => a + b, 0);
        doc.text(String(row[h] ?? ""), x, y, { width: colWidths[i] });
      });
      y += 12;
    }

    doc.end();
  });
}

export async function respondWithPDF(c: Context, pdf: Buffer, filename: string) {
  c.header("Content-Type", "application/pdf");
  c.header("Content-Disposition", `attachment; filename="${filename}.pdf"`);
  return c.newResponse(new Uint8Array(pdf));
}
