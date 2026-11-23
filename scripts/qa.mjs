// Site quality checks. Run after a build: `npm run qa` (or `npm run check` to build and check).
// Reads the generated _site folder, so it catches problems from templates, CMS data and content files alike.
// Exit code 1 if any ERROR is found; WARN lines are advisory.

import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import { load as yamlLoad } from "js-yaml";

const SITE = "_site";
const settings = yamlLoad(readFileSync("src/_data/settings.yml", "utf8"));

const errors = [];
const warns = [];
const err = (file, msg) => errors.push(`ERROR ${file}: ${msg}`);
const warn = (file, msg) => warns.push(`WARN  ${file}: ${msg}`);

// ---------- helpers ----------
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });

const pages = walk(SITE).filter((f) => f.endsWith(".html") && !f.includes(`${SITE}/admin/`));

const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<template[\s\S]*?<\/template>/gi, (m) => m.replace(/<[^>]+>/g, " ")) // template text is still published
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&rsquo;/g, "'")
    .replace(/\s+/g, " ");

const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*"([^"]*)"`, "i"));
  return m ? m[1] : null;
};

const digits = (s) => String(s || "").replace(/\D/g, "").replace(/^0+/, "");

// ---------- rules ----------
// Wording restricted by the NMC Guidelines on Ethical Advertising (6 Oct 2026) and project rules.
const BANNED = [
  [/\bbest\b/i, "superlative \"best\""],
  [/\bno\.?\s?1\b|\bnumber one\b|#1\b/i, "ranking claim"],
  [/\b100\s?%/i, "\"100%\" claim"],
  [/\bpainless\b/i, "\"painless\" claim"],
  [/\bguarantee/i, "guarantee claim"],
  [/\bsuccess rates?\b/i, "success-rate claim"],
  [/\bmiracle\b/i, "\"miracle\" claim"],
  [/\baffordable\b/i, "\"affordable\" claim"],
  [/\bstate[- ]of[- ]the[- ]art\b|\bworld[- ]class\b|\bmost trusted\b|\bunmatched\b/i, "superiority claim"],
  [/\b\d{1,3}(,\d{3})+\+?\s+(deliveries|surgeries|patients|babies)\b|\bmore than \d+ (deliveries|surgeries|patients)\b/i, "patient or procedure count"],
  [/\b10\s?(am|a\.m\.)\s?(to|-|–)\s?1\s?(pm|p\.m\.)/i, "fixed OPD timings (OPD timings are not fixed)"],
  [/—/, "em dash (house style: none)"],
];

const allowedPhones = new Set(
  Object.values(settings.contact || {})
    .map(digits)
    .filter((v) => v.length >= 8)
);

const titles = new Map();
const descriptions = new Map();
const indexable = [];

for (const file of pages) {
  const rel = "/" + relative(SITE, file).replace(/index\.html$/, "");
  const html = readFileSync(file, "utf8");
  const text = visibleText(html);
  const noindex = /<meta name="robots" content="[^"]*noindex/i.test(html);

  // Banned wording
  for (const [re, label] of BANNED) {
    const m = text.match(re);
    if (m) {
      const i = text.search(re);
      err(rel, `${label}: "...${text.slice(Math.max(0, i - 40), i + 50).trim()}..."`);
    }
  }

  // Phone numbers must come from settings.yml
  for (const m of html.matchAll(/href="tel:([^"]+)"|href="https:\/\/wa\.me\/(\d+)"/g)) {
    const num = digits(m[1] || m[2]);
    const matches = [...allowedPhones].some((p) => num.endsWith(p) || p.endsWith(num));
    if (!matches) err(rel, `phone ${m[1] || m[2]} is not in settings.yml contact numbers`);
  }

  // Head
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1]?.trim();
  const desc = attr((html.match(/<meta name="description"[^>]*>/i) || [""])[0], "content");
  if (!title) err(rel, "missing <title>");
  if (!desc) err(rel, "missing meta description");
  if (!noindex) {
    indexable.push(rel);
    if (!/<link rel="canonical" href="https:\/\//.test(html)) err(rel, "missing absolute canonical");
    if (title) titles.set(title, [...(titles.get(title) || []), rel]);
    if (desc) descriptions.set(desc, [...(descriptions.get(desc) || []), rel]);
    if (title && title.length > 70) warn(rel, `title is ${title.length} characters (aim for 60 or fewer)`);
    if (desc && (desc.length < 70 || desc.length > 170)) warn(rel, `meta description is ${desc.length} characters (aim for 120 to 160)`);
  }
  const og = attr((html.match(/<meta property="og:image"[^>]*>/i) || [""])[0], "content");
  if (!og || !og.startsWith("https://")) err(rel, "og:image must be an absolute https URL");

  // Headings
  const h1s = html.match(/<h1[\s>]/gi) || [];
  if (h1s.length !== 1) err(rel, `${h1s.length} <h1> elements (expected 1)`);
  const outsideTemplates = html.replace(/<template[\s\S]*?<\/template>/gi, "");
  for (const m of outsideTemplates.matchAll(/<(h[1-6])[^>]*>([\s\S]*?)<\/\1>/gi)) {
    if (!m[2].replace(/<[^>]+>/g, "").trim()) warn(rel, `empty <${m[1]}>`);
  }

  // Images
  for (const m of html.matchAll(/<img\b[^>]*>/gi)) {
    if (attr(m[0], "alt") === null) err(rel, `image without alt attribute: ${attr(m[0], "src")}`);
  }

  // Internal links
  for (const m of html.matchAll(/\shref="(\/[^"#?]*)/g)) {
    const target = m[1];
    if (target.startsWith("//")) continue;
    const path = join(SITE, target);
    const ok =
      existsSync(path) && statSync(path).isFile()
        ? true
        : existsSync(join(path, "index.html"));
    if (!ok) err(rel, `broken internal link ${target}`);
  }

  // Structured data
  for (const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi)) {
    try {
      JSON.parse(m[1]);
    } catch (e) {
      err(rel, `invalid JSON-LD: ${e.message}`);
    }
  }

  // hreflang must be reciprocal
  for (const m of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)) {
    const [, lang, href] = m;
    if (lang === "x-default") continue;
    const url = new URL(href);
    const targetFile = join(SITE, url.pathname, url.pathname.endsWith("/") ? "index.html" : "");
    if (!existsSync(targetFile)) {
      err(rel, `hreflang ${lang} points to missing page ${url.pathname}`);
      continue;
    }
    const back = readFileSync(targetFile, "utf8");
    const self = settings.site_url + rel;
    if (!back.includes(`href="${self}"`)) err(rel, `hreflang ${lang} page ${url.pathname} does not link back`);
  }
}

for (const [t, list] of titles) if (list.length > 1) err(list.join(", "), `duplicate title "${t}"`);
for (const [d, list] of descriptions) if (list.length > 1) err(list.join(", "), `duplicate meta description`);

// Site files
if (!existsSync(join(SITE, "robots.txt"))) err("/robots.txt", "missing");
if (!existsSync(join(SITE, "sitemap.xml"))) err("/sitemap.xml", "missing");
else {
  const sm = readFileSync(join(SITE, "sitemap.xml"), "utf8");
  const locs = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => new URL(m[1]).pathname);
  for (const p of locs) if (!indexable.includes(p)) err("/sitemap.xml", `lists ${p}, which is missing or noindex`);
  for (const p of indexable) if (!locs.includes(p)) err("/sitemap.xml", `does not list indexable page ${p}`);
}

const uniq = (a) => [...new Set(a)];
console.log(uniq(warns).join("\n"));
console.log(uniq(errors).join("\n"));
console.log(`\n${pages.length} pages checked: ${new Set(errors).size} errors, ${new Set(warns).size} warnings.`);
process.exit(errors.length ? 1 : 0);
