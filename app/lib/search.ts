/**
 * Site-wide search over a compact index of every entry.
 *
 * Product names here are mostly part numbers ("WS2812B", "F16V4", "SK6812
 * RGBW"), so matching is built around how people type those: any case, with
 * or without spaces and hyphens ("ws 2812-b"), partial ("2812"), and with the
 * odd slip ("falcn"). Every word of the query must match somewhere; where it
 * matches decides the rank (name > alias > maker > everything else).
 *
 * Pure functions; the index itself is built at build time
 * (search-index.server.ts) and fetched on first use (search-client.ts).
 */

/** One entry in the search index. Keys are short: this ships to the browser. */
export interface SearchDoc {
  /** Category id */
  c: string;
  /** Entry id */
  i: string;
  /** Name */
  n: string;
  /** Maker ("by") */
  b?: string;
  /** Status, when it is not plain "active" */
  s?: string;
  /** Other names: aliases, variants */
  a?: string[];
  /** Key facts, for display ("16 outputs · Art-Net, sACN · $275") */
  k?: string;
  /** Other searchable text: facet values, notes */
  t?: string;
  /** First image filename */
  img?: string;
}

interface PreparedDoc {
  doc: SearchDoc;
  name: string;
  nameWords: string[];
  nameSquashed: string;
  aliases: { text: string; squashed: string }[];
  maker: string;
  text: string;
}

export interface PreparedIndex {
  docs: PreparedDoc[];
}

export interface SearchHit {
  doc: SearchDoc;
  score: number;
}

/** Lower-case, strip accents, unify the many dashes. */
export function normalize(s: string): string {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[‐-―]/g, '-');
}

/** Letters and digits only: "WS2812-B" and "ws 2812 b" squash to the same thing. */
export function squash(s: string): string {
  return normalize(s).replace(/[^a-z0-9]+/g, '');
}

function words(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9.+]+/)
    .filter(Boolean);
}

/** Precompute the normalized forms once per index load. */
export function prepareIndex(docs: SearchDoc[]): PreparedIndex {
  return {
    docs: docs.map((doc) => ({
      doc,
      name: normalize(doc.n),
      nameWords: words(doc.n),
      nameSquashed: squash(doc.n),
      aliases: (doc.a ?? []).map((alias) => ({ text: normalize(alias), squashed: squash(alias) })),
      maker: normalize(doc.b ?? ''),
      text: normalize(doc.t ?? ''),
    })),
  };
}

/** Split a query into normalized terms. */
export function queryTerms(query: string): string[] {
  return normalize(query).split(/\s+/).filter(Boolean);
}

// Edit distance, cut off above 1: is `a` one insertion, deletion or
// substitution away from `b`?
function withinOneEdit(a: string, b: string): boolean {
  if (a === b) return true;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > 1) return false;
  let i = 0;
  let j = 0;
  let edits = 0;
  while (i < la && j < lb) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++edits > 1) return false;
    if (la > lb) i++;
    else if (lb > la) j++;
    else {
      i++;
      j++;
    }
  }
  return edits + (la - i) + (lb - j) <= 1;
}

// How well one term matches one document (0 = not at all)
function scoreTerm(doc: PreparedDoc, term: string): number {
  const squashedTerm = squash(term);
  let best = 0;
  const consider = (score: number) => {
    if (score > best) best = score;
  };

  // Name
  if (doc.name === term || (squashedTerm && doc.nameSquashed === squashedTerm)) consider(400);
  if (doc.nameWords[0]?.startsWith(term)) consider(250);
  else if (doc.nameWords.some((w) => w.startsWith(term))) consider(200);
  if (squashedTerm && doc.nameSquashed.startsWith(squashedTerm)) consider(230);
  if (doc.name.includes(term)) consider(120);
  if (squashedTerm.length >= 2 && doc.nameSquashed.includes(squashedTerm)) consider(110);

  // Other names for the same thing
  for (const alias of doc.aliases) {
    if (alias.text === term || (squashedTerm && alias.squashed === squashedTerm)) consider(320);
    else if (squashedTerm && alias.squashed.startsWith(squashedTerm)) consider(180);
    else if (squashedTerm.length >= 2 && alias.squashed.includes(squashedTerm)) consider(90);
  }

  // Maker
  if (doc.maker) {
    if (doc.maker.split(/[^a-z0-9]+/).some((w) => w.startsWith(term))) consider(60);
    else if (doc.maker.includes(term)) consider(40);
  }

  // Everything else
  if (best === 0 && doc.text.includes(term)) consider(15);

  // A near miss on a name word ("falcn", "ws2812b" for WS2812)
  if (best === 0 && squashedTerm.length >= 4) {
    const candidates = [doc.nameSquashed, ...doc.nameWords, ...doc.aliases.map((a) => a.squashed)];
    if (candidates.some((c) => c.length >= 3 && withinOneEdit(squashedTerm, c))) consider(30);
  }

  return best;
}

/**
 * Entries matching every term of the query, best first. An empty query
 * matches nothing (callers decide what to show instead).
 */
export function searchIndex(index: PreparedIndex, query: string, limit = 50): SearchHit[] {
  const terms = queryTerms(query);
  if (terms.length === 0) return [];
  const whole = normalize(query.trim());
  const hits: SearchHit[] = [];
  for (const doc of index.docs) {
    let score = 0;
    let matched = true;
    for (const term of terms) {
      const s = scoreTerm(doc, term);
      if (s === 0) {
        matched = false;
        break;
      }
      score += s;
    }
    if (!matched) continue;
    // The whole query is exactly this entry's name: nothing should outrank it
    if (doc.name === whole) score += 600;
    // Prefer the more specific (shorter) name among equals, and current products
    score += 20 / (1 + doc.name.length / 10);
    if (!doc.doc.s) score += 4;
    hits.push({ doc: doc.doc, score });
  }
  hits.sort((a, b) => b.score - a.score || a.doc.n.localeCompare(b.doc.n));
  return hits.slice(0, limit);
}

export interface TextPart {
  text: string;
  match: boolean;
}

/**
 * Split text into matched / unmatched runs for highlighting. Only literal
 * occurrences of a term are marked; squashed and fuzzy matches are not, which
 * is fine: the highlight is a reading aid, not the reason a row is listed.
 */
export function highlightParts(text: string, query: string): TextPart[] {
  const terms = queryTerms(query).filter((t) => t.length > 0);
  if (terms.length === 0 || text === '') return [{ text, match: false }];
  const lower = normalize(text);
  // normalize() can change length (accents); only highlight when positions line up
  if (lower.length !== text.length) return [{ text, match: false }];
  const marks = new Array<boolean>(text.length).fill(false);
  for (const term of terms) {
    let from = 0;
    for (;;) {
      const at = lower.indexOf(term, from);
      if (at === -1) break;
      for (let k = at; k < at + term.length; k++) marks[k] = true;
      from = at + term.length;
    }
  }
  const parts: TextPart[] = [];
  let start = 0;
  for (let k = 1; k <= text.length; k++) {
    if (k === text.length || marks[k] !== marks[start]) {
      parts.push({ text: text.slice(start, k), match: marks[start] });
      start = k;
    }
  }
  return parts;
}

/** Turn a missing page's path into a search query ("/pixels/ws2812b" → "ws2812b"). */
export function queryFromPath(pathname: string): string {
  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1] ?? '';
  let decoded = last;
  try {
    decoded = decodeURIComponent(last);
  } catch {
    // malformed escape: use it as-is
  }
  return decoded
    .replace(/\.[a-z0-9]{2,5}$/i, '')
    .replace(/[-_+]+/g, ' ')
    .trim();
}
