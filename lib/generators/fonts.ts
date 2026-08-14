import * as fontkit from 'fontkit';
import { readFileSync } from 'fs';
import { join } from 'path';

const FONT_DIR = join(process.cwd(), 'lib', 'generators', 'fonts');

type FontName = 'Inter' | 'Montserrat' | 'Playfair Display' | 'Great Vibes' | 'Alex Brush';

const FONT_FILES: Record<FontName, { regular: string; bold: string }> = {
  Inter: { regular: 'inter-400.ttf', bold: 'inter-700.ttf' },
  Montserrat: { regular: 'montserrat-400.ttf', bold: 'montserrat-700.ttf' },
  'Playfair Display': { regular: 'playfair-400.ttf', bold: 'playfair-700.ttf' },
  'Great Vibes': { regular: 'greatvibes-400.ttf', bold: 'greatvibes-400.ttf' },
  'Alex Brush': { regular: 'alexbrush-400.ttf', bold: 'alexbrush-400.ttf' },
};

const cache = new Map<string, Uint8Array>();

export function isCustomFont(fontFamily: string): boolean {
  return fontFamily in FONT_FILES;
}

export function loadCustomFont(fontFamily: string, fontWeight: string): Uint8Array | null {
  const config = FONT_FILES[fontFamily as FontName];
  if (!config) return null;

  const file = fontWeight === 'bold' ? config.bold : config.regular;
  const cacheKey = `${fontFamily}:${file}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey)!;

  try {
    const bytes = readFileSync(join(FONT_DIR, file));
    const view = new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    cache.set(cacheKey, view);
    return view;
  } catch (err) {
    console.error(`Failed to load local font ${file}:`, err);
    return null;
  }
}

export { fontkit };
