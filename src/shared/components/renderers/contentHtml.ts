/**
 * contentHtml — turns raw question text into the HTML the RichText WebView renders.
 *
 * This is the native counterpart of the PWA's `MathRenderer` + `TableRenderer` +
 * `CodeBlockRenderer` trio. React Native has no DOM, so instead of composing React
 * elements per segment we compose one HTML document that a single WebView renders.
 * Doing it in one pass keeps a question to one WebView instead of one per segment.
 */
import parseContent from './parseContent';

type Segment = {
    type: string;
    content?: string;
    language?: string;
    alt?: string;
    src?: string;
};

// ---------------------------------------------------------------------------
// Escaping helpers
// ---------------------------------------------------------------------------

const decodeEntities = (str: string): string =>
    str
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&nbsp;/g, ' ');

const cleanLatex = (content: string): string =>
    decodeEntities(content).replace(/\u00A0/g, ' ');

const escapeHtml = (str: string): string =>
    str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');

const escapeAttr = escapeHtml;

/**
 * Question bodies contain presentational HTML (<b>, <sub>, <ul>) that we pass through,
 * but never scripts or event handlers.
 */
const sanitizeInlineHtml = (str: string): string =>
    str
        .replace(/<\s*(script|iframe|object|embed)[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
        .replace(/<\s*(script|iframe|object|embed)[^>]*>/gi, '')
        .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
        .replace(/javascript:/gi, '');

// ---------------------------------------------------------------------------
// Code highlighting — a small tokenizer covering the languages in the bank.
// ---------------------------------------------------------------------------

const KEYWORDS = new Set([
    'auto', 'break', 'case', 'char', 'const', 'continue', 'default', 'do', 'double', 'else',
    'enum', 'extern', 'float', 'for', 'goto', 'if', 'int', 'long', 'register', 'return',
    'short', 'signed', 'sizeof', 'static', 'struct', 'switch', 'typedef', 'union', 'unsigned',
    'void', 'volatile', 'while', 'class', 'public', 'private', 'protected', 'new', 'delete',
    'this', 'true', 'false', 'null', 'nullptr', 'def', 'import', 'from', 'as', 'pass', 'None',
    'True', 'False', 'elif', 'try', 'except', 'finally', 'lambda', 'function', 'var', 'let',
    'const', 'begin', 'end', 'then', 'procedure', 'print', 'printf', 'scanf', 'main', 'in',
    'and', 'or', 'not', 'is', 'with', 'yield', 'raise', 'global', 'boolean', 'string',
]);

function highlightCode(code: string): string {
    // Tokenise comments and strings first so keywords inside them are left alone.
    const pattern = /(\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/g;
    let out = '';
    let last = 0;
    let match: RegExpExecArray | null;

    // One pass over numbers and identifiers together: a second pass would
    // re-scan the markup this one inserts and highlight words like "class"
    // inside the emitted <span> tags.
    const highlightWords = (chunk: string) =>
        escapeHtml(chunk).replace(/\b\d+(?:\.\d+)?\b|\b[A-Za-z_]\w*\b/g, (token) =>
            /^\d/.test(token)
                ? `<span class="tk-num">${token}</span>`
                : KEYWORDS.has(token)
                  ? `<span class="tk-kw">${token}</span>`
                  : token
        );

    while ((match = pattern.exec(code)) !== null) {
        out += highlightWords(code.slice(last, match.index));
        const token = match[0];
        const cls = token.startsWith('"') || token.startsWith("'") ? 'tk-str' : 'tk-com';
        out += `<span class="${cls}">${escapeHtml(token)}</span>`;
        last = match.index + token.length;
    }
    out += highlightWords(code.slice(last));
    return out;
}

function codeBlockHtml(raw: string, language?: string): string {
    let code = raw;
    let lang = language || '';

    if (code.startsWith('```')) {
        const firstLineEnd = code.indexOf('\n');
        const firstLine = code.substring(3, firstLineEnd === -1 ? code.length : firstLineEnd).trim();
        if (firstLine && !firstLine.includes('```')) lang = firstLine;

        const lastFence = code.lastIndexOf('```');
        if (firstLineEnd !== -1 && lastFence > firstLineEnd) {
            code = code.substring(firstLineEnd + 1, lastFence).trim();
        } else if (firstLineEnd !== -1) {
            code = code.substring(firstLineEnd + 1).trim();
        }
    }

    const label = lang ? `<div class="code-lang">${escapeHtml(lang)}</div>` : '';
    return `<div class="code-wrap">${label}<pre class="code"><code>${highlightCode(code)}</code></pre></div>`;
}

// ---------------------------------------------------------------------------
// Tables — markdown pipe tables and LaTeX tabular blocks
// ---------------------------------------------------------------------------

type ParsedTable = { caption: string | null; headers: string[]; rows: string[][] };

const isAlignmentRow = (cells: string[]): boolean =>
    cells.length > 0 && cells.every((c) => /^:?-{3,}:?$/.test(c.replace(/\s+/g, '')));

function parseMarkdownTables(text: string): ParsedTable[] {
    const out: ParsedTable[] = [];
    const normalized = text.replace(/<br\s*\/?>/gi, '\n').replace(/&nbsp;/gi, ' ');
    const lines = normalized.split('\n');

    let current: string[] = [];

    const flush = () => {
        if (current.length < 2) {
            current = [];
            return;
        }

        const rows = current.map((line) =>
            line.split('|').filter((cell) => cell.trim() !== '').map((c) => c.trim())
        );

        if (rows.length < 2) {
            current = [];
            return;
        }

        const alignIdx = rows.findIndex(isAlignmentRow);

        if (alignIdx !== -1) {
            if (alignIdx === 0 || rows.length <= alignIdx + 1) {
                current = [];
                return;
            }

            const headerRowIdx = alignIdx - 1;
            const maybeHeader = rows[headerRowIdx];

            if (maybeHeader) {
                let caption: string | null = null;
                const looksHeader = maybeHeader.some((c) => /[A-Za-z$\\]/.test(c));

                if (looksHeader && headerRowIdx - 1 >= 0) {
                    const maybeCaption = rows[headerRowIdx - 1];
                    if (
                        maybeCaption &&
                        maybeCaption.every((c) => c.length <= 3 || c === '' || /^(R|S)$/i.test(c))
                    ) {
                        caption = maybeCaption.join(' ');
                    }
                }

                out.push({ caption, headers: maybeHeader, rows: rows.slice(alignIdx + 1) });
            }

            current = [];
            return;
        }

        out.push({ caption: null, headers: rows[0]!, rows: rows.slice(1) });
        current = [];
    };

    for (const line of lines) {
        if (line.trim().startsWith('|')) current.push(line);
        else flush();
    }
    flush();
    return out;
}

function parseLatexTabular(text: string): ParsedTable[] {
    const out: ParsedTable[] = [];
    const normalized = text.replace(/<br\s*\/?>/gi, '\n');
    const re = /\\begin\{tabular\}[\s\S]*?\n([\s\S]*?)\\end\{tabular\}/g;

    let match: RegExpExecArray | null;
    while ((match = re.exec(normalized)) !== null) {
        const cleaned = (match[1] ?? '').replace(/\\hline/g, '').trim();
        const rawRows = cleaned.split(/\\\\\s*/).map((r) => r.trim()).filter(Boolean);
        if (rawRows.length === 0) continue;

        const rows = rawRows.map((r) => r.split('&').map((c) => c.trim()));
        out.push({ caption: null, headers: rows[0]!, rows: rows.slice(1) });
    }
    return out;
}

// ---------------------------------------------------------------------------
// Splitting text from table blocks (port of the PWA's splitTextAndTables)
// ---------------------------------------------------------------------------

type Range = { start: number; end: number };

function splitTextAndTables(fullText: string): { type: 'text' | 'table'; content: string }[] {
    const ranges: Range[] = [];

    const latexRe = /\\begin\{tabular\}[\s\S]*?\\end\{tabular\}/g;
    let m: RegExpExecArray | null;
    while ((m = latexRe.exec(fullText)) !== null) {
        ranges.push({ start: m.index, end: m.index + m[0].length });
    }

    const lines = fullText.split('\n');
    const offsets: number[] = [];
    let acc = 0;
    for (const ln of lines) {
        offsets.push(acc);
        acc += ln.length + 1;
    }

    let i = 0;
    while (i < lines.length) {
        if (lines[i]!.trim().startsWith('|')) {
            const startLine = i;
            const blockLines: string[] = [];
            let j = i;
            while (j < lines.length && lines[j]!.trim().startsWith('|')) {
                blockLines.push(lines[j]!);
                j++;
            }
            if (blockLines.length >= 2) {
                const rows = blockLines.map((l) =>
                    l.split('|').filter((c) => c.trim() !== '').map((c) => c.trim())
                );
                const alignIdx = rows.findIndex(isAlignmentRow);
                if (alignIdx > 0 && rows.length > alignIdx + 1) {
                    ranges.push({
                        start: offsets[startLine]!,
                        end: j < lines.length ? offsets[j]! : fullText.length,
                    });
                    i = j;
                    continue;
                }
            }
        }
        i++;
    }

    ranges.sort((a, b) => a.start - b.start);
    const merged: Range[] = [];
    for (const r of ranges) {
        if (merged.length === 0 || r.start >= merged[merged.length - 1]!.end) merged.push(r);
    }

    const segs: { type: 'text' | 'table'; content: string }[] = [];
    let cursor = 0;
    for (const r of merged) {
        if (cursor < r.start) segs.push({ type: 'text', content: fullText.slice(cursor, r.start) });
        segs.push({ type: 'table', content: fullText.slice(r.start, r.end) });
        cursor = r.end;
    }
    if (cursor < fullText.length) segs.push({ type: 'text', content: fullText.slice(cursor) });
    return segs;
}

// ---------------------------------------------------------------------------
// Segment rendering
// ---------------------------------------------------------------------------

const mathSpan = (content: string) =>
    `<span class="km" data-m="${escapeAttr(cleanLatex(content))}"></span>`;

const mathBlock = (content: string) =>
    `<div class="kb" data-m="${escapeAttr(cleanLatex(content))}"></div>`;

function imageUrl(src: string, cloudName?: string): string {
    if (!src) return '';
    if (!cloudName) return src;
    // Cloudinary fetch proxy. Beyond the PWA's f_auto/q_auto this caps the
    // width: question diagrams are often scanned at 2000px+, and a phone never
    // needs more than ~900, which is most of the download time on mobile data.
    return `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_900,c_limit/${encodeURIComponent(src)}`;
}

function renderSegments(text: string, cloudName?: string): string {
    if (!text) return '';

    return parseContent(text)
        .map((segment: Segment) => {
            switch (segment.type) {
                case 'math':
                    return mathSpan(segment.content ?? '');
                case 'blockMath':
                    return mathBlock(segment.content ?? '');
                case 'code':
                    return codeBlockHtml(segment.content ?? '', segment.language);
                case 'inlineCode':
                    return `<code class="ic">${escapeHtml(segment.content ?? '')}</code>`;
                case 'lineBreak':
                    return '<br/>';
                case 'image':
                    return `<div class="img-wrap"><img src="${escapeAttr(
                        imageUrl(segment.src ?? '', cloudName)
                    )}" alt="${escapeAttr(segment.alt ?? '')}"/></div>`;
                default:
                    return sanitizeInlineHtml(decodeEntities(segment.content ?? ''));
            }
        })
        .join('');
}

/** Renders a text run, keeping `<ul>` blocks intact the way the PWA does. */
function renderTextBlock(text: string, cloudName?: string): string {
    return text
        .split(/(<ul>[\s\S]*?<\/ul>)/gi)
        .map((part) => {
            if (!part) return '';
            if (part.toLowerCase().startsWith('<ul>')) {
                const items = part.match(/<li>([\s\S]*?)<\/li>/gi);
                if (!items) return '';
                const lis = items
                    .map((li) => `<li>${renderSegments(li.replace(/<\/?li>/gi, ''), cloudName)}</li>`)
                    .join('');
                return `<ul>${lis}</ul>`;
            }
            return renderSegments(part, cloudName);
        })
        .join('');
}

function renderTable(tableText: string, cloudName?: string): string {
    const tables = [...parseMarkdownTables(tableText), ...parseLatexTabular(tableText)];
    if (tables.length === 0) return '';

    return tables
        .map((tbl) => {
            const caption = tbl.caption
                ? `<div class="tbl-caption">${renderSegments(tbl.caption, cloudName)}</div>`
                : '';
            const head = tbl.headers
                .map((h) => `<th>${renderSegments(h, cloudName)}</th>`)
                .join('');
            const body = tbl.rows
                .map(
                    (row) =>
                        `<tr>${row.map((c) => `<td>${renderSegments(c, cloudName)}</td>`).join('')}</tr>`
                )
                .join('');
            return `<div class="tbl-scroll">${caption}<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
        })
        .join('');
}

/** Builds the body HTML for a piece of question content. */
export function buildContentHtml(text: string, cloudName?: string): string {
    if (!text) return '';

    // Whole-string shortcuts, matching the PWA's fast paths.
    if (text.startsWith('```') && text.endsWith('```')) return codeBlockHtml(text);

    if (text.startsWith('$$') && text.endsWith('$$') && text.indexOf('$$', 2) === text.length - 2) {
        return mathBlock(text.slice(2, -2));
    }

    if (text.startsWith('$') && text.endsWith('$') && text.indexOf('$', 1) === text.length - 1) {
        return mathSpan(text.slice(1, -1));
    }

    return splitTextAndTables(text)
        .map((seg) =>
            seg.type === 'table'
                ? renderTable(seg.content, cloudName)
                : renderTextBlock(seg.content, cloudName)
        )
        .join('');
}

/**
 * True when the content needs the WebView. Plain prose renders far faster as a
 * native <Text>, and most option labels are plain prose.
 */
export function needsRichRendering(text: string): boolean {
    if (!text) return false;
    return /[$`|<]|!\[|\\begin|\\\(|\\\[/.test(text);
}

/** Strips markup so plain content can be rendered as native text. */
export function toPlainText(text: string): string {
    return decodeEntities(text)
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .trim();
}
