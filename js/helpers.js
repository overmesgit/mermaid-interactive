// Helpers a content file may call. They load before the content file, so every explanation can use them.

function arrow(from, to, tooltip, body, facts, more) {
  return { from, to, kicker: "Arrow", tooltip, body, facts: facts || [], ...(more || {}) };
}

function md(strings, ...values) {
  const text = strings.reduce((acc, part, i) => acc + part + (values[i] ?? ""), "");
  const rows = text.replace(/^\n/, "").replace(/\n\s*$/, "").split("\n");
  const widths = rows.filter((row) => row.trim()).map((row) => row.match(/^ */)[0].length);
  const indent = widths.length ? Math.min(...widths) : 0;
  return rows.map((row) => row.slice(indent)).join("\n").trim();
}

// A packed content file ends with one packFile() call per file its notes name: the whole file, gzip and base64.
// So the content file alone carries its code, wherever it is opened.
const packedFiles = new Map();

function packFile(path, base64) {
  packedFiles.set(path, base64);
}
