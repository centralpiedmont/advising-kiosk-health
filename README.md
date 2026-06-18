# CPCC Health Sciences Degree Explorer Kiosk

An offline-first touchscreen web app for exploring Central Piedmont's 16 Health Sciences
degree and diploma programs. Runs on a Raspberry Pi via balenaCloud at recruitment events
(open houses, advising days, career fairs). A fork of the IT kiosk (`../kiosk/`) — same
engine, Health Sciences content.

Students walk through a guided "Find Your Path" funnel — interest world → program →
program detail — and land on a card with three convert actions:

- **QR degree sheet** — scan with your own phone to get the PDF (no venue Wi-Fi needed)
- **Sign up for an info session** — QR to the CPCC Health Programs Info Fair page
- **Email this** — on-screen keyboard captures email, queued in outbox, delivered when the Pi is back online

There is also a **"How to get in"** screen reachable from the program detail card. It shows
program-specific admissions requirements (GPA, testing, healthcare experience, competitive
ranking, apply deadline, and a QR to the online application) pulled from `admissions.json`.

---

## The 16 programs and 6 worlds

The first-tap "worlds" (interest funnel) map to programs. Colors per the Central Piedmont
brand (Gray/Gold dominant, Blue accent, Purple as the ≤10% accent — here Dental & Vision;
dark text on gold, white elsewhere):

| World | Color | Programs |
|---|---|---|
| Nursing &amp; Bedside Care | Blue `#005D83` | Nursing (ADN), Practical Nursing, Nurse Aide |
| Therapy &amp; Rehabilitation | Gray `#54565A` | Physical Therapist Assistant, Occupational Therapy Assistant |
| Surgery &amp; Critical Care | Gold `#B4A269` | Surgical Technology, Respiratory Therapy, Cardiovascular Technology, Polysomnography |
| Labs, Meds &amp; Diagnostics | Gray `#54565A` | Medical Laboratory Technology, Pharmacy Technology |
| Dental &amp; Vision Care | Purple `#672666` | Dental Hygiene, Dental Assisting, Ophthalmic Medical Personnel |
| Emergency &amp; Clinic Support | Blue `#005D83` | Emergency Medical Science, Medical Assisting |

---

## Data flow

| Source | What it provides |
|---|---|
| `../build/sheets-health.json` | Program data (titles, overviews, courses, credits) — scraped from the CPCC catalog |
| `careers.json` | BLS OEWS salary data per program (see `meta` block for vintage/method) |
| `admissions.json` | Per-program admissions requirements: GPA, testing, experience, deadline, applyUrl |
| `world-map.js` | The 6-world taxonomy |
| `quiz.json` | The "What's your Health Sciences calling?" quiz (answers → worlds → archetypes) |
| `ce.json` | Continuing Education catalog — **ships empty**, so the CE section self-hides |

`node generate.js` reads these, produces `public/kiosk-data.json`, and copies hero photos,
logos, and QR PNGs into `public/assets/`. `node gen-qr.js` generates the QR PNGs —
one degree-sheet QR per program, one info-session QR, and one apply QR per program that
has an `applyUrl` in `admissions.json`.

`scrape-catalog.mjs` records how `sheets-health.json` was produced and how to refresh it.

---

## Commands

```bash
npm install            # qrcode, nodemailer
npm run build          # node gen-qr.js && node generate.js
npm start              # dev server → http://localhost:8080
npm test               # node:test suites — 60 tests across engine + content
```

Re-run `npm run build` whenever `../build/sheets-health.json`, `admissions.json`,
`careers.json`, `world-map.js`, or `quiz.json` changes.

---

## Degree-sheet PDFs (the QR targets)

The program QR codes encode `https://frazier-at-cpcc.github.io/cpcc-it-degree-sheets/health/<id>.pdf`.
Generate and publish those PDFs from the print pipeline in `../build/`:

```bash
cd ../build
node generate-health.js
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --disable-gpu \
  --no-pdf-header-footer --allow-file-access-from-files \
  --print-to-pdf=booklet-health.pdf --virtual-time-budget=10000 "file://$PWD/booklet-health.html"
mkdir -p health && pdfseparate booklet-health.pdf health/page-%02d.pdf
node -e 'const fs=require("fs");for(const e of JSON.parse(fs.readFileSync("manifest-health.json")))fs.copyFileSync(`health/page-${String(e.page).padStart(2,"0")}.pdf`,`health/${e.id}.pdf`)'
rm -f health/page-*.pdf
```

Then publish `build/health/*.pdf` to the GitHub Pages `health/` path on the
`frazier-at-cpcc/cpcc-it-degree-sheets` repository. **Scan-test one QR before the event**
to confirm the URL resolves.

> **Open item (owner action):** The `health/` PDFs must be committed and pushed to the
> `frazier-at-cpcc/cpcc-it-degree-sheets` GitHub Pages repo before the event so the
> degree-sheet QRs resolve. The print pipeline and QR generation are ready; this is a
> publish step.

---

## Admissions data (`admissions.json`)

Each program entry carries:

```json
{
  "nursing-adn": {
    "gpa": "2.8 cumulative GPA",
    "testing": "TEAS (ATI) — minimum composite 60%",
    "experience": "Current CNA or healthcare experience preferred",
    "ranking": "Competitive ranking — limited seats",
    "deadline": "February 1 (Fall entry)",
    "applyUrl": "https://admissions.cpcc.edu/apply/"
  }
}
```

Programs with an `applyUrl` get a QR code (`assets/qr/apply-<id>.png`) on the "How to get
in" screen so students can scan and start the application on their own device.

Edit `admissions.json` directly to update requirements before each enrollment cycle, then
re-run `npm run build`.

---

## Refresh workflow (catalog data)

When CPCC publishes a new catalog, refresh `../build/sheets-health.json`:

1. Open `scrape-catalog.mjs` and follow the annotated procedure — it records the
   catalog fetch calls and plan-of-study term mapping for each of the 16 programs.
2. Run the relevant steps in `scrape-catalog.mjs` to produce an updated
   `../build/sheets-health.json`.
3. Validate: `npm test` (the `sheets-health.test.js` suite enforces all 16 programs
   are present with required fields).
4. Update `admissions.json` with any new requirements for that cycle.
5. Rebuild and re-deploy:
   ```bash
   npm run build
   git add ../build/sheets-health.json admissions.json public/kiosk-data.json public/assets/
   git commit -m "chore: refresh Health Sciences catalog data"
   git push
   ```
   Balena pulls the updated image automatically on the next `balena push`.

---

## Environment variables

Same as the IT kiosk — set on the balena fleet (or a local `.env`):
`PORT` (8080), `KIOSK_DATA_DIR`, `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` (email drain;
when `SMTP_HOST` is unset, leads queue safely in `data/outbox.jsonl`), `MAIL_FROM`.

---

## balena deploy

Fleet name: **`cpcc-health-kiosk`** (separate from the IT and Business kiosk fleets).

```bash
balena fleet create cpcc-health-kiosk --type raspberrypi4-64
# set SMTP_* + MAIL_FROM on the fleet, then:
cd kiosk-health && balena push cpcc-health-kiosk
```

Two containers (Node `kiosk` + `balenalabs/browser` Chromium block at `http://kiosk:8080`),
same as the IT kiosk. See `../kiosk/README.md` for provisioning and lead-retrieval details.

---

## Open items (owner action required before event)

1. **Degree-sheet PDFs on GitHub Pages** — publish `build/health/*.pdf` to the
   `frazier-at-cpcc/cpcc-it-degree-sheets` repo under the `health/` path so the program
   QR codes resolve. The print pipeline (`../build/generate-health.js`) is ready.

2. **Health Programs Info Fair URL** — the info-session QR currently points at
   `https://www.cpcc.edu/events/health-programs-info-fair`. Confirm this URL is durable
   (persistent event page, not a single-year listing) before the event; update
   `INFO_SESSION_URL` in both `generate.js` and `gen-qr.js` if needed, then re-run
   `npm run build`.

---

## Design spec

`../docs/superpowers/specs/2026-06-17-health-sciences-kiosk-design.md`
