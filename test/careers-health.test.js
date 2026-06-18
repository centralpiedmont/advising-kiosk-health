import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const careers = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'careers.json'), 'utf8'));
const EXPECTED_IDS = [
  'nursing-adn', 'practical-nursing', 'nurse-aide',
  'physical-therapist-assistant', 'occupational-therapy-assistant',
  'surgical-technology', 'respiratory-therapy', 'cardiovascular-technology', 'polysomnography',
  'medical-laboratory-technology', 'pharmacy-technology',
  'dental-hygiene', 'dental-assisting', 'ophthalmic-medical',
  'emergency-medical-science', 'medical-assisting',
];

test('every program has at least one career with a numeric median and SOC', () => {
  for (const id of EXPECTED_IDS) {
    const rows = careers.programs[id];
    assert.ok(Array.isArray(rows) && rows.length >= 1, `${id} has no careers`);
    for (const r of rows) {
      assert.ok(r.title && /^\d{2}-\d{4}$/.test(r.soc), `${id} bad soc ${r.soc}`);
      assert.ok(Number.isFinite(r.medianUSD), `${id} non-numeric medianUSD`);
    }
  }
});

test('every program career SOC appears in the occupations[] reference table', () => {
  const known = new Set(careers.occupations.map((o) => o.soc));
  for (const id of EXPECTED_IDS) for (const r of careers.programs[id]) {
    assert.ok(known.has(r.soc), `${id} soc ${r.soc} missing from occupations[]`);
  }
});
