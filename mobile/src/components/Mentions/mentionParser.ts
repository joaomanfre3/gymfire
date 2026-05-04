export interface Mention {
  userId: string;
  username: string;
  start: number;
  end: number;
}

export function findMentionsInText(text: string) {
  const regex = /@([a-zA-Z0-9_.]+)/g;
  const out: Array<{ username: string; start: number; end: number }> = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    out.push({ username: m[1], start: m.index, end: m.index + m[0].length });
  }
  return out;
}

export function getActiveMentionQuery(
  text: string,
  cursor: number,
): { query: string; start: number } | null {
  let i = cursor - 1;
  while (i >= 0) {
    const c = text[i];
    if (c === '@') return { query: text.slice(i + 1, cursor), start: i };
    if (/\s/.test(c)) return null;
    i--;
  }
  return null;
}

export function insertMention(params: {
  text: string;
  cursorPosition: number;
  username: string;
}) {
  const active = getActiveMentionQuery(params.text, params.cursorPosition);
  if (!active) return { text: params.text, cursorPosition: params.cursorPosition };
  const before = params.text.slice(0, active.start);
  const after = params.text.slice(params.cursorPosition);
  const insert = `@${params.username} `;
  return { text: before + insert + after, cursorPosition: active.start + insert.length };
}

export function recomputeMentions(text: string, mentions: Mention[]): Mention[] {
  return mentions.filter((m) => text.slice(m.start, m.end) === `@${m.username}`);
}

export function buildSegments(
  text: string,
  mentions: Mention[],
): Array<
  { type: 'text'; content: string } | { type: 'mention'; mention: Mention }
> {
  const sorted = [...mentions].sort((a, b) => a.start - b.start);
  const segments: Array<any> = [];
  let cursor = 0;
  for (const m of sorted) {
    if (m.start > cursor)
      segments.push({ type: 'text', content: text.slice(cursor, m.start) });
    segments.push({ type: 'mention', mention: m });
    cursor = m.end;
  }
  if (cursor < text.length)
    segments.push({ type: 'text', content: text.slice(cursor) });
  return segments;
}
