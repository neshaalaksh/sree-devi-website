import { load as yamlLoad } from "js-yaml";
import markdownIt from "markdown-it";
import { HtmlBasePlugin } from "@11ty/eleventy";

const md = markdownIt({ html: false, linkify: true, breaks: true });

const escapeHtml = (s = "") =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const byOrder = (a, b) => (a.data.order ?? 999) - (b.data.order ?? 999);

export default function (eleventyConfig) {
  eleventyConfig.addPlugin(HtmlBasePlugin);

  // YAML data files (edited through Pages CMS)
  eleventyConfig.addDataExtension("yml,yaml", (contents) => yamlLoad(contents));

  eleventyConfig.addPassthroughCopy("src/assets");
  eleventyConfig.addPassthroughCopy({ "src/CNAME": "CNAME" });
  eleventyConfig.addWatchTarget("src/assets/css/");

  // ---------- Collections ----------
  eleventyConfig.addCollection("doctors", (api) =>
    api
      .getFilteredByGlob("src/content/doctors/*.md")
      .filter((d) => d.data.published !== false)
      .sort(byOrder)
  );
  eleventyConfig.addCollection("services", (api) =>
    api
      .getFilteredByGlob("src/content/services/*.md")
      .filter((d) => d.data.published !== false)
      .sort(byOrder)
  );
  eleventyConfig.addCollection("articles", (api) =>
    api
      .getFilteredByGlob("src/blog/posts/*.md")
      .filter((d) => d.data.published !== false)
      .sort((a, b) => b.date - a.date)
  );

  // ---------- Filters ----------
  // "Your health is our *motive*" -> Your health is our <em>motive</em>
  eleventyConfig.addFilter("accent", (s) =>
    escapeHtml(s || "").replace(/\*([^*]+)\*/g, "<em>$1</em>")
  );
  eleventyConfig.addFilter("md", (s) => md.render(s || ""));
  eleventyConfig.addFilter("mdInline", (s) => md.renderInline(s || ""));
  eleventyConfig.addFilter("tel", (s) => "tel:+" + String(s || "").replace(/\D/g, ""));
  eleventyConfig.addFilter("wa", (s) => "https://wa.me/" + String(s || "").replace(/\D/g, ""));
  eleventyConfig.addFilter("mailto", (s) => "mailto:" + (s || ""));
  eleventyConfig.addFilter("initials", (name = "") =>
    name
      .replace(/^Dr\.?\s*/i, "")
      .split(/[\s.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join("")
  );
  eleventyConfig.addFilter("youtubeId", (url = "") => {
    const m = String(url).match(
      /(?:youtu\.be\/|v=|\/embed\/|\/shorts\/|\/live\/)([A-Za-z0-9_-]{11})/
    );
    return m ? m[1] : "";
  });
  eleventyConfig.addFilter("where", (arr = [], key, val) =>
    (arr || []).filter((x) => {
      const v = key.split(".").reduce((o, k) => (o ? o[k] : undefined), x);
      return Array.isArray(v) ? v.includes(val) : v === val;
    })
  );
  eleventyConfig.addFilter("published", (arr = []) =>
    (arr || []).filter((x) => x && x.published !== false)
  );
  eleventyConfig.addFilter("limit", (arr = [], n) => (arr || []).slice(0, n));
  eleventyConfig.addFilter("uniqueBy", (arr = [], key) => {
    const seen = new Set();
    const out = [];
    for (const x of arr || []) {
      const v = key.split(".").reduce((o, k) => (o ? o[k] : undefined), x);
      if (v && !seen.has(v)) {
        seen.add(v);
        out.push(v);
      }
    }
    return out;
  });
  eleventyConfig.addFilter("slug2", (s = "") =>
    String(s).toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")
  );
  eleventyConfig.addFilter("readableDate", (d) => {
    if (!d) return "";
    const date = d instanceof Date ? d : new Date(d);
    return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  });
  eleventyConfig.addFilter("isoDate", (d) => (d ? new Date(d).toISOString().slice(0, 10) : ""));
  eleventyConfig.addFilter("year", () => new Date().getFullYear());
  eleventyConfig.addFilter("compact", (arr = []) => (arr || []).filter((x) => x && String(x).trim()));

  return {
    dir: { input: "src", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["njk", "md", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: process.env.PATH_PREFIX || "/",
  };
}
