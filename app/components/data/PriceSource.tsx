import { History } from 'lucide-react';
import { useNow } from '~/hooks/useNow';
import { formatPriceText, parsePrice } from '~/lib/currency';
import {
  type PriceSource,
  PRICE_STALE_MONTHS,
  isPriceStale,
  sourceLabel,
} from '~/lib/price-source';

/**
 * "as of 2026-11-18 · LCSC C155753" under a price on the entry page, linking
 * the source when known. Flags prices older than PRICE_STALE_MONTHS once
 * mounted (staleness depends on the viewer's clock, not the build's).
 */
export function PriceAsOf({ source }: { source: PriceSource | null }) {
  const now = useNow();
  if (!source) {
    return <span className="price-as-of price-as-of--unknown">price date not recorded</span>;
  }
  const label = sourceLabel(source);
  const stale = isPriceStale(source, now);
  return (
    <span className={`price-as-of${stale ? ' price-as-of--stale' : ''}`}>
      {stale && <History size={12} aria-hidden="true" className="price-as-of-icon" />}
      as of <time dateTime={source.retrieved}>{source.retrieved}</time>
      {label && (
        <>
          {' · '}
          {source.url ? (
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          ) : (
            label
          )}
        </>
      )}
      {stale && <> — over {PRICE_STALE_MONTHS} months old, may have changed</>}
      {source.notes && <span className="price-as-of-notes"> ({source.notes})</span>}
    </span>
  );
}

/**
 * Small clock mark before a table price that is older than
 * PRICE_STALE_MONTHS. Renders nothing on the server / first paint.
 */
export function PriceStaleMark({ source }: { source: PriceSource | null }) {
  const now = useNow();
  if (!isPriceStale(source, now)) return null;
  return (
    <span className="price-stale-mark">
      <History size={11} aria-hidden="true" />
      <span className="sr-only">price from {source!.retrieved}, may be out of date: </span>
    </span>
  );
}

const PRICE_LABELS = new Set(['free', 'varies', 'contact', 'unknown']);

function priceText(v: unknown): string | null {
  if (typeof v === 'string' && PRICE_LABELS.has(v.trim().toLowerCase())) {
    return v.trim().toLowerCase();
  }
  const parsed = parsePrice(v);
  return parsed ? formatPriceText(parsed) : null;
}

/**
 * Entry-page price: a single price, a street-price range, published quantity
 * tiers (`[{qty, price, sku}]`) or named options (`[{name, price, pixels}]`),
 * followed by the "as of" provenance line.
 */
export function PriceDetail({ value, source }: { value: unknown; source: PriceSource | null }) {
  let body: React.ReactNode;
  if (Array.isArray(value)) {
    body = (
      <ul className="price-list">
        {value.map((row, i) => {
          const r = (row ?? {}) as {
            qty?: unknown;
            name?: unknown;
            sku?: unknown;
            pixels?: unknown;
          };
          const label =
            typeof r.qty === 'number'
              ? `${r.qty.toLocaleString('en-US')}+`
              : typeof r.name === 'string'
                ? r.name
                : null;
          const extra = [
            typeof r.sku === 'string' ? r.sku : null,
            typeof r.pixels === 'number' ? `${r.pixels.toLocaleString('en-US')} pixels` : null,
          ].filter(Boolean);
          return (
            <li key={i}>
              <span className="price-list-label">{label}</span>
              <span className="tabular-nums">{priceText(row) ?? '-'}</span>
              <span className="price-list-extra">{extra.join(', ')}</span>
            </li>
          );
        })}
      </ul>
    );
  } else {
    body = <span className="tabular-nums">{priceText(value) ?? String(value)}</span>;
  }
  return (
    <div className="price-detail">
      {body}
      <PriceAsOf source={source} />
    </div>
  );
}
