// Placeholder articles and videos for previewing the Blog layout.
// Shown only while settings.blog_preview is true and no real articles or videos exist.
const lorem = "Placeholder text. The full article from our doctors will appear here soon.";
const art = (title, category, date, excerpt = lorem) => ({
  url: "#",
  date: new Date(date),
  data: { title, category, excerpt, author: "Sree Devi Care Team", placeholder: true },
});
export default {
  articles: [
    art("How long to try before seeing a fertility doctor", "Fertility", "2026-11-20", "When to seek a fertility evaluation, and what the first visit involves. " + lorem),
    art("IUI and IVF: how the two treatments differ", "Fertility", "2026-11-12"),
    art("Pregnancy scans, month by month", "Pregnancy & Delivery", "2026-11-04"),
    art("Normal delivery and caesarean: what to discuss with your doctor", "Pregnancy & Delivery", "2026-10-27"),
    art("PCOS: common signs and how it is managed", "Gynaecology", "2026-10-18"),
    art("What to bring to your first consultation", "General Health", "2026-10-09"),
  ],
  videos: [
    { title: "Your first fertility consultation: what to expect", category: "Fertility" },
    { title: "Staying active during pregnancy", category: "Pregnancy & Delivery" },
    { title: "Understanding your scan report", category: "Scans & Diagnostics" },
    { title: "Period problems that need a doctor's visit", category: "Gynaecology" },
  ],
};
