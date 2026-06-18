import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const admissions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'admissions.json'), 'utf8'));
const EXPECTED_IDS = [
  'nursing-adn', 'practical-nursing', 'nurse-aide',
  'physical-therapist-assistant', 'occupational-therapy-assistant',
  'surgical-technology', 'respiratory-therapy', 'cardiovascular-technology', 'polysomnography',
  'medical-laboratory-technology', 'pharmacy-technology',
  'dental-hygiene', 'dental-assisting', 'ophthalmic-medical',
  'emergency-medical-science', 'medical-assisting',
];

test('every program has an admissions record with required fields', () => {
  for (const id of EXPECTED_IDS) {
    const a = admissions[id];
    assert.ok(a, `${id} missing admissions record`);
    assert.ok(a.admissionType === 'selective' || a.admissionType === 'open', `${id} bad admissionType`);
    assert.equal(typeof a.teasRequired, 'boolean', `${id} teasRequired`);
    assert.equal(typeof a.infoSessionRequired, 'boolean', `${id} infoSessionRequired`);
    assert.ok(Array.isArray(a.keyPrereqs), `${id} keyPrereqs not array`);
    assert.ok(Array.isArray(a.nextSteps) && a.nextSteps.length >= 1, `${id} needs nextSteps`);
  }
});

test('no admissions records for unknown program ids', () => {
  for (const id of Object.keys(admissions)) {
    assert.ok(EXPECTED_IDS.includes(id), `unknown admissions id: ${id}`);
  }
});
