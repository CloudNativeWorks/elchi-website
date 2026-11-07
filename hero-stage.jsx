import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

/* Hero background: the real-time 3D scene (hero-3d.jsx, lazy-loaded so the
   headline paints first) + chapter captions synced to the scene's clock. */
const Hero3D = lazy(() => import('./hero-3d.jsx'));

const LOOP = 24;
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

export function HeroStage({ locale = 'en' }) {
  const t = STR[locale] || STR.en;
  const hostRef = useRef(null);
  const barRef = useRef(null);
  const timeRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(true);
  const [reduce, setReduce] = useState(false);
  const [chapter, setChapter] = useState(0);
  const [ready, setReady] = useState(false); // first 3D frame drawn

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    setMounted(webglOk());
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
  }, []);

  return (
    <>
      <div ref={hostRef} className="hx3" aria-hidden="true">
        {/* a still of the scene: shown while the 3D loads, and as the fallback without WebGL */}
        <img className="hx3-poster" src="/hero3d/poster.webp" alt="" width="1504" height="812" decoding="async" fetchpriority="high" style={{ opacity: ready ? 0 : 1 }} />
        {mounted && (
          <Suspense fallback={null}>
            <motion.div className="hx3-fade" initial={{ opacity: 0 }} animate={{ opacity: ready ? 1 : 0 }} transition={{ duration: 0.4 }}>
              <Hero3D timeRef={timeRef} active={active} reduce={reduce} onReady={() => setReady(true)} />
            </motion.div>
          </Suspense>
        )}
      </div>

      <div className="hx-chapters" aria-hidden="true">
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
