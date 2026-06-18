import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORLDS, worldForProgram, validateWorldMap } from '../world-map.js';

const ALL_IDS = [
  'nursing-adn', 'practical-nursing', 'nurse-aide',
  'physical-therapist-assistant', 'occupational-therapy-assistant',
  'surgical-technology', 'respiratory-therapy', 'cardiovascular-technology', 'polysomnography',
  'medical-laboratory-technology', 'pharmacy-technology',
  'dental-hygiene', 'dental-assisting', 'ophthalmic-medical',
  'emergency-medical-science', 'medical-assisting',
];

test('there are exactly 6 worlds, each with color + text + name', () => {
  assert.equal(WORLDS.length, 6);
  for (const w of WORLDS) {
    assert.match(w.color, /^#[0-9A-Fa-f]{6}$/);
    assert.match(w.text, /^#[0-9A-Fa-f]{6}$/);
    assert.ok(w.name.length > 0);
    assert.ok(Array.isArray(w.programIds));
  }
});

test('every program id maps to exactly one world', () => {
  const seen = new Map();
  for (const w of WORLDS) for (const id of w.programIds) {
    assert.ok(!seen.has(id), `duplicate mapping for ${id}`);
    seen.set(id, w.id);
  }
  for (const id of ALL_IDS) assert.ok(seen.has(id), `unmapped program: ${id}`);
  assert.equal(seen.size, ALL_IDS.length, 'world map has extra/unknown ids');
});

test('worldForProgram returns the owning world', () => {
  assert.equal(worldForProgram('nursing-adn').id, 'nursing');
  assert.equal(worldForProgram('dental-hygiene').id, 'dentalvision');
  assert.equal(worldForProgram('nope'), undefined);
});

test('validateWorldMap throws on missing coverage', () => {
  assert.throws(() => validateWorldMap([...ALL_IDS, 'extra-prog']), /extra-prog/);
  assert.doesNotThrow(() => validateWorldMap(ALL_IDS));
});

test('purple is used only by the dentalvision world (<=10% accent rule)', () => {
  const purple = WORLDS.filter((w) => w.color.toUpperCase() === '#672666');
  assert.equal(purple.length, 1);
  assert.equal(purple[0].id, 'dentalvision');
});
