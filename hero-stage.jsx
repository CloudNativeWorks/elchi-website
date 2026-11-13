import { lazy, Suspense, useEffect, useRef, useState } from 'react';

/* The sheet's model viewport: a still of the scene (the poster, prerendered into the HTML so it is
   the first paint) and the real-time 3D scene (hero-3d.jsx), which loads only when the browser is
   idle or the visitor first interacts — and not at all on small screens, reduced motion, Save-Data
   or low-end devices, where the poster stays. The chapter control (captions) follows the scene's clock. */
const Hero3D = lazy(() => import('./hero-3d.jsx'));

const LOOP = 24;
const CHAPTERS = [0, 5, 10, 15, 20]; // keep in sync with the beats in hero-3d.jsx
const STR = {
  en: {
    steps: [
      ['Route', 'Every request is checked at the gate and sent to the right service.'],
      ['Protect', 'Shield stops attacks at the edge — they never reach your services.'],
      ['Ship live', 'An xDS push rolls out v2 with zero dropped requests.'],
      ['Discover', 'Your API inventory builds itself from real traffic.'],
      ['Heal', 'An unhealthy instance is drained, then rejoins on its own.'],
    ],
  },
  tr: {
    steps: [
      ['Yönlendir', 'Her istek kapıda denetlenir ve doğru servise gönderilir.'],
      ['Koru', 'Shield saldırıları kenarda durdurur — servislerinize hiç ulaşmazlar.'],
      ['Canlı yayınla', 'Bir xDS push ile v2, tek istek kaybetmeden devreye girer.'],
      ['Keşfet', 'API envanteriniz gerçek trafikten kendiliğinden oluşur.'],
      ['Onar', 'Sağlıksız instance trafikten çekilir, düzelince geri döner.'],
    ],
  },
};

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// Only called in the browser (inside an effect): the poster is enough on phones, for reduced
// motion, with Save-Data on, and on devices with little memory or few cores.
function wants3D() {
  if (window.matchMedia('(max-width: 768px)').matches) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  const nav = navigator;
  if (nav.connection && nav.connection.saveData) return false;
  if (nav.hardwareConcurrency && nav.hardwareConcurrency < 4) return false;
  if (nav.deviceMemory && nav.deviceMemory < 4) return false;
  return webglOk();
}

// Give the main thread back between steps (scheduler.yield where available).
const yieldToMain = () =>
  (globalThis.scheduler && typeof globalThis.scheduler.yield === 'function')
    ? globalThis.scheduler.yield()
    : new Promise((r) => setTimeout(r, 0));

const INTERACTIONS = ['pointerdown', 'pointermove', 'keydown', 'wheel', 'touchstart', 'scroll'];

// `paused` (the film player is open): the scene stops drawing, and if it has not mounted yet it
// waits until the player closes, so the video never competes with WebGL.
export function HeroStage({ locale = 'en', paused = false }) {
  const t = STR[locale] || STR.en;
  const hostRef = useRef(null);
  const barRef = useRef(null);
  const timeRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(true);
  const [chapter, setChapter] = useState(0);
  const [ready, setReady] = useState(false); // first 3D frame drawn
  const pausedRef = useRef(paused);
  const [pendingMount, setPendingMount] = useState(false);
  useEffect(() => {
    pausedRef.current = paused;
    if (!paused && pendingMount) { setPendingMount(false); setMounted(true); }
  }, [paused, pendingMount]);

  // decide, then load the 3D after idle or the first interaction: code, then CPU prep, then mount
  useEffect(() => {
    if (!wants3D()) return undefined;
    let cancelled = false;
    let started = false;
    let idleId = 0;
    let timer = 0;
    const off = () => INTERACTIONS.forEach((ev) => window.removeEventListener(ev, start, { passive: true }));
    async function start() {
      if (started || cancelled) return;
      started = true;
      off();
      const m = await import('./hero-3d.jsx');
      if (cancelled) return;
      await yieldToMain();
      m.prepare();
      await yieldToMain();
      if (cancelled) return;
      if (pausedRef.current) setPendingMount(true); else setMounted(true);
    }
    INTERACTIONS.forEach((ev) => window.addEventListener(ev, start, { passive: true, once: true }));
    const whenIdle = () => {
      idleId = window.requestIdleCallback
        ? window.requestIdleCallback(start, { timeout: 4000 })
        : setTimeout(start, 2500);
    };
    // after the page has loaded and settled, so the 3D never competes with the first paint
    const afterLoad = () => { timer = setTimeout(whenIdle, 1200); };
    if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad, { once: true });
    return () => {
      cancelled = true;
      off();
      window.removeEventListener('load', afterLoad);
      clearTimeout(timer);
      if (window.cancelIdleCallback) window.cancelIdleCallback(idleId); else clearTimeout(idleId);
    };
  }, []);

  // chapter captions follow the scene's clock — only while the scene runs
  useEffect(() => {
    if (!mounted) return undefined;
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { threshold: 0 });
    io.observe(hostRef.current);
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const s = timeRef.current % LOOP;
      let c = 0;
      for (let i = 0; i < CHAPTERS.length; i++) if (s >= CHAPTERS[i]) c = i;
      setChapter((p) => (p === c ? p : c));
      const end = CHAPTERS[c + 1] ?? LOOP;
      if (barRef.current) barRef.current.style.transform = `scaleX(${(s - CHAPTERS[c]) / (end - CHAPTERS[c])})`;
    };
    raf = requestAnimationFrame(tick);
    return () => { io.disconnect(); cancelAnimationFrame(raf); };
  }, [mounted]);

  return (
    <div className={`vp${ready ? ' is-live' : ''}`}>
      <div ref={hostRef} className="vp-model" aria-hidden="true">
        {/* a still of the scene: the first paint, and the whole picture where the 3D does not load */}
        <img className="vp-poster" src="/hero3d/poster.webp" alt="" width="819" height="512" decoding="async" fetchpriority="high" style={{ opacity: ready ? 0 : 1 }} />
        {mounted && (
          <Suspense fallback={null}>
            <div className={`vp-fade${ready ? ' is-on' : ''}`}>
              <Hero3D timeRef={timeRef} active={active && !paused} reduce={false} onReady={() => setReady(true)} />
            </div>
          </Suspense>
        )}
      </div>

      {/* detail schedule: which beat of the loop is playing */}
      <div className="vp-steps" aria-hidden="true">
        <ol>
          {t.steps.map(([name], i) => (
            <li key={name} className={i === chapter ? 'is-on' : i < chapter ? 'is-done' : ''}>
              <span className="vp-step-n">{String(i + 1).padStart(2, '0')}</span>
              <span className="vp-step-name">{name}</span>
              {i === chapter && <span className="vp-step-bar"><span ref={barRef} /></span>}
            </li>
          ))}
        </ol>
        <p className="vp-caption">{t.steps[chapter][1]}</p>
      </div>
    </div>
  );
}
