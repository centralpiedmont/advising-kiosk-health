// scrape-catalog.mjs — how build/sheets-health.json was produced, and how to refresh it.
//
// The 16 Health Sciences programs are pulled from the PUBLIC catalog (catalog.cpcc.edu;
// nextcatalog.cpcc.edu is behind Microsoft Entra SSO and cannot be fetched anonymously).
// This file is a runnable RECORD of the procedure, not an automated scraper: the plan-of-
// study term mapping needs a human/agent eye, and the result is hand-validated against
// kiosk-health/test/sheets-health.test.js.
//
// Programs (id → catalog code → world family). family is a free label used only for the
// print sheet; the kiosk grouping comes from world-map.js, not from family.
export const PROGRAMS = [
  { id: 'nursing-adn',                    code: 'A45110',  family: 'nursing' },
  { id: 'practical-nursing',              code: 'D45660',  family: 'nursing' },
  { id: 'nurse-aide',                     code: 'C45970',  family: 'nursing' },
  { id: 'physical-therapist-assistant',   code: 'A45640',  family: 'therapy' },
  { id: 'occupational-therapy-assistant', code: 'A45500',  family: 'therapy' },
  { id: 'surgical-technology',            code: 'A45740',  family: 'surgery' },
  { id: 'respiratory-therapy',            code: 'A45720',  family: 'surgery' },
  { id: 'cardiovascular-technology',      code: 'A45170',  family: 'surgery' },
  { id: 'polysomnography',                code: 'A45670',  family: 'surgery' },
  { id: 'medical-laboratory-technology',  code: 'A45420',  family: 'labs' },
  { id: 'pharmacy-technology',            code: 'A45580',  family: 'labs' },
  { id: 'dental-hygiene',                 code: 'A45260',  family: 'dentalvision' },
  { id: 'dental-assisting',               code: 'D45240',  family: 'dentalvision' }, // Diploma; no AAS track exists
  { id: 'ophthalmic-medical',             code: 'A45210',  family: 'dentalvision' },
  { id: 'emergency-medical-science',      code: 'A45340',  family: 'emergency' },
  { id: 'medical-assisting',              code: 'A45400',  family: 'emergency' },
];
//
// NOTE on dental-assisting: no AAS exists for Dental Assisting at CPCC. The program is a
// Diploma (D45240), which is the confirmed live code. The JSON uses D45240.
//
// NOTE on nurse-aide: C45970 is a 12-credit certificate (NAS 101 + NAS 102). There is no
// AAS track. This means nurse-aide fails the test's 40–80 credit-hour range check.
// The concern is logged in task-3-report.md; a design decision is needed before Task 11.
//
// EXTRACTION PROCEDURE (per program), via WebFetch tool against catalog.cpcc.edu:
//   1. Open https://catalog.cpcc.edu/programs/college-level/associate-degree-diploma-certificate/<slug>/
//      The slug is derived from the program name (e.g. "nursing-associate-degree",
//      "practical-nursing", "nursing-assistant", "physical-therapist-assistant", etc.).
//      Verify the slug by searching https://catalog.cpcc.edu/search/?P=<code>.
//   2. On the program page, extract three sections:
//        Overview text                       → overview prose (curriculum description)
//        Award name                          → title field (e.g. "Associate in Applied Science")
//        Suggested Course Sequence table    → by-semester "Plan of Study Grid"
//      The grid reads: `Term I … Credits<N> Term II … Credits<N> … Total Credits<T>`.
//      If a program has NO suggested-sequence content (e.g. nurse-aide — page uses a
//      dynamic tab that WebFetch cannot render), use the NAS course catalog entries at
//      https://catalog.cpcc.edu/courses-a-z/nas/ to identify NAS 101 and NAS 102.
//   3. Map each Term → { term, termCredits, rows:[{code,name,credits}] }. Collapse
//      "Select one of"/elective rows to a single row with code:"" and the choice text as
//      name; keep credits as shown; drop advisory sentences.
//   4. Multi-track programs (nursing-adn: standard/accelerated/LPN-to-ADN;
//      cardiovascular-technology: invasive/non-invasive) → pick the STANDARD/primary track
//      for planOfStudy and list alternates in `specializations:[{name,code}]`.
//   5. totalHours = the page's "Total Credits"; must equal the sum of termCredits and fall
//      in 40–80 (the test enforces this).
//   6. overview/employmentOutlook are HTML strings; wrap paragraphs in <p>…</p>, escape
//      ampersands as &amp;.
//
// Catalog base URL pattern:
//   https://catalog.cpcc.edu/programs/college-level/associate-degree-diploma-certificate/<slug>/
//
// Program slugs used (confirmed working 2026-06-17):
//   nursing-adn              → nursing-associate-degree
//   practical-nursing        → practical-nursing
//   nurse-aide               → nursing-assistant  (plan-of-study tab is dynamic; used NAS courses)
//   physical-therapist-assistant → physical-therapist-assistant
//   occupational-therapy-assistant → occupational-therapy-assistant
//   surgical-technology      → surgical-technology
//   respiratory-therapy      → respiratory-therapy
//   cardiovascular-technology → cardiovascular-technology
//   polysomnography          → polysomnography
//   medical-laboratory-technology → medical-laboratory-technology
//   pharmacy-technology      → pharmacy-technology
//   dental-hygiene           → dental-hygiene
//   dental-assisting         → dentalassisting
//   ophthalmic-medical       → ophthalmic-medical-assistant
//   emergency-medical-science → emergency-medical-science
//   medical-assisting        → medical-assisting
//
// To refresh after a catalog update: redo steps 1–5 for each program, overwrite
// ../build/sheets-health.json, then `node --test test/sheets-health.test.js`.
