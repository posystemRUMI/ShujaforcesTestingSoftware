export const COMMAND_COLORS = {
  navy: '#0E1B2A',
  midnight: '#0F1C2B',
  slate: '#455D4A',
  brass: '#C6A75E',
  charcoal: '#1F2937',
  mutedText: '#64748B',
  canvas: '#F6F8FA',
  card: '#FFFFFF',
  recessed: '#EDF1F5',
  hairline: '#D4D9DF',
  subtle: '#E2E6EB',
} as const;

export const STATUS_COLORS = {
  pass: {
    text: '#234E35',
    bg: '#EDF6F0',
    border: '#88BE9B',
  },
  fail: {
    text: '#782525',
    bg: '#FDF2F2',
    border: '#E29A9A',
  },
  paused: {
    text: '#7A5312',
    bg: '#FDF7EC',
    border: '#DEC088',
  },
  retake: {
    text: '#405364',
    bg: '#EEF2F6',
    border: '#9BB0C1',
  },
} as const;

export const FORCES_CONFIG = {
  PAKISTAN_ARMY: {
    label: 'Pakistan Army',
    shortLabel: 'Army',
    color: '#0E1B2A',
    accent: '#455D4A',
  },
  PAKISTAN_AIR_FORCE: {
    label: 'Pakistan Air Force',
    shortLabel: 'PAF',
    color: '#153250',
    accent: '#5B86B2',
  },
  PAKISTAN_NAVY: {
    label: 'Pakistan Navy',
    shortLabel: 'Navy',
    color: '#0A2540',
    accent: '#205493',
  },
  TRI_SERVICE: {
    label: 'Tri-Service (Joint)',
    shortLabel: 'Joint',
    color: '#1F2937',
    accent: '#C6A75E',
  },
} as const;
