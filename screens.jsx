// Screenshot components shared by the home gallery and the product pages:
// a Light/Dark switch (starts from the visitor's system theme), a framed
// screenshot with a draggable light|dark compare, and a lightbox.
import { useCallback, useEffect, useRef, useState } from 'react';
import { getLocale } from './i18n.js';
import { SHOT_CATS, SHOTS, shotSrc, shotById } from './screens-data.js';
import './screens.css';

const UI = {
  en: { light: 'Light', dark: 'Dark', themes: 'Every screen ships in light and dark — Elchi follows your system theme.', drag: 'Drag to compare', open: 'Full size', close: 'Close', prev: 'Previous', next: 'Next', more: n => `Show all ${n} screens`, less: 'Show fewer' },
  tr: { light: 'Açık', dark: 'Koyu', themes: 'Her ekran açık ve koyu temayla gelir — Elchi sistem temanızı izler.', drag: 'Karşılaştırmak için sürükleyin', open: 'Tam boyut', close: 'Kapat', prev: 'Önceki', next: 'Sonraki', more: n => `${n} ekranın tümünü göster`, less: 'Daha az göster' },
};

const systemTheme = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

// The visitor's system theme until they pick one; follows system changes until then.
export function useShotTheme() {
  const [theme, setTheme] = useState(systemTheme);
  const picked = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const on = () => { if (!picked.current) setTheme(mq.matches ? 'dark' : 'light'); };
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const pick = useCallback(t => { picked.current = true; setTheme(t); }, []);
  return [theme, pick];
}

const Sun = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>
);
const Moon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
);

export function ThemeSwitch({ theme, onChange }) {
  const u = UI[getLocale()];
  return (
    <div className="shot-switch" role="radiogroup" aria-label="Screenshot theme">
      <span className={`shot-switch-thumb ${theme}`} aria-hidden="true"></span>
      <button role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => onChange('light')}><Sun/> {u.light}</button>
      <button role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => onChange('dark')}><Moon/> {u.dark}</button>
    </div>
  );
}

// Both themes stacked, crossfading — the switch shows the same screen change theme.
export function ThemedImg({ id, theme, alt, eager }) {
  return (
    <span className="themed-img">
      <img src={shotSrc(id, 'light')} alt={theme === 'light' ? alt : ''} loading={eager ? 'eager' : 'lazy'} decoding="async" className={theme === 'light' ? 'on' : ''}/>
      <img src={shotSrc(id, 'dark')} alt={theme === 'dark' ? alt : ''} loading={eager ? 'eager' : 'lazy'} decoding="async" className={theme === 'dark' ? 'on' : ''}/>
    </span>
  );
}

function Chrome({ children, title, dark }) {
  return (
    <div className={`shot-frame ${dark ? 'dark' : ''}`}>
      <div className="shot-bar">
        <span className="shot-dots"><i></i><i></i><i></i></span>
        <span className="shot-url mono">elchi.example.com / {title}</span>
      </div>
      <div className="shot-body">{children}</div>
    </div>
  );
}

// Light on the left, dark on the right, split where the handle is.
export function CompareShot({ id, theme, onOpen }) {
  const u = UI[getLocale()];
  const s = shotById[id];
  const [split, setSplit] = useState(null); // null = show `theme` whole
  const box = useRef(null);
  const move = useCallback(clientX => {
    const r = box.current?.getBoundingClientRect();
    if (r) setSplit(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100)));
  }, []);
  useEffect(() => setSplit(null), [id, theme]);
  const drag = e => {
    e.preventDefault();
    const pt = ev => (ev.touches ? ev.touches[0].clientX : ev.clientX);
    move(pt(e));
    const mm = ev => move(pt(ev));
    const up = () => { window.removeEventListener('pointermove', mm); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', mm);
    window.addEventListener('pointerup', up);
  };
  const pos = split ?? (theme === 'dark' ? 0 : 100);
  return (
    <Chrome title={s[getLocale()][0]} dark={pos < 50}>
      <div className="compare" ref={box}>
        <img src={shotSrc(id, 'dark')} alt={`${s[getLocale()][0]} — ${u.dark}`} className="compare-base"/>
        <img src={shotSrc(id, 'light')} alt={`${s[getLocale()][0]} — ${u.light}`} className="compare-top"
             style={{ clipPath: `inset(0 ${100 - pos}% 0 0)`, transition: split === null ? 'clip-path .5s ease' : 'none' }}/>
        <div className="compare-handle" style={{ left: `${pos}%`, transition: split === null ? 'left .5s ease' : 'none' }}
             onPointerDown={drag} role="slider" aria-label={u.drag} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pos)} tabIndex={0}
             onKeyDown={e => { if (e.key === 'ArrowLeft') setSplit(Math.max(0, pos - 5)); if (e.key === 'ArrowRight') setSplit(Math.min(100, pos + 5)); }}>
          <span className={`compare-knob ${pos > 96 ? 'at-right' : pos < 4 ? 'at-left' : ''}`}><Sun/><Moon/></span>
        </div>
        <button className="compare-hint mono" onPointerDown={drag}>⇆ {u.drag}</button>
        {onOpen && <button className="shot-open" onClick={onOpen}>{u.open} ↗</button>}
      </div>
    </Chrome>
  );
}

export function Lightbox({ ids, index, theme, onTheme, onIndex, onClose }) {
  const u = UI[getLocale()];
  const loc = getLocale();
  useEffect(() => {
    const k = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onIndex((index + 1) % ids.length);
      if (e.key === 'ArrowLeft') onIndex((index - 1 + ids.length) % ids.length);
    };
    window.addEventListener('keydown', k);
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = o; };
  }, [index, ids.length, onClose, onIndex]);
  const s = shotById[ids[index]];
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={s[loc][0]} onClick={onClose}>
      <div className="lightbox-top" onClick={e => e.stopPropagation()}>
        <div>
          <span className="mono lightbox-count">{index + 1} / {ids.length}</span>
          <h4>{s[loc][0]}</h4>
          <p>{s[loc][1]}</p>
        </div>
        <ThemeSwitch theme={theme} onChange={onTheme}/>
        <button className="lightbox-x" onClick={onClose} aria-label={u.close}>×</button>
      </div>
      <div className="lightbox-stage" onClick={e => e.stopPropagation()}>
        <button className="lightbox-nav prev" onClick={() => onIndex((index - 1 + ids.length) % ids.length)} aria-label={u.prev}>‹</button>
        <ThemedImg id={s.id} theme={theme} alt={s[loc][0]} eager/>
        <button className="lightbox-nav next" onClick={() => onIndex((index + 1) % ids.length)} aria-label={u.next}>›</button>
      </div>
    </div>
  );
}

export function ShotCard({ id, theme, onClick, active }) {
  const s = shotById[id];
  const loc = getLocale();
  return (
    <button className={`ss-card ${active ? 'active' : ''}`} onClick={onClick}>
      <div className="ss-img">
        <ThemedImg id={id} theme={theme} alt={s[loc][0]}/>
        <span className="ss-cat mono">{SHOT_CATS[loc][s.cat]}</span>
      </div>
      <div className="ss-meta">
        <h4>{s[loc][0]}</h4>
        <p>{s[loc][1]}</p>
      </div>
    </button>
  );
}

// The home gallery: theme switch, a spotlight with the light|dark compare,
// category filter, the grid and a lightbox.
export function ScreenGallery({ eyebrow, title1, title2, intro }) {
  const loc = getLocale();
  const u = UI[loc];
  const [theme, setTheme] = useShotTheme();
  const [cat, setCat] = useState('all');
  const [spot, setSpot] = useState(SHOTS[0].id);
  const [box, setBox] = useState(null);
  const [all, setAll] = useState(false);
  const spotRef = useRef(null);
  const cats = ['all', ...Object.keys(SHOT_CATS.en).filter(c => c !== 'all' && SHOTS.some(s => s.cat === c))];
  const FIRST = 9;
  const inCat = cat === 'all' ? SHOTS : SHOTS.filter(s => s.cat === cat);
  const shown = all || inCat.length <= FIRST ? inCat : inCat.slice(0, FIRST);
  const ids = SHOTS.map(s => s.id);
  const pick = id => {
    setSpot(id);
    spotRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const ss = shotById[spot];
  return (
    <section className="section" id="screenshots">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{eyebrow}</span>
          <h2>{title1}<br/>{title2}</h2>
          <p>{intro}</p>
        </div>

        <div className="ss-themebar">
          <ThemeSwitch theme={theme} onChange={setTheme}/>
          <span className="ss-themenote">{u.themes}</span>
        </div>

        <div className="ss-spot" ref={spotRef}>
          <CompareShot id={spot} theme={theme} onOpen={() => setBox(ids.indexOf(spot))}/>
          <div className="ss-spot-meta">
            <span className="mono ss-spot-cat">{SHOT_CATS[loc][ss.cat]}</span>
            <h3>{ss[loc][0]}</h3>
            <p>{ss[loc][1]}</p>
          </div>
        </div>

        <div className="ss-tabs">
          {cats.map(c => (
            <button key={c} className={`ss-tab ${cat === c ? 'active' : ''}`} onClick={() => setCat(c)}>
              {SHOT_CATS[loc][c]} <span className="ss-tab-n">{c === 'all' ? SHOTS.length : SHOTS.filter(s => s.cat === c).length}</span>
            </button>
          ))}
        </div>

        <div className="ss-grid">
          {shown.map(s => <ShotCard key={s.id} id={s.id} theme={theme} active={s.id === spot} onClick={() => pick(s.id)}/>)}
        </div>
        {inCat.length > FIRST && (
          <div className="ss-more">
            <button className="btn btn-ghost" onClick={() => setAll(v => !v)}>{all ? u.less : u.more(inCat.length)}</button>
          </div>
        )}
      </div>
      {box !== null && <Lightbox ids={ids} index={box} theme={theme} onTheme={setTheme} onIndex={setBox} onClose={() => setBox(null)}/>}
    </section>
  );
}

// A product page strip: the product's screens, switchable, opening a lightbox.
export function ProductShots({ ids, eyebrow, title }) {
  const loc = getLocale();
  const [theme, setTheme] = useShotTheme();
  const [main, setMain] = useState(ids[0]);
  const [box, setBox] = useState(null);
  return (
    <section className="section product-shots">
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="ss-themebar">
          <ThemeSwitch theme={theme} onChange={setTheme}/>
          <span className="ss-themenote">{UI[loc].themes}</span>
        </div>
        <div className={`ps-layout ${ids.length === 1 ? 'single' : ''}`}>
          {ids.length > 1 && <div className="ps-list">
            {ids.map(id => (
              <button key={id} className={`ps-item ${id === main ? 'active' : ''}`} onClick={() => setMain(id)}>
                <h4>{shotById[id][loc][0]}</h4>
                <p>{shotById[id][loc][1]}</p>
              </button>
            ))}
          </div>}
          <div className="ps-main">
            <CompareShot id={main} theme={theme} onOpen={() => setBox(ids.indexOf(main))}/>
          </div>
        </div>
      </div>
      {box !== null && <Lightbox ids={ids} index={box} theme={theme} onTheme={setTheme} onIndex={setBox} onClose={() => setBox(null)}/>}
    </section>
  );
}
