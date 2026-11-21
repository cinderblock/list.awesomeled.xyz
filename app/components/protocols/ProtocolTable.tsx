import { Fragment, useId, useMemo, useState } from 'react';
import { Link } from 'react-router';
import {
  EVIDENCE_LABELS,
  PROTOCOLS,
  SIGNAL_LABELS,
  type PixelProtocol,
  type ProtocolMember,
  type SignalKind,
} from '~/lib/protocols/families';

const SHOWN = 10;
const ORDER: SignalKind[] = [
  'single-wire',
  'single-wire-inverted',
  'packet',
  'manchester',
  'uart',
  'clocked',
  'dmx512',
];

/** A part's name, linked to its entry; parts without a datasheet are marked */
function PartLink({ member }: { member: ProtocolMember }) {
  const mark =
    member.evidence === 'datasheet' ? null : (
      <span className={`proto-evidence proto-evidence--${member.evidence}`}>
        {member.evidence === 'claim' ? ' (claim)' : ' (no document)'}
      </span>
    );
  return (
    <>
      {member.ref ? <Link to={`/${member.ref}`}>{member.name}</Link> : member.name}
      {mark}
    </>
  );
}

function Members({ protocol }: { protocol: PixelProtocol }) {
  const members = protocol.members;
  const head = members.slice(0, SHOWN);
  const rest = members.slice(SHOWN);
  const noted = members.filter((m) => m.note);
  return (
    <>
      <div className="proto-members">
        {head.map((m, i) => (
          <Fragment key={m.name}>
            {i > 0 && ', '}
            <PartLink member={m} />
          </Fragment>
        ))}
        {rest.length > 0 && (
          <details className="proto-more">
            <summary>{rest.length} more</summary>
            {rest.map((m, i) => (
              <Fragment key={m.name}>
                {i > 0 && ', '}
                <PartLink member={m} />
              </Fragment>
            ))}
          </details>
        )}
      </div>
      {noted.length > 0 && (
        <details className="proto-differences">
          <summary>What differs between them</summary>
          <ul>
            {noted.map((m) => (
              <li key={m.name}>
                <strong>{m.name}</strong>: {m.note}
              </li>
            ))}
          </ul>
        </details>
      )}
    </>
  );
}

/**
 * Every pixel and pixel IC in the database, grouped by what it receives on
 * the wire: one card per protocol, grouped by kind of signal.
 */
export function ProtocolTable() {
  return (
    <div className="proto-families">
      {ORDER.map((kind) => {
        const protocols = PROTOCOLS.filter((p) => p.signal === kind);
        if (protocols.length === 0) return null;
        return (
          // A plain group, not a landmark: "DMX512" would clash with the page's DMX512 section
          <div key={kind} className="proto-family-group">
            <h3>{SIGNAL_LABELS[kind]}</h3>
            <div className="proto-family-list">
              {protocols.map((p) => (
                <article key={p.id} id={`protocol-${p.id}`} className="proto-family">
                  <h4>
                    {p.name}{' '}
                    <span className="proto-family-count">
                      {p.members.length} {p.members.length === 1 ? 'part' : 'parts'}
                    </span>
                  </h4>
                  <p className="proto-family-wire">{p.wire}</p>
                  <Members protocol={p} />
                </article>
              ))}
            </div>
          </div>
        );
      })}
      <p className="proto-caption">
        &ldquo;(claim)&rdquo;: {EVIDENCE_LABELS.claim}, with no published timing to check it
        against. &ldquo;(no document)&rdquo;: {EVIDENCE_LABELS.none}; where the part is filed is a
        placeholder.
      </p>
    </div>
  );
}

interface Option {
  key: string;
  member: ProtocolMember;
  protocol: PixelProtocol;
}

/** Pick two parts; say whether they are the same on the wire, and what differs */
export function SameChecker() {
  const id = useId();
  const options = useMemo<Option[]>(
    () =>
      PROTOCOLS.flatMap((protocol) =>
        protocol.members.map((member) => ({
          key: `${protocol.id}:${member.name}`,
          member,
          protocol,
        }))
      ).sort((a, b) => a.member.name.localeCompare(b.member.name, 'en', { numeric: true })),
    []
  );
  const find = (name: string) => options.find((o) => o.member.name === name)!.key;
  const [a, setA] = useState(() => find('WS2812, WS2812B'));
  const [b, setB] = useState(() => find('SK6812'));
  const first = options.find((o) => o.key === a)!;
  const second = options.find((o) => o.key === b)!;

  let verdict: React.ReactNode;
  if (first.key === second.key) {
    verdict = <>That&rsquo;s the same part twice.</>;
  } else if (first.protocol.id === second.protocol.id) {
    const notes = [first, second].filter((o) => o.member.note);
    verdict = (
      <>
        <strong>The same on the wire</strong>: both take the {first.protocol.name} protocol.
        {notes.length > 0 && (
          <>
            {' '}
            What still differs:{' '}
            {notes.map((o, i) => (
              <Fragment key={o.key}>
                {i > 0 && '; '}
                {o.member.name}: {o.member.note}
              </Fragment>
            ))}
            .
          </>
        )}
      </>
    );
  } else if (first.protocol.signal === second.protocol.signal) {
    verdict = (
      <>
        <strong>Not the same</strong>, though both use the same kind of signal (
        {SIGNAL_LABELS[first.protocol.signal].toLowerCase()}). {first.member.name}:{' '}
        {first.protocol.wire} {second.member.name}: {second.protocol.wire}
      </>
    );
  } else {
    verdict = (
      <>
        <strong>Different signals</strong>: {first.member.name} takes{' '}
        {SIGNAL_LABELS[first.protocol.signal].toLowerCase()} ({first.protocol.name}),{' '}
        {second.member.name} {SIGNAL_LABELS[second.protocol.signal].toLowerCase()} (
        {second.protocol.name}).
      </>
    );
  }
  const weak = [first, second].filter((o) => o.member.evidence !== 'datasheet');

  const select = (value: string, onChange: (v: string) => void, label: string, n: number) => (
    <label className="proto-checker-field" htmlFor={`${id}-${n}`}>
      <span>{label}</span>
      <select id={`${id}-${n}`} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.member.name}
          </option>
        ))}
      </select>
    </label>
  );

  return (
    <div className="proto-checker">
      <div className="proto-checker-fields">
        {select(a, setA, 'This part', 1)}
        {select(b, setB, 'and this one', 2)}
      </div>
      <p className="proto-checker-verdict" aria-live="polite">
        {verdict}
        {weak.length > 0 && (
          <>
            {' '}
            <span className="proto-evidence">
              ({weak.map((o) => o.member.name).join(' and ')}:{' '}
              {weak.length === 1
                ? EVIDENCE_LABELS[weak[0].member.evidence]
                : 'not backed by a datasheet'}
              .)
            </span>
          </>
        )}
      </p>
    </div>
  );
}
