export type CipherAlgorithm = 'caesar' | 'vigenere';

export interface CipherResult {
  output: string;
  error: string;
}

export const CIPHER_ALGORITHMS: ReadonlyArray<{
  value: CipherAlgorithm;
  label: string;
}> = [
  { value: 'caesar', label: 'Caesar' },
  { value: 'vigenere', label: 'Vigenere' },
];

export const MIN_SHIFT = 1;
export const MAX_SHIFT = 25;

const UPPER_A = 65;
const LOWER_A = 97;
const ALPHABET_SIZE = 26;

function letterBase(code: number): number | null {
  if (code >= UPPER_A && code <= UPPER_A + ALPHABET_SIZE - 1) return UPPER_A;
  if (code >= LOWER_A && code <= LOWER_A + ALPHABET_SIZE - 1) return LOWER_A;
  return null;
}

function applyShift(code: number, shift: number): number {
  const base = letterBase(code);
  if (base === null) return code;
  const offset = code - base;
  return base + (((offset + shift) % ALPHABET_SIZE) + ALPHABET_SIZE) % ALPHABET_SIZE;
}

export function parseCaesarKey(key: string): number | null {
  const trimmed = key.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number(trimmed);
  if (value < MIN_SHIFT || value > MAX_SHIFT) return null;
  return value;
}

export function parseVigenereKey(key: string): number[] | null {
  const letters = key.toUpperCase().replace(/[^A-Z]/g, '');
  if (!letters) return null;
  return letters.split('').map((char) => char.charCodeAt(0) - UPPER_A);
}

export function keyError(algorithm: CipherAlgorithm, key: string): string {
  if (key.trim() === '') {
    return algorithm === 'caesar'
      ? `Enter a shift between ${MIN_SHIFT} and ${MAX_SHIFT}.`
      : 'Enter a keyword made of letters.';
  }
  if (algorithm === 'caesar') {
    return `Shift must be a whole number from ${MIN_SHIFT} to ${MAX_SHIFT}.`;
  }
  return 'Keyword must contain at least one letter.';
}

function resolveShifts(
  algorithm: CipherAlgorithm,
  key: string
): { shifts: number[]; error: string } {
  if (algorithm === 'caesar') {
    const shift = parseCaesarKey(key);
    if (shift === null) return { shifts: [], error: keyError(algorithm, key) };
    return { shifts: [shift], error: '' };
  }
  const shifts = parseVigenereKey(key);
  if (!shifts) return { shifts: [], error: keyError(algorithm, key) };
  return { shifts, error: '' };
}

function transform(
  text: string,
  algorithm: CipherAlgorithm,
  key: string,
  direction: 1 | -1
): CipherResult {
  const { shifts, error } = resolveShifts(algorithm, key);
  if (error) return { output: '', error };

  let keyIndex = 0;
  let output = '';

  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    if (letterBase(code) === null) {
      output += text[i];
      continue;
    }
    const shift = shifts[keyIndex % shifts.length] * direction;
    output += String.fromCharCode(applyShift(code, shift));
    keyIndex += 1;
  }

  return { output, error: '' };
}

export function encrypt(
  text: string,
  algorithm: CipherAlgorithm,
  key: string
): CipherResult {
  return transform(text, algorithm, key, 1);
}

export function decrypt(
  text: string,
  algorithm: CipherAlgorithm,
  key: string
): CipherResult {
  return transform(text, algorithm, key, -1);
}
