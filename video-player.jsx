import { useEffect, useRef, useState } from 'react';
import { getLocale, locHref } from './i18n.js';
import { VIDEOS } from './videos-data.js';
import './videos.css';

// Video card + click-to-play player, shared by the Videos page and the product pages.
// Thumbnails are self-hosted; the youtube-nocookie.com player loads only after the
// visitor presses play (no cookies, no request to YouTube before that). A video with `src`
// (the self-hosted brand film, film-data.js) plays in a plain <video> instead.
const STR = {
  en: { close: 'Close', onYoutube: 'Watch on YouTube', privacy: 'Plays from youtube-nocookie.com', play: (t) => `Play: ${t}`, all: 'All video tutorials →' },
  tr: { close: 'Kapat', onYoutube: "YouTube'da izle", privacy: 'youtube-nocookie.com üzerinden oynatılır', play: (t) => `Oynat: ${t}`, all: 'Tüm video eğitimleri →' },
};

export const thumb = (v) => `/videos/${v.slug}.webp`;
export const embed = (v, locale) =>
  `https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&rel=0&modestbranding=1&playsinline=1` +
  (locale === 'tr' ? '&hl=tr&cc_lang_pref=tr&cc_load_policy=1' : '&hl=en');
export const fold = (s) => s.toLocaleLowerCase('en').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ı/g, 'i');

export function PlayIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13a1 1 0 0 0 1.52.85l10.4-6.5a1 1 0 0 0 0-1.7L9.52 4.65A1 1 0 0 0 8 5.5z" fill="currentColor"/></svg>
  );
}

export function VideoCard({ v, onPlay, anchor = true }) {
  const t = STR[getLocale()];
  const locale = getLocale();
  return (
    <article className="vid-card" id={anchor ? v.slug : undefined}>
      <button className="vid-thumb" onClick={() => onPlay(v)} aria-label={t.play(v.title)}>
        <img src={thumb(v)} alt="" loading="lazy" decoding="async" width="960" height="540"/>
        <span className="vid-play"><PlayIcon/></span>
        <span className="vid-dur mono">{v.duration}</span>
      </button>
      <div className="vid-meta">
        <h3><button className="vid-title" onClick={() => onPlay(v)}>{v.title}</button></h3>
        <p>{v[locale]}</p>
      </div>
    </article>
  );
}

export function Player({ v, onClose }) {
  const t = STR[getLocale()];
  const locale = getLocale();
  const closeBtn = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    closeBtn.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="vid-modal" role="dialog" aria-modal="true" aria-label={v.title} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="vid-modal-box">
        <div className="vid-modal-head">
          <h2>{v.title}</h2>
          <button ref={closeBtn} className="vid-close" onClick={onClose} aria-label={t.close}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div className="vid-frame">
          {v.src ? (
            <video src={v.src} poster={thumb(v)} controls autoPlay playsInline preload="metadata"></video>
          ) : (
            <iframe
              src={embed(v, locale)}
              title={v.title}
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            ></iframe>
          )}
        </div>
        <div className="vid-modal-foot">
          <p>{v[locale]}</p>
          {v.yt && !v.src && (
            <div className="vid-modal-links">
              <span className="vid-note">{t.privacy}</span>
              <a href={`https://www.youtube.com/watch?v=${v.yt}`} target="_blank" rel="noopener">{t.onYoutube} ↗</a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// A row of videos (by slug, in the given order; videos that are not public yet are skipped).
export function VideoStrip({ slugs, eyebrow, title, max = 6 }) {
  const t = STR[getLocale()];
  const [playing, setPlaying] = useState(null);
  const items = slugs.map((s) => VIDEOS.find((v) => v.slug === s)).filter(Boolean).slice(0, max);
  if (!items.length) return null;
  return (
    <section className="section" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="container">
        <div className="section-head">
          <span className="eyebrow"><span className="dot"></span>{eyebrow}</span>
          <h2>{title}</h2>
        </div>
        <div className="vid-grid">
          {items.map((v) => <VideoCard key={v.slug} v={v} onPlay={setPlaying} anchor={false}/>)}
        </div>
        <p style={{ textAlign: 'center', marginTop: 36 }}><a href={locHref('videos')} className="btn btn-ghost">{t.all}</a></p>
      </div>
      {playing && <Player v={playing} onClose={() => setPlaying(null)}/>}
    </section>
  );
}
