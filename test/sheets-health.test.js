import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sheets = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'build', 'sheets-health.json'), 'utf8')
);

const EXPECTED_IDS = [
  'nursing-adn', 'practical-nursing', 'nurse-aide',
  'physical-therapist-assistant', 'occupational-therapy-assistant',
  'surgical-technology', 'respiratory-therapy', 'cardiovascular-technology', 'polysomnography',
  'medical-laboratory-technology', 'pharmacy-technology',
  'dental-hygiene', 'dental-assisting', 'ophthalmic-medical',
  'emergency-medical-science', 'medical-assisting',
];

test('has exactly the 16 expected programs', () => {
  const ids = sheets.sheets.map((s) => s.id).sort();
  assert.deepEqual(ids, [...EXPECTED_IDS].sort());
});

test('every sheet has the required non-empty fields', () => {
  for (const s of sheets.sheets) {
    for (const k of ['id', 'family', 'programName', 'title', 'code', 'overview', 'totalHours']) {
      assert.ok(String(s[k] || '').length > 0, `${s.id} missing ${k}`);
    }
    assert.ok(Array.isArray(s.planOfStudy) && s.planOfStudy.length >= 1, `${s.id} empty planOfStudy`);
    for (const t of s.planOfStudy) {
      assert.ok(t.term && Array.isArray(t.rows) && t.rows.length >= 1, `${s.id} bad term ${t.term}`);
      for (const r of t.rows) assert.ok(r.code !== undefined && r.name, `${s.id} bad row`);
    }
  }
});

test('total credit hours are plausible (8–80, including short certificates)', () => {
  for (const s of sheets.sheets) {
    const n = Number(s.totalHours);
    assert.ok(n >= 8 && n <= 80, `${s.id} totalHours ${s.totalHours} out of range (short certificates like Nurse Aide are 8–20)`);
  }
});
