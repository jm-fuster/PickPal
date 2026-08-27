/**
 * Tabla de correspondencia Figma <-> código.
 *
 * Une el volcado de variables de Figma (design/figma-tokens.snapshot.json) con
 * las custom properties reales de src/app/globals.css y escribe la tabla en
 * docs/token-map.md. Sale con código 1 si encuentra divergencias, así que sirve
 * de puerta antes de dar una pasada de Figma por cerrada.
 *
 *   node scripts/token-map.mjs           escribe docs/token-map.md
 *   node scripts/token-map.mjs --check   no escribe, solo informa y devuelve código
 *
 * PARA REGENERAR EL SNAPSHOT tras tocar Figma: pedir a Claude el volcado con
 * figma_execute sobre "PickPal - Design System" resolviendo la cadena de alias
 * de cada variable a un valor concreto en Light y Dark, con su codeSyntax.WEB.
 * El snapshot es derivado: no se edita a mano.
 *
 * Lo que este script NO hace, a propósito: generar CSS desde Figma. Solo 67 de
 * las 373 variables tienen contraparte en código, y las otras 306 no deben
 * tenerla. Un generador aplanaría el criterio; esto solo informa de dónde los
 * dos lados dicen cosas distintas.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SNAPSHOT = join(ROOT, "design/figma-tokens.snapshot.json");
const KNOWN = join(ROOT, "design/token-divergences.json");
const GLOBALS = join(ROOT, "src/app/globals.css");
const TAILWIND = join(ROOT, "node_modules/tailwindcss/theme.css");
const OUT = join(ROOT, "docs/token-map.md");

const checkOnly = process.argv.includes("--check");

// ---------------------------------------------------------------- color: oklch -> hex
// Conversión exacta OKLab<->sRGB de Björn Ottosson, la misma que se usó para
// generar las rampas en Figma. Sin ella no se pueden comparar los dos lados:
// el CSS habla oklch y Figma devuelve hex.

const gamma = (c) => (c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

function oklchToHex(L, C, Hdeg, alpha) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const rgb = [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map((v) => {
    const g = gamma(v);
    return Math.max(0, Math.min(255, Math.round(g * 255)));
  });

  const hex = "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
  return alpha !== undefined && alpha < 1
    ? `${hex}/${Math.round(alpha * 1000) / 10}`
    : hex;
}

function parseOklch(raw) {
  const m = /^oklch\(\s*([\d.]+%?)\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+%?)\s*)?\)$/.exec(raw);
  if (!m) return null;
  const pct = (s) => (s.endsWith("%") ? parseFloat(s) / 100 : parseFloat(s));
  return oklchToHex(pct(m[1]), parseFloat(m[2]), parseFloat(m[3]), m[4] ? pct(m[4]) : undefined);
}

// ---------------------------------------------------------------- normalización de valores
// Devuelve { kind, value } donde kind es:
//   color  -> hex comparable
//   px     -> número en píxeles
//   num    -> número adimensional (ratios, pesos, tracking en em)
//   ref    -> var(...) sin resolver: comparable por nombre, no por valor
//   off    -> initial / desactivado a propósito
//   raw    -> no se pudo normalizar (calc, etc.)

function normalize(raw) {
  if (raw === undefined || raw === null) return { kind: "missing" };
  const v = String(raw).trim().replace(/;$/, "");

  if (v === "initial") return { kind: "off", value: "initial" };
  if (v.startsWith("var(")) return { kind: "ref", value: v };
  if (v.startsWith("calc(")) return { kind: "raw", value: v };

  if (v.startsWith("oklch(")) {
    const hex = parseOklch(v);
    return hex ? { kind: "color", value: hex } : { kind: "raw", value: v };
  }
  if (/^#[0-9a-f]{6}$/i.test(v)) return { kind: "color", value: v.toLowerCase() };

  let m = /^(-?[\d.]+)rem$/.exec(v);
  if (m) return { kind: "px", value: parseFloat(m[1]) * 16 };
  m = /^(-?[\d.]+)px$/.exec(v);
  if (m) return { kind: "px", value: parseFloat(m[1]) };
  m = /^(-?[\d.]+)em$/.exec(v);
  if (m) return { kind: "num", value: parseFloat(m[1]) };
  if (/^-?[\d.]+$/.test(v)) return { kind: "num", value: parseFloat(v) };

  return { kind: "raw", value: v };
}

// Figma: números en px para tamaños, hex (con /alpha) para color.
function normalizeFigma(raw) {
  if (typeof raw === "number") return { kind: "figmaNum", value: raw };
  const v = String(raw);
  if (v.startsWith("#")) return { kind: "color", value: v.toLowerCase() };
  return { kind: "raw", value: v };
}

// ---------------------------------------------------------------- comparación
const hexParts = (h) => {
  const [rgb, a] = h.split("/");
  return {
    r: parseInt(rgb.slice(1, 3), 16),
    g: parseInt(rgb.slice(3, 5), 16),
    b: parseInt(rgb.slice(5, 7), 16),
    a: a === undefined ? 100 : parseFloat(a),
  };
};

/** ok | rounding | diff | n/a  — 'rounding' absorbe el ±1 por canal del ida y vuelta oklch/hex. */
function compare(css, figma) {
  if (css.kind === "missing") return { verdict: "n/a", note: "no declarado en CSS" };
  if (css.kind === "off") return { verdict: "n/a", note: "desactivado (initial)" };
  if (css.kind === "ref") return { verdict: "n/a", note: "referencia sin resolver" };
  if (css.kind === "raw" || figma.kind === "raw") return { verdict: "n/a", note: "no comparable" };

  if (css.kind === "color" && figma.kind === "color") {
    const a = hexParts(css.value);
    const b = hexParts(figma.value);
    const dc = Math.max(Math.abs(a.r - b.r), Math.abs(a.g - b.g), Math.abs(a.b - b.b));
    const da = Math.abs(a.a - b.a);
    if (dc === 0 && da < 0.01) return { verdict: "ok" };
    if (dc <= 1 && da <= 0.5) return { verdict: "rounding", note: `Δ canal ${dc}` };
    return { verdict: "diff", note: dc > 1 ? `Δ canal ${dc}` : `Δ alfa ${da.toFixed(2)}pp` };
  }

  const cv = css.value;
  const fv = figma.value;
  if (typeof cv === "number" && typeof fv === "number") {
    if (Math.abs(cv - fv) < 1e-6) return { verdict: "ok" };
    return { verdict: "diff", note: `código ${cv} · Figma ${fv}` };
  }
  return { verdict: "n/a", note: "tipos distintos" };
}

// ---------------------------------------------------------------- lectura del CSS
/** Extrae las declaraciones de un bloque por su selector, respetando el anidamiento. */
function block(css, selector) {
  const out = new Map();
  const start = css.indexOf(selector + " {");
  if (start === -1) return out;
  let i = css.indexOf("{", start) + 1;
  let depth = 1;
  let body = "";
  while (i < css.length && depth > 0) {
    const ch = css[i];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
    if (depth > 0) body += ch;
    i++;
  }
  // Fuera comentarios antes de trocear.
  body = body.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const decl of body.split(";")) {
    const m = /^\s*(--[\w-]+)\s*:\s*([^;]+)$/.exec(decl);
    if (m) out.set(m[1], m[2].trim());
  }
  return out;
}

const globalsCss = readFileSync(GLOBALS, "utf8");
const tailwindCss = readFileSync(TAILWIND, "utf8");

const cssRoot = block(globalsCss, ":root");
const cssDark = block(globalsCss, ".dark");
const cssThemeInline = block(globalsCss, "@theme inline");
// El segundo @theme (sin inline) — block() encuentra el primero que coincide,
// y "@theme inline {" no coincide con "@theme {", así que esto es el correcto.
const cssTheme = block(globalsCss, "@theme");
const twTheme = block(tailwindCss, "@theme");

/** De dónde sale el valor de una custom property, en orden de precedencia. */
function lookup(prop, mode) {
  if (mode === "dark" && cssDark.has(prop)) return { raw: cssDark.get(prop), src: ".dark" };
  if (cssRoot.has(prop)) return { raw: cssRoot.get(prop), src: ":root" };
  if (cssTheme.has(prop)) return { raw: cssTheme.get(prop), src: "@theme" };
  if (cssThemeInline.has(prop)) return { raw: cssThemeInline.get(prop), src: "@theme inline" };
  if (twTheme.has(prop)) return { raw: twTheme.get(prop), src: "Tailwind" };
  return { raw: undefined, src: "—" };
}

// ---------------------------------------------------------------- unir
const snap = JSON.parse(readFileSync(SNAPSHOT, "utf8"));

const rows = snap.mapped.map(([figma, collection, css, light, dark]) => {
  const cl = lookup(css, "light");
  const cd = lookup(css, "dark");
  const nl = normalize(cl.raw);
  const nd = normalize(cd.raw);
  const fl = normalizeFigma(light);
  const fd = normalizeFigma(dark);
  return {
    figma, collection, css,
    light: { figma: fl, css: nl, src: cl.src, raw: cl.raw, cmp: compare(nl, fl) },
    dark: { figma: fd, css: nd, src: cd.src, raw: cd.raw, cmp: compare(nd, fd) },
  };
});

// Conflictos: varias variables de Figma apuntando a la misma prop con valores distintos.
const byProp = new Map();
for (const [figma, , css, light, dark] of snap.mapped) {
  if (!byProp.has(css)) byProp.set(css, []);
  byProp.get(css).push({ figma, light, dark });
}
const conflicts = [];
for (const [css, list] of byProp) {
  if (list.length < 2) continue;
  const lights = new Set(list.map((x) => String(x.light)));
  const darks = new Set(list.map((x) => String(x.dark)));
  if (lights.size > 1 || darks.size > 1) {
    conflicts.push({ css, list, modes: [lights.size > 1 && "Light", darks.size > 1 && "Dark"].filter(Boolean) });
  }
}

// Solo-código: props declaradas en :root/.dark que ninguna variable de Figma reclama.
const claimed = new Set(snap.mapped.map((r) => r[2]));
const codeOnly = [...new Set([...cssRoot.keys(), ...cssDark.keys()])]
  .filter((p) => !claimed.has(p))
  .sort();
// Y las escalas propias del @theme que tampoco tienen dueño en Figma.
const themeOnly = [...cssTheme.keys()]
  .filter((p) => !claimed.has(p) && !p.includes("--line-height"))
  .sort();

const roundings = rows.filter(
  (r) => r.light.cmp.verdict === "rounding" || r.dark.cmp.verdict === "rounding",
);

// Divergencias, separadas en conocidas (declaradas en design/token-divergences.json)
// y nuevas. Solo las nuevas hacen fallar: si no, la puerta se queda en rojo para
// siempre y deja de informar de nada.
const known = new Map();
for (const d of JSON.parse(readFileSync(KNOWN, "utf8")).divergencias) {
  known.set(`${d.css}|${d.modo}`, d);
}
const usedKnown = new Set();

const divergences = [];
for (const r of rows) {
  for (const mode of ["light", "dark"]) {
    if (r[mode].cmp.verdict !== "diff") continue;
    const key = `${r.css}|${mode}`;
    const entry = known.get(key);
    if (entry) usedKnown.add(key);
    divergences.push({ row: r, mode, entry, inConflict: conflicts.some((c) => c.css === r.css) });
  }
}
const newDiv = divergences.filter((d) => !d.entry);
const knownDiv = divergences.filter((d) => d.entry);
// Entradas del registro que ya no corresponden a ninguna divergencia real: o se
// arregló y hay que borrarlas, o el nombre está mal escrito.
const staleKnown = [...known.keys()].filter((k) => !usedKnown.has(k));

// ---------------------------------------------------------------- salida
const ICON = { ok: "✅", rounding: "≈", diff: "❌", "n/a": "—" };
const show = (side) => {
  const f = side.figma.value;
  const c = side.css.kind === "missing" ? "—" : side.css.value;
  return `${f} / ${c}`;
};

// Los grupos de color se agrupan a dos niveles (`color/icon`, `color/Amber`): a uno
// solo, las 92 rampas y los 50 semánticos caen en una sola fila ilegible.
const groupOf = (name) => {
  const parts = name.split("/");
  return parts[0] === "color" && parts.length > 1 ? `${parts[0]}/${parts[1]}` : parts[0];
};
const countBy = (names) => {
  const m = new Map();
  for (const n of names) m.set(groupOf(n), (m.get(groupOf(n)) || 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1]);
};

let md = "";
const w = (s = "") => (md += s + "\n");

w("# Tabla de correspondencia Figma ↔ código");
w();
w("<!-- GENERADO por scripts/token-map.mjs. No editar a mano: se regenera. -->");
w();
w(`Figma: **${snap.meta.fileName}** · volcado del ${snap.meta.capturedAt} · ${snap.meta.total} variables.`);
w("Código: [`src/app/globals.css`](../src/app/globals.css).");
w();
w("Este documento responde a una sola pregunta: **¿dónde dicen Figma y el código cosas distintas?**");
w("No genera CSS desde Figma — solo 67 de las 373 variables tienen contraparte en código y las otras");
w("306 no deben tenerla, así que un generador aplanaría el criterio en vez de aplicarlo.");
w();
w("## Resumen");
w();
const agree = rows.filter(
  (r) => !["light", "dark"].some((m) => r[m].cmp.verdict === "diff" || r[m].cmp.verdict === "rounding"),
).length;

w("| | Nº |");
w("|---|---|");
w(`| Espejados (Figma ↔ código) | ${rows.length} |`);
w(`| … de acuerdo | ${agree} |`);
w(`| … iguales salvo redondeo oklch↔hex | ${roundings.length} |`);
w(`| … en divergencia **ya declarada** | ${knownDiv.length} |`);
w(`| … en divergencia **nueva, sin declarar** | ${newDiv.length} |`);
w(`| Props del código que varias variables de Figma reclaman con valores distintos | ${conflicts.length} |`);
w(`| Solo-código (sin variable en Figma) | ${codeOnly.length + themeOnly.length} |`);
w(`| Solo-Figma · capa Semantic (decisión pendiente) | ${snap.figmaOnly.Semantic.length} |`);
w(`| Solo-Figma · Primitives (por diseño: ocultos al publicar) | ${snap.figmaOnly.Primitives.length} |`);
w();

const divRow = (d) => {
  const side = d.row[d.mode];
  const tags = [d.inConflict && "ver conflicto"].filter(Boolean).join(" · ");
  return `| \`${d.row.figma}\` | \`${d.row.css}\` | ${d.mode === "light" ? "Light" : "Dark"} | ${side.figma.value} | ${side.css.value} | ${side.cmp.note}${tags ? ` (${tags})` : ""} |`;
};

if (newDiv.length) {
  w("## Divergencias nuevas");
  w();
  w("Sin declarar en [`design/token-divergences.json`](../design/token-divergences.json), así que");
  w("hacen fallar el script. Por cada una hay que decidir qué lado gana y anotarlo allí — o corregir");
  w("el código.");
  w();
  w("| Variable Figma | Custom property | Modo | Figma | Código | Delta |");
  w("|---|---|---|---|---|---|");
  for (const d of newDiv) w(divRow(d));
  w();
}

if (knownDiv.length) {
  w("## Divergencias ya declaradas");
  w();
  w("Desacuerdos vistos y anotados. No hacen fallar el script, pero siguen siendo trabajo.");
  w();
  w("| Custom property | Modo | Figma | Código | Estado | Qué hacer |");
  w("|---|---|---|---|---|---|");
  for (const d of knownDiv) {
    const side = d.row[d.mode];
    w(`| \`${d.row.css}\` | ${d.mode === "light" ? "Light" : "Dark"} | ${side.figma.value} | ${side.css.value} | ${d.entry.estado} · gana ${d.entry.gana} | ${d.entry.accion} |`);
  }
  w();
}

if (staleKnown.length) {
  w("## Entradas obsoletas del registro");
  w();
  w("Declaradas en `design/token-divergences.json` pero ya no divergen: o se arreglaron y toca");
  w("borrarlas, o el nombre de la prop está mal escrito.");
  w();
  for (const k of staleKnown) w(`- \`${k.replace("|", "\` en modo ")}\``);
  w();
}

if (conflicts.length) {
  w("## Una prop del código, varias variables de Figma que no coinciden");
  w();
  w("Figma distingue algo que el código no puede expresar con una sola propiedad.");
  w("Cada fila es un candidato a partirse en dos props, como se hizo con `--brand`.");
  w();
  for (const c of conflicts) {
    w(`**\`${c.css}\`** — discrepan en ${c.modes.join(" y ")}:`);
    w();
    w("| Variable Figma | Light | Dark |");
    w("|---|---|---|");
    for (const x of c.list) w(`| \`${x.figma}\` | ${x.light} | ${x.dark} |`);
    w();
  }
}

w("## Espejados");
w();
w("Las 67 variables de Figma con `codeSyntax.WEB` relleno, que es el puente que Figma trae de serie.");
w("Valores: `Figma / código`. `≈` = mismo color, ±1 por canal del ida y vuelta oklch↔hex.");
w();
w("| Variable Figma | Colección | Custom property | Origen del valor | Light | Dark |");
w("|---|---|---|---|---|---|");
for (const r of rows) {
  const src = r.light.src === r.dark.src ? r.light.src : `${r.light.src} / ${r.dark.src}`;
  w(`| \`${r.figma}\` | ${r.collection} | \`${r.css}\` | ${src} | ${ICON[r.light.cmp.verdict]} ${show(r.light)} | ${ICON[r.dark.cmp.verdict]} ${show(r.dark)} |`);
}
w();

w("## Solo-código");
w();
w("Custom properties reales sin ninguna variable de Figma que las reclame. Cada una es una");
w("decisión: o se crea la variable en Figma, o se documenta por qué el código va por delante.");
w();
if (codeOnly.length) {
  w("Capa de tokens (`:root` / `.dark`):");
  w();
  for (const p of codeOnly) {
    const l = lookup(p, "light");
    const d = lookup(p, "dark");
    const nl = normalize(l.raw);
    const nd = normalize(d.raw);
    w(`- \`${p}\` — Light \`${nl.value ?? "—"}\`${d.src === ".dark" ? ` · Dark \`${nd.value ?? "—"}\`` : ""}`);
  }
  w();
}
if (themeOnly.length) {
  w("Escalas propias en `@theme` sin variable equivalente:");
  w();
  for (const p of themeOnly) {
    const n = normalize(cssTheme.get(p));
    w(`- \`${p}\` — \`${n.kind === "off" ? "initial (desactivado)" : n.value}\``);
  }
  w();
}

w("## Solo-Figma");
w();
w(`### Capa Semantic — ${snap.figmaOnly.Semantic.length} variables sin contraparte`);
w();
w("Aquí está el trabajo pendiente de verdad: por cada una hay que decidir si merece una custom");
w("property, si el código ya lo resuelve con utilidades de Tailwind, o si es de uso exclusivo en Figma.");
w("Mientras no se decida, ni Figma ni el código están completos.");
w();
w("| Grupo | Nº | Variables |");
w("|---|---|---|");
for (const [g, n] of countBy(snap.figmaOnly.Semantic)) {
  const list = snap.figmaOnly.Semantic.filter((x) => groupOf(x) === g);
  w(`| \`${g}/\` | ${n} | ${list.map((x) => `\`${x}\``).join(", ")} |`);
}
w();
w(`### Primitives — ${snap.figmaOnly.Primitives.length} variables, y está bien así`);
w();
w("Los primitivos tienen scope vacío y están ocultos al publicar: no viajan a los archivos que");
w("consumen la librería y no deben aparecer en el CSS. El código consume la capa semántica, no la rampa.");
w("Los 9 `radius/*` que sí cruzan son la excepción documentada.");
w();
w("| Grupo | Nº |");
w("|---|---|");
for (const [g, n] of countBy(snap.figmaOnly.Primitives)) w(`| \`${g}/\` | ${n} |`);
w();
w("---");
w();
w("## Cómo se regenera");
w();
w("```bash");
w("node scripts/token-map.mjs");
w("```");
w();
w("Devuelve código 1 solo con divergencias **nuevas**, entradas obsoletas del registro o");
w("conflictos sin declarar — nunca por los desacuerdos ya anotados en");
w("[`design/token-divergences.json`](../design/token-divergences.json). Así sirve de puerta antes de");
w("dar por cerrada una pasada de Figma sin quedarse en rojo permanente, que es como una puerta");
w("deja de informar de nada.");
w();
w("El snapshot en `design/figma-tokens.snapshot.json` es derivado y se refresca desde Figma; las");
w("instrucciones están en la cabecera del script. `--check` informa sin reescribir el documento.");

// ---------------------------------------------------------------- informe
const summary = [
  `espejados: ${rows.length}`,
  `de acuerdo: ${agree}`,
  `redondeo: ${roundings.length}`,
  `divergencias nuevas: ${newDiv.length}`,
  `declaradas: ${knownDiv.length}`,
  `conflictos: ${conflicts.length}`,
  `solo-código: ${codeOnly.length + themeOnly.length}`,
  `solo-Figma: ${snap.figmaOnly.Semantic.length + snap.figmaOnly.Primitives.length}`,
].join(" · ");

if (!checkOnly) {
  writeFileSync(OUT, md, "utf8");
  console.log(`Escrito docs/token-map.md — ${summary}`);
} else {
  console.log(summary);
}

if (newDiv.length) {
  console.log("\nDivergencias NUEVAS (sin declarar):");
  for (const d of newDiv) {
    const side = d.row[d.mode];
    console.log(`  ${d.row.css} ${d.mode}: Figma ${side.figma.value} · código ${side.css.value} — ${side.cmp.note}`);
  }
}
if (knownDiv.length) {
  console.log("\nDivergencias declaradas (pendientes de aplicar):");
  for (const d of knownDiv) {
    console.log(`  ${d.row.css} ${d.mode}: ${d.entry.accion}`);
  }
}
if (staleKnown.length) {
  console.log("\nEntradas obsoletas del registro (ya no divergen):");
  for (const k of staleKnown) console.log(`  ${k}`);
}
if (conflicts.length) {
  console.log("\nProps reclamadas por variables de Figma que no coinciden:");
  for (const c of conflicts) {
    console.log(`  ${c.css} (${c.modes.join(", ")}): ${c.list.map((x) => x.figma).join(" vs ")}`);
  }
}

// Solo lo no declarado rompe. Los conflictos declarados en el registro tampoco.
const undeclaredConflicts = conflicts.filter(
  (c) => !["light", "dark"].some((m) => known.has(`${c.css}|${m}`)),
);
process.exit(newDiv.length || staleKnown.length || undeclaredConflicts.length ? 1 : 0);
