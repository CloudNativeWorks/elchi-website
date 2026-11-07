import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* Hero background: the real-time 3D scene (hero-3d.jsx, lazy-loaded so the
   headline paints first) + chapter captions synced to the scene's clock. */
const Hero3D = lazy(() => import('./hero-3d.jsx'));

const LOOP = 24;
const LOADING = { en: 'Loading the live scene', tr: 'Canlı sahne yükleniyor' };
const CHAPTERS = [0, 5, 10, 15, 20]; // keep in sync with the beats in hero-3d.jsx
const STR = {
  en: [
    ['Route', 'Every request is checked at the gate and sent to the right service.'],
    ['Protect', 'Shield stops attacks at the edge — they never reach your services.'],
    ['Ship live', 'An xDS push rolls out v2 with zero dropped requests.'],
    ['Discover', 'Your API inventory builds itself from real traffic.'],
    ['Heal', 'An unhealthy instance is drained, then rejoins on its own.'],
  ],
  tr: [
    ['Yönlendir', 'Her istek kapıda denetlenir ve doğru servise gönderilir.'],
    ['Koru', 'Shield saldırıları kenarda durdurur — servislerinize hiç ulaşmazlar.'],
    ['Canlı yayınla', 'Bir xDS push ile v2, tek istek kaybetmeden devreye girer.'],
    ['Keşfet', 'API envanteriniz gerçek trafikten kendiliğinden oluşur.'],
    ['Onar', 'Sağlıksız instance trafikten çekilir, düzelince geri döner.'],
  ],
};

function webglOk() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return false; }
}

// `paused` (the film player is open over the hero): the scene stops drawing, and if it has not
// mounted yet it waits until the player closes, so the video never competes with WebGL.
export function HeroStage({ locale = 'en', paused = false }) {
  const t = STR[locale] || STR.en;
  const hostRef = useRef(null);
  const barRef = useRef(null);
  const timeRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [ready, setReady] = useState(false); // first 3D frame drawn
  const [webgl, setWebgl] = useState(true);
  const [progress, setProgress] = useState(0.06); // real stages: code → prepared → mounted → first frame
  // the last stage (shaders compiling before the first frame) has no milestones: creep on slowly so it never looks stuck
  useEffect(() => {
    if (progress !== 0.88 || ready) return;
    const id = setTimeout(() => setProgress(0.97), 700);
    return () => clearTimeout(id);
  }, [progress, ready]);
  const pausedRef = useRef(paused);
  const [pendingMount, setPendingMount] = useState(false);
  useEffect(() => {
    pausedRef.current = paused;
    if (!paused && pendingMount) { setPendingMount(false); setMounted(true); setProgress(0.88); }
  }, [paused, pendingMount]);

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    // start the 3D only once the headline animation has finished and the browser is idle,
    // so loading/compiling never stalls the text (it would freeze mid-blur)
    // …and spread the work over idle slots: load the code, prepare textures/geometry, then mount
    let idle = 0;
    let cancelled = false;
    const whenIdle = (fn) => {
      idle = window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1000 }) : setTimeout(fn, 50);
    };
    if (!webglOk()) setWebgl(false); // no 3D: the still stays, no loader
    else setProgress(0.18);
    const timer = setTimeout(() => {
      if (!webglOk()) return;
      whenIdle(() => {
        import('./hero-3d.jsx').then((m) => {
          if (cancelled) return;
          setProgress(0.45);
          whenIdle(() => {
            m.prepare();
            setProgress(0.7);
            whenIdle(() => { if (cancelled) return; if (pausedRef.current) setPendingMount(true); else { setMounted(true); setProgress(0.88); } });
          });
        });
      });
    }, 1500);
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
    return () => { io.disconnect(); cancelAnimationFrame(raf); cancelled = true; clearTimeout(timer); if (window.cancelIdleCallback) window.cancelIdleCallback(idle); };
  }, []);

  return (
    <>
      <div ref={hostRef} className="hx3" aria-hidden="true">
        {/* a still of the scene: shown while the 3D loads, and as the fallback without WebGL */}
        <img className="hx3-poster" src="/hero3d/poster.webp" alt="" width="1504" height="812" decoding="async" fetchpriority="high" style={{ opacity: ready ? 0 : 1 }} />
        {mounted && (
          <Suspense fallback={null}>
            <motion.div className="hx3-fade" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.4 }}>
              <Hero3D timeRef={timeRef} active={active && !paused} reduce={reduce} onReady={() => { setProgress(1); setReady(true); }} />
            </motion.div>
          </Suspense>
        )}
      </div>

      <AnimatePresence>
        {webgl && !ready && (
          <motion.div
            key="loader"
            className="hx-loader"
            role="status"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6, filter: 'blur(6px)' }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="hx-loader-row">
              <svg className="hx-loader-hex" width="18" height="20" viewBox="-10 -11 20 22" aria-hidden="true">
                <path d="M0 -10 L9 -5 L9 5 L0 10 L-9 5 L-9 -5 Z" pathLength="1" />
              </svg>
              <span className="hx-loader-text">{LOADING[locale] || LOADING.en}</span>
            </span>
            <span className={`hx-loader-bar${progress === 0.97 ? ' is-creep' : ''}`} aria-hidden="true"><span style={{ transform: `scaleX(${progress})` }} /></span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`hx-chapters${ready ? ' is-ready' : ''}`} aria-hidden="true">
        <ol className="hx-steps">
          {t.map(([name], i) => (
            <li key={name} className={i === chapter ? 'is-on' : i < chapter ? 'is-done' : ''}>
              <span className="hx-step-n">0{i + 1}</span>
              <span className="hx-step-name">{name}</span>
              {i === chapter && <span className="hx-step-bar"><span ref={barRef} /></span>}
            </li>
          ))}
        </ol>
        <div className="hx-caption">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={chapter}
              initial={{ opacity: 0, y: 10, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              {t[chapter][1]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
