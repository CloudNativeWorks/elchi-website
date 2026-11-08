// Shared building blocks of the relief-map design (see DESIGN.md, styles in relief.css).
// Every marketing page wraps its content in <main className="rl"> and is built from these.

/* One elevation band of the relief: tone sets it apart from its neighbours, never a rule.
   tone: mist (the ground) · mist2 · water · sage · moss · deep (the dark lake band) */
export function Band({ tone = 'mist', id, className = '', children }) {
  return (
    <section className={`rl-band rl-${tone} ${className}`} id={id}>
      <div className="rl-wrap">{children}</div>
    </section>
  );
}

/* A band's opening: the heading on the left, its lede bottom-right. No eyebrow above the heading. */
export function BandHead({ h2, intro }) {
  return (
    <header className="rl-head">
      <h2 className="rl-h2">{h2}</h2>
      {intro && <p className="rl-lede">{intro}</p>}
    </header>
  );
}

/* The opening of an inner page: one headline, a lede and up to two actions over the contour ground.
   `aside` (optional) sits to the right on wide screens (a fact panel, a picture). */
export function PageHero({ title, lede, actions, aside }) {
  return (
    <section className="rl-page-hero">
      <div className={`rl-page-hero-in${aside ? ' has-aside' : ''}`}>
        <div className="rl-page-hero-copy">
          <h1 className="rl-h1">{title}</h1>
          {lede && <p className="rl-hero-p">{lede}</p>}
          {actions && <div className="rl-actions">{actions}</div>}
        </div>
        {aside && <div className="rl-page-hero-aside">{aside}</div>}
      </div>
    </section>
  );
}

export const Tick = () => (
  <svg className="rl-tick" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><circle cx="10" cy="10" r="9" fill="currentColor" opacity=".14"/><path d="M6 10.4l2.6 2.6L14 7.6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const Dash = () => (
  <svg className="rl-dash" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true"><path d="M6.5 10h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
);
export const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9.5M8.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
);
export const Play = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true"><path d="M3 1.8v8.4a.6.6 0 0 0 .9.5l7-4.2a.6.6 0 0 0 0-1L3.9 1.3a.6.6 0 0 0-.9.5z" fill="currentColor"/></svg>
);
