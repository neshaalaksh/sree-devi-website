# Sree Devi Hospital & Fertility Centre website

Static website built with [Eleventy](https://www.11ty.dev/) from the Figma design "healthcare (Copy)", hosted on GitHub Pages, with content edited through [Pages CMS](https://pagescms.org).

## How it fits together

```
Staff member ──edits──> Pages CMS (app.pagescms.org)
                           │ saves = git commit
                           ▼
                     GitHub repository ──push──> GitHub Actions builds the site ──> GitHub Pages (live in ~1 min)
```

There is no server or database to maintain. All content lives in this repository as plain files:

| What | File | CMS section |
| --- | --- | --- |
| Doctor profiles | `src/content/doctors/*.md` | Doctors |
| Women's health service areas | `src/content/services/*.md` | Service areas |
| Phone, WhatsApp, timings, notice banner, homepage text | `src/_data/settings.yml` | Hospital details & timings |
| FAQs | `src/_data/faqs.yml` | FAQs |
| YouTube videos (Blog) | `src/_data/videos.yml` | YouTube videos |
| Facility highlights and photo gallery | `src/_data/facilities.yml` | Facilities & gallery |
| Departments | `src/_data/departments.yml` | Departments |
| Diagnostics & hospital services | `src/_data/hospital_services.yml` | Diagnostics & hospital services |
| Fertility Centre page | `src/_data/fertility.yml` | Fertility Centre page |
| Written articles | `src/blog/posts/*.md` | Blog articles |
| Images | `src/assets/images/` | Media |

## Run locally

```bash
npm install
```

```bash
npm start
```

Opens a live-reloading preview at http://localhost:8080. `npm run build` writes the site to `_site/`.

## One-time setup

1. **Push this folder to a GitHub repository** (branch `main`).
2. **Turn on GitHub Pages:** repository Settings → Pages → Source: **GitHub Actions**. The workflow in `.github/workflows/deploy.yml` builds and publishes on every push to `main`.
3. **Custom domain:** in Settings → Pages, enter the domain and follow GitHub's DNS instructions. Also create `src/CNAME` containing just the domain (e.g. `www.sreedevihospital.in`) so it survives each deploy.
   The workflow detects the site's base path automatically, so links work both on `https://<user>.github.io/<repo>/` and on a custom domain.
4. **Give the staff member access:**
   - They create a free GitHub account.
   - Add them as a collaborator with **Write** access (Settings → Collaborators).
   - They sign in at https://app.pagescms.org with GitHub and open this repository. The editing forms come from `.pages.yml`.
   - `/admin/` on the website redirects to Pages CMS for convenience.

## For the staff member: common edits

- **Change timings or a phone number:** Hospital details & timings → Timings / Phone. Save.
- **Show a notice** (holiday closure, new doctor): Hospital details & timings → Notice banner → tick *Show the banner*, type the text, Save. Untick to remove.
- **Add a doctor:** Doctors → Add entry. Fill in the form, upload a portrait photo, set *Display order*. Save.
- **Hide a doctor without deleting:** untick *Show on website*.
- **Add a YouTube video:** YouTube videos → add item, paste the link, pick a category. The newest go first.
- **Add facility photos:** Facilities & gallery → Gallery photos → choose the photo for each item.
- Wrap a word in `*asterisks*` in headings to show it in the italic plum style, e.g. `Your health is our *motive*`.

Changes are live about a minute after saving. If something looks wrong, every save is a git commit, so any change can be undone from the repository history.

## Content rules

- No fees or prices on the website (hospital's instruction).
- Factual, non-promotional tone (NMC guidelines): no guaranteed outcomes or "100% success" claims.
- Never show fetal sex determination; the PCPNDT notice stays on Scans & Diagnostics.

See `CONTENT-STATUS.md` for what is confirmed and what is still pending from the hospital.
