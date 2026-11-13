// Shared layout of the long-form pages (privacy.jsx, about.jsx): an in-page
// contents list and one text panel with a <section> per entry. Styles: legal.css.

export function LegalDoc({ tocLabel, sections }) {
  return (
    <div className="legal-layout">
      <nav className="legal-toc" aria-label={tocLabel}>
        <span className="legal-toc-h">{tocLabel}</span>
        {sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.title}</a>)}
      </nav>
      <article className="legal-doc">
        {sections.map((s) => (
          <section key={s.id} id={s.id} aria-labelledby={`${s.id}-h`}>
            <h2 id={`${s.id}-h`}>{s.title}</h2>
            {s.body}
          </section>
        ))}
      </article>
    </div>
  );
}

// An external link that opens in a new tab.
export const Ext = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener">{children}</a>
);

// A simple table: head = [..labels], rows = [[..cells]].
export function Table({ head, rows, caption }) {
  return (
    <div className="legal-table-wrap" role="region" aria-label={caption} tabIndex={0}>
      <table className="legal-table">
        <caption className="sr">{caption}</caption>
        <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}
        </tbody>
      </table>
    </div>
  );
}
