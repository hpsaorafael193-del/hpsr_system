import JSZip from "@/vendor/jszip.min.js";

export type XlsxCellValue = string | number | boolean | null | undefined;
export type XlsxSheetDefinition = {
  name: string;
  title: string;
  subtitle?: string;
  rows: Record<string, XlsxCellValue>[];
};

const EXCEL_CELL_TEXT_LIMIT = 32_767;

function sanitizeXmlText(value: XlsxCellValue) {
  const text = value == null ? "" : String(value);
  return text
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, " ")
    .replace(/\uFFFE|\uFFFF/g, " ")
    .slice(0, EXCEL_CELL_TEXT_LIMIT);
}

function xmlEscape(value: XlsxCellValue) {
  return sanitizeXmlText(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function columnName(index: number) {
  let value = index + 1;
  let output = "";
  while (value > 0) {
    value -= 1;
    output = String.fromCharCode(65 + (value % 26)) + output;
    value = Math.floor(value / 26);
  }
  return output;
}

function displayLength(value: XlsxCellValue) {
  return sanitizeXmlText(value).replace(/\s+/g, " ").trim().length;
}

function widthFor(header: string, rows: Record<string, XlsxCellValue>[]) {
  const sampled = rows.slice(0, 250);
  const contentMax = sampled.reduce((max, row) => Math.max(max, displayLength(row[header])), displayLength(header));
  let min = 12;
  let max = 28;
  if (/descri|observ|hist|dados|itens|motivo|experi|tentativas|complement/i.test(header)) { min = 24; max = 48; }
  else if (/nome|cargo|especial|depart|servi|exame|titulo|paciente|profissional/i.test(header)) { min = 18; max = 34; }
  else if (/data|entrada|saída|saida|atualiza|horário|horario/i.test(header)) { min = 18; max = 23; }
  else if (/status|resultado|entrevista|comparecimento/i.test(header)) { min = 16; max = 24; }
  return Math.min(max, Math.max(min, Math.ceil(contentMax * 1.12 + 2)));
}

function cellXml(value: XlsxCellValue, ref: string, style: number) {
  if (typeof value === "number" && Number.isFinite(value)) return `<c r="${ref}" s="${style}"><v>${value}</v></c>`;
  if (typeof value === "boolean") return `<c r="${ref}" s="${style}" t="b"><v>${value ? 1 : 0}</v></c>`;
  return `<c r="${ref}" s="${style}" t="inlineStr"><is><t xml:space="preserve">${xmlEscape(value)}</t></is></c>`;
}

function sheetXml(sheet: XlsxSheetDefinition) {
  const headers = sheet.rows.length
    ? Array.from(new Set(sheet.rows.flatMap((row) => Object.keys(row))))
    : ["Informação"];
  const lastColumn = columnName(Math.max(0, headers.length - 1));
  const rows: string[] = [];
  rows.push(`<row r="1" ht="34" customHeight="1">${cellXml(sheet.title, "A1", 1)}</row>`);
  rows.push(`<row r="2" ht="30" customHeight="1">${cellXml(sheet.subtitle || "", "A2", 2)}</row>`);
  rows.push(`<row r="3" ht="8" customHeight="1"></row>`);
  rows.push(`<row r="4" ht="36" customHeight="1">${headers.map((header, index) => cellXml(header, `${columnName(index)}4`, 3)).join("")}</row>`);

  const body = sheet.rows.length ? sheet.rows : [{ Informação: "Nenhum registro disponível." }];
  body.forEach((record, rowIndex) => {
    const excelRow = rowIndex + 5;
    const style = rowIndex % 2 ? 5 : 4;
    rows.push(`<row r="${excelRow}" ht="30" customHeight="1">${headers.map((header, columnIndex) => cellXml(record[header], `${columnName(columnIndex)}${excelRow}`, style)).join("")}</row>`);
  });

  const cols = headers.map((header, index) => `<col min="${index + 1}" max="${index + 1}" width="${widthFor(header, body)}" bestFit="1" customWidth="1"/>`).join("");
  const lastRow = Math.max(4, body.length + 4);
  const merges = lastColumn === "A"
    ? ""
    : `<mergeCells count="2"><mergeCell ref="A1:${lastColumn}1"/><mergeCell ref="A2:${lastColumn}2"/></mergeCells>`;
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <dimension ref="A1:${lastColumn}${lastRow}"/>
  <sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
  <sheetFormatPr defaultRowHeight="15"/>
  <cols>${cols}</cols>
  <sheetData>${rows.join("")}</sheetData>
  <autoFilter ref="A4:${lastColumn}${lastRow}"/>
  ${merges}
  <pageMargins left="0.25" right="0.25" top="0.5" bottom="0.5" header="0.2" footer="0.2"/>
  <pageSetup orientation="landscape" fitToWidth="1" fitToHeight="0"/>
</worksheet>`;
}

function stylesXml() {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="4">
    <font><sz val="11"/><name val="Arial"/><color rgb="FF2A211D"/></font>
    <font><b/><sz val="17"/><name val="Arial"/><color rgb="FFFFFFFF"/></font>
    <font><sz val="10"/><name val="Arial"/><color rgb="FF6B554A"/></font>
    <font><b/><sz val="10"/><name val="Arial"/><color rgb="FFFFFFFF"/></font>
  </fonts>
  <fills count="5">
    <fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF672614"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFF5E7D8"/><bgColor indexed="64"/></patternFill></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FFFFF8F0"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2"><border/><border><bottom style="thin"><color rgb="FFE8DDD5"/></bottom></border></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="6">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center"/></xf>
    <xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="3" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment horizontal="center" vertical="center" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
    <xf numFmtId="0" fontId="0" fillId="4" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>
  </cellXfs>
  <cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;
}

function createUniqueSheetName(rawName: string, index: number, usedNames: Set<string>) {
  const cleaned = sanitizeXmlText(rawName || `Planilha ${index + 1}`)
    .replace(/[\/*?:[\]]/g, " ")
    .trim() || `Planilha ${index + 1}`;
  let candidate = cleaned.slice(0, 31);
  let suffix = 2;
  while (usedNames.has(candidate.toLocaleLowerCase("pt-BR"))) {
    const marker = ` (${suffix})`;
    candidate = `${cleaned.slice(0, Math.max(1, 31 - marker.length))}${marker}`;
    suffix += 1;
  }
  usedNames.add(candidate.toLocaleLowerCase("pt-BR"));
  return candidate;
}

function buildWorkbookFiles(sheets: XlsxSheetDefinition[]) {
  const usedNames = new Set<string>();
  const safeSheets = (sheets.length ? sheets : [{ name: "Relatório", title: "Relatório", rows: [] }]).map((sheet, index) => ({
    ...sheet,
    name: createUniqueSheetName(sheet.name, index, usedNames),
  }));
  const sheetOverrides = safeSheets.map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join("");
  const workbookSheets = safeSheets.map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`).join("");
  const workbookRels = safeSheets.map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`).join("");
  const files: Array<{ name: string; content: string }> = [
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${sheetOverrides}</Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><workbookPr/><bookViews><workbookView activeTab="0"/></bookViews><sheets>${workbookSheets}</sheets><calcPr calcId="191029" fullCalcOnLoad="1"/></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${workbookRels}<Relationship Id="rId${safeSheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "xl/styles.xml", content: stylesXml() },
    ...safeSheets.map((sheet, index) => ({ name: `xl/worksheets/sheet${index + 1}.xml`, content: sheetXml(sheet) })),
  ];
  return files;
}

export async function buildXlsxBlob(sheets: XlsxSheetDefinition[]) {
  const files = buildWorkbookFiles(sheets);
  const zip = new JSZip();
  files.forEach(({ name, content }) => zip.file(name, content));

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 1 },
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    platform: "DOS",
  }) as Blob;

  // Reabre o pacote antes do download para garantir que o ZIP XLSX foi montado corretamente.
  await JSZip.loadAsync(blob);
  return blob;
}

export async function downloadXlsx(filename: string, sheets: XlsxSheetDefinition[]) {
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const blob = await buildXlsxBlob(sheets);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}
