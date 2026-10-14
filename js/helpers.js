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
