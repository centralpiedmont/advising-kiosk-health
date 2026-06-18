import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildKioskData } from '../generate.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sheets = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'build', 'sheets-health.json'), 'utf8'));
const careers = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'careers.json'), 'utf8'));
const quiz = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'quiz.json'), 'utf8'));
const admissions = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'admissions.json'), 'utf8'));

test('buildKioskData produces all 16 programs, each fully populated', () => {
  const data = buildKioskData(sheets, careers);
  assert.equal(Object.keys(data.programs).length, 16);
  const n = data.programs['nursing-adn'];
  assert.equal(n.world, 'nursing');
  assert.ok(n.lead.length > 0 && !/[<>]/.test(n.lead));
  assert.ok(n.skills.length >= 3);
  assert.ok(/^\$\d/.test(n.careers[0].salaryText));
  assert.equal(n.qrFile, 'assets/qr/nursing-adn.png');
  assert.equal(n.sheetUrl, 'https://frazier-at-cpcc.github.io/cpcc-it-degree-sheets/health/nursing-adn.pdf');
  assert.ok(Array.isArray(n.planOfStudy) && n.planOfStudy[0].rows.length > 0);
});

test('worlds carry their programs in array order and brand colors', () => {
  const data = buildKioskData(sheets, careers);
  assert.equal(data.worlds.length, 6);
  const surgery = data.worlds.find((w) => w.id === 'surgery');
  assert.equal(surgery.color, '#B4A269');
  assert.equal(surgery.text, '#1A1A1A');
  const dv = data.worlds.find((w) => w.id === 'dentalvision');
  assert.equal(dv.color, '#672666');
});

test('admissions records attach to programs with an applyQrFile when applyUrl present', () => {
  const data = buildKioskData(sheets, careers, null, null, admissions);
  const n = data.programs['nursing-adn'];
  assert.ok(n.admissions, 'nursing-adn has admissions');
  assert.equal(n.admissions.admissionType, 'selective');
  assert.equal(n.applyQrFile, 'assets/qr/apply-nursing-adn.png');
});

test('omitting admissions leaves admissions null (back-compat)', () => {
  const data = buildKioskData(sheets, careers);
  assert.equal(data.programs['nursing-adn'].admissions, null);
  assert.equal(data.programs['nursing-adn'].applyQrFile, null);
});

test('infoSession + meta present', () => {
  const data = buildKioskData(sheets, careers);
  assert.ok(data.infoSession.url.length > 0);
  assert.equal(data.infoSession.qrFile, 'assets/qr/info-session.png');
  assert.ok(data.meta.generatedFrom.includes('sheets-health.json'));
});

test('buildKioskData attaches the quiz and validates answer worlds', () => {
  const data = buildKioskData(sheets, careers, null, quiz);
  assert.ok(data.quiz);
  assert.equal(data.quiz.questions.length, 6);
  assert.equal(Object.keys(data.quiz.archetypes).length, 6);
  const worldIds = new Set(data.worlds.map((w) => w.id));
  for (const q of data.quiz.questions) for (const a of q.answers) {
    assert.ok(worldIds.has(a.world));
    assert.ok(data.quiz.archetypes[a.world]);
  }
});
