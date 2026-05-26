import { db } from '../db';

export async function getCorrectionMap(): Promise<Map<string, string>> {
  const entries = await db.corrections.toArray();
  const map = new Map<string, string>();
  entries
    .sort((a, b) => b.count - a.count)
    .forEach((e) => map.set(e.original, e.corrected));
  return map;
}

export function applyCorrections(text: string, map: Map<string, string>): string {
  let result = text;
  for (const [original, corrected] of map) {
    result = result.split(original).join(corrected);
  }
  return result;
}

function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || '';
}

function findDifferences(original: string, edited: string): Array<{ from: string; to: string }> {
  const diffs: Array<{ from: string; to: string }> = [];
  const origLines = original.split('\n').filter(Boolean);
  const editLines = edited.split('\n').filter(Boolean);

  for (let i = 0; i < Math.max(origLines.length, editLines.length); i++) {
    const orig = (origLines[i] || '').trim();
    const edit = (editLines[i] || '').trim();
    if (orig !== edit && orig.length > 1 && edit.length > 1) {
      diffs.push({ from: orig, to: edit });
    }
  }
  return diffs;
}

export async function learnFromEdit(ocrRawText: string, editedHtml: string): Promise<void> {
  const editedText = stripHtml(editedHtml);
  const diffs = findDifferences(ocrRawText, editedText);

  for (const { from, to } of diffs) {
    const existing = await db.corrections.where('original').equals(from).first();
    if (existing) {
      await db.corrections.update(existing.id!, { corrected: to, count: existing.count + 1 });
    } else {
      await db.corrections.add({ original: from, corrected: to, count: 1 });
    }
  }
}
