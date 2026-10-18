// Shared CSV helpers with spreadsheet-formula neutralization.
export function csvCell(value: string | number) {
  let text = String(value);

  if (typeof value === "string" && /^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(rows: (string | number)[][]) {
  return `${rows.map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
