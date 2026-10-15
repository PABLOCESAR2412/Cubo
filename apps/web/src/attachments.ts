import type { ChatAttachment } from "@cubo/shared";
export const attachmentAccept = ".txt,.md,.html,.htm,.pdf,.docx,.xlsx,.pptx";
function xmlText(raw: string, tag: string) {
  const doc = new DOMParser().parseFromString(raw, "application/xml");
  return Array.from(doc.getElementsByTagNameNS("*", tag))
    .map((n) => n.textContent ?? "")
    .join(" ");
}
export async function extractAttachment(file: File): Promise<ChatAttachment> {
  if (file.size > 5 * 1024 * 1024) throw Error(`${file.name}: máximo 5 MB.`);
  const ext = file.name.split(".").pop()?.toLowerCase();
  let text = "";
  if (["txt", "md", "html", "htm"].includes(ext ?? "")) {
    const raw = await file.text();
    text = ["html", "htm"].includes(ext ?? "")
      ? (() => {
          const doc = new DOMParser().parseFromString(raw, "text/html");
          doc.querySelectorAll("script,style,iframe,object").forEach((e) => {
            e.remove();
          });
          return doc.body.textContent ?? "";
        })()
      : raw;
  } else if (ext === "pdf") {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = (
      await import("pdfjs-dist/build/pdf.worker.min.mjs?url")
    ).default;
    const task = pdfjs.getDocument({ data: await file.arrayBuffer(), useSystemFonts: true });
    try {
      const doc = await task.promise;
      for (let i = 1; i <= Math.min(doc.numPages, 30) && text.length < 12000; i++) {
        const page = await doc.getPage(i);
        const content = await page.getTextContent();
        text += `${content.items.map((item) => ("str" in item ? item.str : "")).join(" ")}\n`;
      }
      if (doc.numPages > 30) text += "\n[Vista limitada a 30 páginas]";
    } finally {
      await task.destroy();
    }
  } else if (["docx", "xlsx", "pptx"].includes(ext ?? "")) {
    const { unzipSync, strFromU8 } = await import("fflate");
    let expanded = 0;
    const archive = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: (entry) => {
        const keep =
          /^(word\/document\.xml|xl\/(sharedStrings\.xml|worksheets\/sheet\d+\.xml)|ppt\/slides\/slide\d+\.xml)$/.test(
            entry.name,
          );
        if (keep) {
          expanded += entry.originalSize;
          if (entry.originalSize > 2000000 || expanded > 10000000)
            throw Error("Documento demasiado grande al descomprimir.");
        }
        return keep;
      },
    });
    if (ext === "xlsx") {
      const strings = archive["xl/sharedStrings.xml"]
        ? Array.from(
            new DOMParser()
              .parseFromString(strFromU8(archive["xl/sharedStrings.xml"]), "application/xml")
              .getElementsByTagNameNS("*", "si"),
          ).map((n) => n.textContent ?? "")
        : [];
      for (const [name, bytes] of Object.entries(archive).sort(([a], [b]) =>
        a.localeCompare(b, undefined, { numeric: true }),
      )) {
        if (!name.includes("worksheets")) continue;
        const doc = new DOMParser().parseFromString(strFromU8(bytes), "application/xml");
        text +=
          `${name.split("/").pop()}\n` +
          Array.from(doc.getElementsByTagNameNS("*", "row"))
            .map((row) =>
              Array.from(row.getElementsByTagNameNS("*", "c"))
                .map((cell) => {
                  const value =
                    cell.getElementsByTagNameNS("*", "v")[0]?.textContent ?? cell.textContent ?? "";
                  return cell.getAttribute("t") === "s" ? (strings[Number(value)] ?? "") : value;
                })
                .join("\t"),
            )
            .join("\n") +
          "\n";
      }
    } else
      text = Object.entries(archive)
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([, bytes]) => xmlText(strFromU8(bytes), "t"))
        .join("\n");
  } else throw Error("Formato no compatible. Usa TXT, MD, HTML, PDF, DOCX, XLSX o PPTX.");
  text = text.replaceAll(String.fromCharCode(0), "").trim();
  if (!text)
    throw Error("No se encontró texto. PDF escaneado, cifrado o archivo vacío: OCR no disponible.");
  return {
    name: file.name.slice(0, 160),
    text: text.slice(0, 12000),
    truncated: text.length > 12000 || text.includes("[Vista limitada a 30 páginas]"),
  };
}
