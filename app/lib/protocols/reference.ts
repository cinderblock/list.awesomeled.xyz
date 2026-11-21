/**
 * The numbers the /protocols page states, each tied to the document it came
 * from. Nothing here is from memory: every value names a source in SOURCES,
 * where it was printed, and the words that printed it. The unit tests check
 * that every value points at a source and that the figures' arithmetic adds up.
 *
 * The research behind these (every part, every revision, the disagreements)
 * is in plans/pixel-protocols/.
 */

export interface ProtocolSource {
  /** What the document is, as its publisher titles it */
  title: string;
  publisher: string;
  url: string;
  /** YYYY-MM-DD the document was read */
  retrieved: string;
  /** Revision or date printed on the document */
  revision?: string;
  /** A Wayback Machine copy, for documents that move */
  archive?: string;
}

export interface Citation {
  /** Key into SOURCES */
  source: SourceId;
  /** Where in the document ("p. 4, timing table") */
  where: string;
  /** The words that say it, as printed */
  quote: string;
}

export const SOURCES = {} satisfies Record<string, ProtocolSource>;

export type SourceId = keyof typeof SOURCES;
