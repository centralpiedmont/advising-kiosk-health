import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { WORLDS, worldForProgram, validateWorldMap } from './world-map.js';
import { degreeLabel, shortLead, formatSalary, skillChips, learnNarrative, stripHtml } from './derive.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const COURSE_DESCS = (() => {
  try { return JSON.parse(fs.readFileSync(path.join(__dirname, 'course-descriptions.json'), 'utf8')); }
  catch { return {}; }
})();
const normCode = (c) => String(c || '').replace(/-/g, ' ').replace(/\s+/g, ' ').trim().toUpperCase();
// Per-program tile tint overrides (default is the world color). No B&A tints — each
// program inherits its world color.
const TILE_TINT = {};
// Short, student-facing "what is this?" lines shown under each program tile.
const TILE_DESC = {
  'nursing-adn': 'Advanced nursing leadership and practice',
  'practical-nursing': 'Deliver daily patient care and support',
  'nurse-aide': 'Assist patients with daily activities',
  'physical-therapist-assistant': 'Help patients restore movement and strength',
  'occupational-therapy-assistant': 'Support patients in daily living skills',
  'surgical-technology': 'Prepare surgical suites and assist surgeons',
  'respiratory-therapy': 'Manage breathing and ventilation systems',
  'cardiovascular-technology': 'Monitor and test heart and blood vessels',
  'polysomnography': 'Diagnose sleep disorders and conditions',
  'medical-laboratory-technology': 'Analyze samples and conduct medical tests',
  'pharmacy-technology': 'Prepare and dispense medications',
  'dental-hygiene': 'Clean teeth and educate on oral health',
  'dental-assisting': 'Support dentists in patient care',
  'ophthalmic-medical': 'Assist eye doctors and conduct vision tests',
  'emergency-medical-science': 'Respond to medical emergencies',
  'medical-assisting': 'Support doctors in clinics and offices',
};
const PAGES_BASE = 'https://centralpiedmont.github.io/advising-kiosk-health/sheets';
const INFO_SESSION_URL = 'https://www.cpcc.edu/events/health-programs-info-fair';

function buildCE(ce) {
  // Self-hide: no CE object, or an empty catalog (B&A ships empty) → no CE tile.
  if (!ce || !(ce.categories && ce.categories.length)) return null;
  return {
    label: stripHtml(ce.label), short: stripHtml(ce.short), tagline: stripHtml(ce.tagline),
    tileDesc: 'Short courses and industry certifications',
    color: ce.color, text: ce.text, registerUrl: ce.registerUrl,
    photo: 'assets/photos/ce.jpg', qrFile: 'assets/qr/ce-register.png',
    categories: ce.categories.map((c) => ({
      name: stripHtml(c.name),
      courses: c.courses.map((x) => ({
        code: x.code, name: stripHtml(x.name), price: x.price || null, hours: x.hours || null,
        desc: x.desc ? stripHtml(x.desc) : '',
        qrFile: (x.courseId || x.url) ? `assets/qr/ce-${x.code}.png` : null,
      })),
    })),
  };
}

function buildQuiz(quiz, worldIds) {
  if (!quiz) return null;
  for (const q of quiz.questions) for (const a of q.answers) {
    if (!worldIds.has(a.world)) throw new Error(`quiz answer world not a real world: ${a.world}`);
    if (!quiz.archetypes[a.world]) throw new Error(`quiz answer world has no archetype: ${a.world}`);
  }
  return quiz;
}

export function buildKioskData(sheets, careers, ce, quiz, admissions) {
  validateWorldMap(sheets.sheets.map((s) => s.id));
  const programs = {};
  for (const s of sheets.sheets) {
    const world = worldForProgram(s.id);
    const careerRows = (careers.programs[s.id] || []).map((c) => ({
      title: c.title, salaryText: formatSalary(c.medianUSD), soc: c.soc,
    }));
    const tint = TILE_TINT[s.id] || { color: world.color, text: world.text };
    programs[s.id] = {
      id: s.id,
      world: world.id,
      tileColor: tint.color,
      tileText: tint.text,
      tileDesc: TILE_DESC[s.id] || '',
      name: stripHtml(s.programName),
      track: s.concentration ? stripHtml(s.concentration).replace(/ ?(Career Track|Concentration).*$/i, '') : '',
      degree: degreeLabel(s.title),
      code: s.code,
      totalHours: Number.isFinite(Number(s.totalHours)) ? Number(s.totalHours) : String(s.totalHours),
      semesters: s.planOfStudy.length,
      lead: shortLead(s.overview),
      learn: learnNarrative(s.overview),
      skills: skillChips(s.planOfStudy),
      specializations: (s.specializations || []).map((x) => ({ name: stripHtml(x.name), code: x.code })),
      careers: careerRows,
      planOfStudy: s.planOfStudy.map((t) => ({
        term: t.term, termCredits: t.termCredits, note: t.note ? stripHtml(t.note) : '',
        rows: t.rows.map((r) => {
          const info = COURSE_DESCS[normCode(r.code)];
          return { code: r.code, name: stripHtml(r.name), credits: r.credits, desc: info ? info.desc : '' };
        }),
      })),
      heroFile: `assets/heroes/${s.hero || s.id + '.jpg'}`,
      qrFile: `assets/qr/${s.id}.png`,
      sheetUrl: `${PAGES_BASE}/${s.id}.pdf`,
      admissions: (admissions && admissions[s.id]) || null,
      applyQrFile: (admissions && admissions[s.id] && admissions[s.id].applyUrl) ? `assets/qr/apply-${s.id}.png` : null,
    };
  }
  return {
    meta: { generatedFrom: 'build/sheets-health.json + kiosk-health/careers.json', programCount: Object.keys(programs).length },
    worlds: WORLDS.map((w) => ({ id: w.id, name: w.name, desc: w.desc, color: w.color, text: w.text, programIds: w.programIds })),
    programs,
    infoSession: { url: INFO_SESSION_URL, qrFile: 'assets/qr/info-session.png' },
    ce: buildCE(ce),
    quiz: buildQuiz(quiz, new Set(sheets.sheets.map((s) => worldForProgram(s.id).id))),
  };
}

function copyAssets(outDir) {
  const pub = path.join(outDir, 'assets');
  fs.mkdirSync(path.join(pub, 'heroes'), { recursive: true });
  fs.mkdirSync(path.join(pub, 'qr'), { recursive: true });
  const heroesSrc = path.join(__dirname, '..', 'build', 'assets', 'heroes');
  for (const f of fs.readdirSync(heroesSrc)) {
    if (f.endsWith('.jpg')) fs.copyFileSync(path.join(heroesSrc, f), path.join(pub, 'heroes', f));
  }
  // Prefer a kiosk-local logo (e.g. a whitespace-trimmed copy) over the shared build asset.
  const kioskAssets = path.join(__dirname, 'assets');
  const buildAssets = path.join(__dirname, '..', 'build', 'assets');
  for (const f of ['logo-white.png', 'logo-dark.png', 'mark-gold.png']) {
    const local = path.join(kioskAssets, f);
    fs.copyFileSync(fs.existsSync(local) ? local : path.join(buildAssets, f), path.join(pub, f));
  }
  const qrSrc = path.join(__dirname, 'assets', 'qr');
  for (const f of fs.readdirSync(qrSrc)) {
    if (f.endsWith('.png')) fs.copyFileSync(path.join(qrSrc, f), path.join(pub, 'qr', f));
  }
  // Official CPCC photos (attract background + world/program tile backgrounds)
  const photoSrc = path.join(__dirname, 'assets', 'photos');
  if (fs.existsSync(photoSrc)) {
    fs.mkdirSync(path.join(pub, 'photos'), { recursive: true });
    for (const f of fs.readdirSync(photoSrc)) {
      if (/\.(jpe?g|png|webp)$/i.test(f)) fs.copyFileSync(path.join(photoSrc, f), path.join(pub, 'photos', f));
    }
  }
  // Bundled brand font (Libre Franklin — OFL Franklin Gothic revival) so the kiosk
  // never falls back to the browser block's default sans.
  const fontSrc = path.join(__dirname, 'assets', 'fonts');
  if (fs.existsSync(fontSrc)) {
    fs.mkdirSync(path.join(pub, 'fonts'), { recursive: true });
    for (const f of fs.readdirSync(fontSrc)) {
      if (/\.(woff2?|ttf|otf|txt)$/i.test(f)) fs.copyFileSync(path.join(fontSrc, f), path.join(pub, 'fonts', f));
    }
  }
  // Self-hosted FontAwesome (solid) for quiz icons — bundled so it works offline.
  const faSrc = path.join(__dirname, 'assets', 'fontawesome');
  if (fs.existsSync(faSrc)) fs.cpSync(faSrc, path.join(pub, 'fontawesome'), { recursive: true });
}

// Run as a script: emit public/kiosk-data.json + copy assets.
if (import.meta.url === `file://${process.argv[1]}`) {
  const sheets = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'build', 'sheets-health.json'), 'utf8'));
  const careers = JSON.parse(fs.readFileSync(path.join(__dirname, 'careers.json'), 'utf8'));
  const ce = JSON.parse(fs.readFileSync(path.join(__dirname, 'ce.json'), 'utf8'));
  const quiz = JSON.parse(fs.readFileSync(path.join(__dirname, 'quiz.json'), 'utf8'));
  const admissions = JSON.parse(fs.readFileSync(path.join(__dirname, 'admissions.json'), 'utf8'));
  const outDir = path.join(__dirname, 'public');
  fs.mkdirSync(outDir, { recursive: true });
  const data = buildKioskData(sheets, careers, ce, quiz, admissions);
  fs.writeFileSync(path.join(outDir, 'kiosk-data.json'), JSON.stringify(data, null, 2));
  copyAssets(outDir);
  console.log(`Wrote public/kiosk-data.json (${data.meta.programCount} programs) + assets.`);
}
