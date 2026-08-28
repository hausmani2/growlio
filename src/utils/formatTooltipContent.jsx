import React from 'react';

/** Phrases bolded when present in tooltip copy (longest first for matching). */
const HIGHLIGHT_PHRASES = [
  'Labor performance',
  'COGS performance',
  'Rent performance',
  'Operating expenses',
  'operating expenses',
  'Target percentage',
  'goal percentage',
  'labor target',
  'Labor target',
  'COGS target',
  'Rent target',
  'At or below goal',
  'At or below the goal',
  'at or below your goal',
  'at or below this target',
  'Above goal',
  'Above the goal',
  'above goal',
  'Profitability',
  'profitability',
  'target %',
  'nickname',
  'label',
].sort((a, b) => b.length - a.length);

/** Matches Report Card gauge colors already used in the design system. */
const STATUS_DOT_COLORS = {
  Green: '#16a34a',
  Yellow: '#facc15',
  Red: '#dc2626',
};

const STATUS_COLORS = Object.keys(STATUS_DOT_COLORS);

const SENTENCE_SPLIT_RE = /(?<=[.!?])\s+(?=[A-Z“"'])/;

/**
 * Soft-split a single long paragraph into smaller ones (~2 sentences each).
 */
function softSplitParagraph(text) {
  const trimmed = text.trim();
  if (!trimmed) return [];

  const sentences = trimmed
    .split(SENTENCE_SPLIT_RE)
    .map((s) => s.trim())
    .filter(Boolean);
  if (sentences.length <= 2) return [trimmed];

  const paragraphs = [];
  for (let i = 0; i < sentences.length; i += 2) {
    paragraphs.push(sentences.slice(i, i + 2).join(' '));
  }
  return paragraphs;
}

/**
 * Split raw tooltip text into paragraph blocks and optional trailing status lines.
 */
function splitBlocks(raw) {
  const normalized = String(raw).replace(/\r\n/g, '\n').trim();
  if (!normalized) return { paragraphs: [], statusLines: [] };

  // Always peel color-status sentences from the full text first so
  // "Green … Yellow … Red …" never collapses into a single list item.
  const { prose, statusLines } = extractInlineStatusSentences(normalized);

  const paragraphs = [];
  if (prose) {
    const chunks = prose.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
    if (chunks.length <= 1) {
      paragraphs.push(...softSplitParagraph(chunks[0] || prose));
    } else {
      chunks.forEach((chunk) => {
        paragraphs.push(...softSplitParagraph(chunk.replace(/\n+/g, ' ').trim()));
      });
    }
  }

  return { paragraphs, statusLines };
}

/**
 * Peel Green/Yellow/Red explanations from a prose blob.
 * Supports both "Green: …" and "Green means …".
 * Each color starts a new status line (Yellow/Red get their own rows like Green).
 */
function extractInlineStatusSentences(text) {
  const source = String(text);
  const startRe = /\b(Green|Yellow|Red)\s*(?::|means)\s*/gi;
  const starts = [...source.matchAll(startRe)];

  if (!starts.length) {
    return { prose: source, statusLines: [] };
  }

  // Need at least one color explanation; prefer 2+ for legend sections.
  // A lone trailing "Green means …" still becomes a status row.
  const firstIdx = starts[0].index ?? 0;
  const prose = source.slice(0, firstIdx).replace(/\s+/g, ' ').trim();

  const statusLines = starts.map((m, i) => {
    const start = m.index ?? 0;
    const end = i + 1 < starts.length ? (starts[i + 1].index ?? source.length) : source.length;
    return source.slice(start, end).replace(/\s+/g, ' ').trim();
  }).filter(Boolean);

  return { prose, statusLines };
}

/**
 * Apply **markdown** bold and highlight-phrase bolding to a string → React nodes.
 */
function formatInlineText(text, keyPrefix) {
  if (!text) return null;

  const mdParts = String(text).split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '');

  const nodes = [];
  mdParts.forEach((part, partIdx) => {
    const mdMatch = /^\*\*([^*]+)\*\*$/.exec(part);
    if (mdMatch) {
      nodes.push(
        <strong key={`${keyPrefix}-md-${partIdx}`} style={{ fontWeight: 700 }}>
          {mdMatch[1]}
        </strong>
      );
      return;
    }
    nodes.push(...highlightPhrases(part, `${keyPrefix}-${partIdx}`));
  });

  return nodes;
}

function highlightPhrases(text, keyPrefix) {
  if (!text) return [];

  const escaped = HIGHLIGHT_PHRASES.map((p) =>
    p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );
  if (!escaped.length) return [text];

  const re = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(re);

  return parts
    .filter((p) => p !== '')
    .map((part, i) => {
      const isHighlight = HIGHLIGHT_PHRASES.some(
        (phrase) => phrase.toLowerCase() === part.toLowerCase()
      );
      if (isHighlight) {
        return (
          <strong key={`${keyPrefix}-h-${i}`} style={{ fontWeight: 700 }}>
            {part}
          </strong>
        );
      }
      return part;
    });
}

function formatStatusLabel(label) {
  const canonical = STATUS_COLORS.find(
    (c) => c.toLowerCase() === String(label).toLowerCase()
  );
  return canonical || label;
}

function parseStatusLine(line) {
  const trimmedLine = line.trim();
  // Keep original connector text (" means " / ": ") so wording stays unchanged.
  const match = /^(Green|Yellow|Red)(\s*(?::|means)\s*)(.+)$/i.exec(trimmedLine);
  if (!match) return { label: null, connector: null, rest: trimmedLine };
  return {
    label: formatStatusLabel(match[1]),
    connector: match[2],
    rest: String(match[3] || '').trim(),
  };
}

/**
 * Short title-like first line → bold header (only when already present in copy).
 */
function isTitleParagraph(text, hasMoreContent) {
  if (!hasMoreContent || !text) return false;
  const t = text.trim();
  if (t.length > 72) return false;
  if (/^How\b/i.test(t)) return true;
  if (/^What the colors mean$/i.test(t)) return true;
  if (!/[.!?]$/.test(t) && t.split(/\s+/).length <= 10) return true;
  return false;
}

/**
 * Format CMS tooltip plain text into semantic React nodes for Ant Design Tooltip title.
 * Does not invent copy or use dangerouslySetInnerHTML. Passes ReactNode through unchanged.
 */
export default function formatTooltipContent(text) {
  if (text == null || text === false) return null;
  if (typeof text !== 'string') return text;

  const trimmed = text.trim();
  if (!trimmed) return null;

  const { paragraphs, statusLines } = splitBlocks(trimmed);
  const hasStatus = statusLines.length > 0;

  let bodyParagraphs = [...paragraphs];
  let colorsSectionTitle = null;
  const colorsTitleIdx = bodyParagraphs.findIndex((p) =>
    /^What the colors mean\.?$/i.test(p.trim())
  );
  if (colorsTitleIdx >= 0) {
    colorsSectionTitle = bodyParagraphs[colorsTitleIdx].trim().replace(/\.$/, '');
    bodyParagraphs = bodyParagraphs.filter((_, i) => i !== colorsTitleIdx);
  }

  const firstIsTitle = isTitleParagraph(
    bodyParagraphs[0],
    bodyParagraphs.length > 1 || hasStatus
  );
  const titleParagraph = firstIsTitle ? bodyParagraphs[0] : null;
  const restParagraphs = firstIsTitle ? bodyParagraphs.slice(1) : bodyParagraphs;

  return (
    <div
      className="tooltip-formatted-content"
      style={{
        textAlign: 'left',
        lineHeight: 1.55,
        margin: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {titleParagraph && (
        <div
          style={{
            fontWeight: 700,
            marginBottom: restParagraphs.length || hasStatus ? 10 : 0,
            lineHeight: 1.55,
          }}
        >
          {formatInlineText(titleParagraph, 'title')}
        </div>
      )}

      {restParagraphs.map((para, i) => (
        <div
          key={`p-${i}`}
          style={{
            margin: 0,
            paddingBottom:
              i < restParagraphs.length - 1 || hasStatus ? 11 : 0,
            lineHeight: 1.55,
          }}
        >
          {formatInlineText(para, `p-${i}`)}
        </div>
      ))}

      {hasStatus && (
        <>
          <hr
            style={{
              border: 'none',
              borderTop: '1px solid rgba(255, 255, 255, 0.28)',
              margin: '12px 0',
              width: '100%',
            }}
          />
          {colorsSectionTitle && (
            <div
              style={{
                fontWeight: 700,
                marginBottom: 8,
                lineHeight: 1.55,
              }}
            >
              {formatInlineText(colorsSectionTitle, 'colors-title')}
            </div>
          )}
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              textAlign: 'left',
            }}
          >
            {statusLines.map((line, i) => {
              const { label, connector, rest } = parseStatusLine(line);
              const dotColor = label ? STATUS_DOT_COLORS[label] : '#ffffff';

              return (
                <li
                  key={`s-${i}`}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 8,
                    marginBottom: i < statusLines.length - 1 ? 8 : 0,
                    lineHeight: 1.55,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      flexShrink: 0,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: dotColor,
                      marginTop: 6,
                    }}
                  />
                  <span>
                    {label ? (
                      <>
                        <strong style={{ fontWeight: 700 }}>{label}</strong>
                        {connector}
                        {formatInlineText(rest, `s-${i}`)}
                      </>
                    ) : (
                      formatInlineText(line, `s-${i}`)
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </div>
  );
}
