// The 6 kiosk "worlds" (first-tap) for Health Sciences programs. Presentation layer —
// framed by what a student wants to DO, decoupled from the catalog `family` field.
// Colors per cpcc-branding: Gray/Gold dominant, Blue accent, Purple is the <=10%
// accent (Dental & Vision only). Dark text on gold, white elsewhere.
export const WORLDS = [
  { id: 'nursing', name: 'Nursing & Bedside Care',
    desc: 'Care for patients at the bedside',
    color: '#005D83', text: '#FFFFFF',
    programIds: ['nursing-adn', 'practical-nursing', 'nurse-aide'] },
  { id: 'therapy', name: 'Therapy & Rehabilitation',
    desc: 'Help people move, recover, and regain independence',
    color: '#54565A', text: '#FFFFFF',
    programIds: ['physical-therapist-assistant', 'occupational-therapy-assistant'] },
  { id: 'surgery', name: 'Surgery & Critical Care',
    desc: 'Work in the OR, ICU, and acute-care teams',
    color: '#B4A269', text: '#1A1A1A',
    programIds: ['surgical-technology', 'respiratory-therapy', 'cardiovascular-technology', 'polysomnography'] },
  { id: 'labs', name: 'Labs, Meds & Diagnostics',
    desc: 'Run the tests and medications behind every diagnosis',
    color: '#54565A', text: '#FFFFFF',
    programIds: ['medical-laboratory-technology', 'pharmacy-technology'] },
  { id: 'dentalvision', name: 'Dental & Vision Care',
    desc: 'Care for smiles and sight',
    color: '#672666', text: '#FFFFFF',
    programIds: ['dental-hygiene', 'dental-assisting', 'ophthalmic-medical'] },
  { id: 'emergency', name: 'Emergency & Clinic Support',
    desc: 'Respond to emergencies and keep clinics running',
    color: '#005D83', text: '#FFFFFF',
    programIds: ['emergency-medical-science', 'medical-assisting'] },
];

export function worldForProgram(id) {
  return WORLDS.find((w) => w.programIds.includes(id));
}

// Throws if the live program list and the world map disagree (extra or missing ids).
export function validateWorldMap(allIds) {
  const mapped = new Set(WORLDS.flatMap((w) => w.programIds));
  const missing = allIds.filter((id) => !mapped.has(id));
  const extra = [...mapped].filter((id) => !allIds.includes(id));
  if (missing.length || extra.length) {
    throw new Error(`world-map mismatch — missing: [${missing}] extra: [${extra}]`);
  }
}
