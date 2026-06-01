import { useEffect, useMemo, useState } from 'react';

/* ============================================================
   ANIMATED ARCHITECTURE DIAGRAM
   Data-plane: Web/API/Mobile ⇄ Client Pool (elchi-client + envoy)
   Mgmt-plane: Admin UI + Client Pool ─→ Central Proxy
                                            │ ←ext_proc→ Registry
                                            ├─→ Controller (REST/mgmt)
                                            └─→ Control-Plane (versioned xDS)
                                            both persist to MongoDB
   ============================================================ */

function ArchDiagram() {
  const pool = [
    { x: 506, y: 70,  ver: 'v1.33' },
    { x: 626, y: 70,  ver: 'v1.32' },
    { x: 746, y: 70,  ver: 'v1.33' },
    { x: 506, y: 132, ver: 'v1.32' },
    { x: 626, y: 132, ver: 'v1.33' },
    { x: 746, y: 132, ver: 'v1.32' },
  ];

  return (
    <div className="arch-diagram">
      <svg viewBox="0 -90 900 610" className="arch-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="lg-blue" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#3b82f6"/>
            <stop offset="100%" stopColor="#6366f1"/>
          </linearGradient>
          <linearGradient id="lg-violet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b5cf6"/>
            <stop offset="100%" stopColor="#6366f1"/>
          </linearGradient>
          <linearGradient id="lg-cyan" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#06b6d4"/>
            <stop offset="100%" stopColor="#3b82f6"/>
          </linearGradient>
          <linearGradient id="lg-emerald" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#10b981"/>
            <stop offset="100%" stopColor="#06b6d4"/>
          </linearGradient>
          <linearGradient id="lg-pink" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#ec4899"/>
            <stop offset="100%" stopColor="#a855f7"/>
          </linearGradient>

          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="soft-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#1e3a8a" floodOpacity="0.10"/>
          </filter>

          <marker id="arrow-cyan" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#06b6d4"/>
          </marker>
          <marker id="arrow-slate" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"/>
          </marker>
        </defs>

        {/* Background grid */}
        <g opacity="0.5">
          {Array.from({length: 12}).map((_, i) => (
            <line key={`v${i}`} x1={i*80} y1="-90" x2={i*80} y2="520" stroke="#0f172a" strokeOpacity="0.04"/>
          ))}
          {Array.from({length: 10}).map((_, i) => (
            <line key={`h${i}`} x1="0" y1={(i-2)*70} x2="900" y2={(i-2)*70} stroke="#0f172a" strokeOpacity="0.04"/>
          ))}
        </g>

        {/* ─── CONNECTION LINES ─── */}
        {/* User → Central Proxy */}
        <path d="M 75 165 L 75 245" stroke="#f59e0b" strokeWidth="2" fill="none" strokeDasharray="6 6" className="flow-line"/>
        {/* Envoy Pool columns → Central Proxy */}
        <path d="M 558 200 L 558 245" stroke="url(#lg-emerald)" strokeWidth="2" fill="none" strokeDasharray="6 6" className="flow-line"/>
        <path d="M 678 200 L 678 245" stroke="url(#lg-emerald)" strokeWidth="2" fill="none" strokeDasharray="6 6" className="flow-line"/>
        {/* Central Proxy ↔ Registry (ext_proc, bidirectional with arrowheads) */}
        <path d="M 680 280 L 745 280" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="5 4" markerEnd="url(#arrow-cyan)"/>
        <path d="M 745 304 L 680 304" stroke="#06b6d4" strokeWidth="1.5" fill="none" strokeDasharray="5 4" markerEnd="url(#arrow-cyan)"/>
        {/* Central Proxy → Controller */}
        <path d="M 200 320 L 200 380" stroke="url(#lg-violet)" strokeWidth="2" fill="none" strokeDasharray="6 6" className="flow-line"/>
        {/* Central Proxy → Control-Plane */}
        <path d="M 510 320 L 510 380" stroke="url(#lg-blue)" strokeWidth="2" fill="none" strokeDasharray="6 6" className="flow-line"/>
        {/* Controller → MongoDB (curve below Control-Plane), Control-Plane → MongoDB (short) */}
        <path d="M 320 460 C 460 495, 580 495, 720 460" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeDasharray="3 3" opacity="0.55"/>
        <path d="M 680 432 L 720 432" stroke="#94a3b8" strokeWidth="1.5" fill="none" strokeDasharray="3 3" opacity="0.55"/>

        {/* Animated packets */}
        <Packet path="M 75 165 L 75 245" duration="2s" color="#f59e0b"/>
        <Packet path="M 558 200 L 558 245" duration="1.6s" color="#10b981"/>
        <Packet path="M 558 200 L 558 245" duration="1.6s" delay="0.5s" color="#10b981"/>
        <Packet path="M 678 200 L 678 245" duration="1.6s" delay="0.25s" color="#10b981"/>
        <Packet path="M 678 200 L 678 245" duration="1.6s" delay="0.85s" color="#10b981"/>
        <Packet path="M 200 320 L 200 380" duration="2.2s" color="#8b5cf6"/>
        <Packet path="M 200 320 L 200 380" duration="2.2s" delay="1s" color="#8b5cf6"/>
        <Packet path="M 510 320 L 510 380" duration="1.9s" color="#3b82f6"/>
        <Packet path="M 510 320 L 510 380" duration="1.9s" delay="0.7s" color="#3b82f6"/>
        <Packet path="M 510 320 L 510 380" duration="1.9s" delay="1.3s" color="#3b82f6"/>

        {/* ─── EXTERNAL TRAFFIC (above CLIENT POOL: web / api / mobile) ─── */}
        <g>
          <text x="670" y="-72" fontSize="9" fontFamily="Geist Mono, monospace" fill="#64748b" textAnchor="middle" fontWeight="600" letterSpacing="0.5">EXTERNAL TRAFFIC</text>
          {[
            { x: 510, label: 'Web' },
            { x: 626, label: 'API' },
            { x: 742, label: 'Mobile' },
          ].map((t, i) => (
            <g key={i} filter="url(#soft-shadow)">
              <rect x={t.x} y="-58" width="84" height="32" rx="16" fill="white" stroke="#cbd5e1"/>
              <text x={t.x + 42} y="-37" textAnchor="middle" fontSize="11" fontFamily="Geist, sans-serif" fontWeight="500" fill="#334155">{t.label}</text>
            </g>
          ))}
          {/* bidirectional req / resp arrows from each pill down to the pool */}
          <path d="M 552 -22 L 552 38" stroke="#64748b" strokeWidth="1.5" fill="none" strokeDasharray="4 3" markerStart="url(#arrow-slate)" markerEnd="url(#arrow-slate)"/>
          <path d="M 668 -22 L 668 38" stroke="#64748b" strokeWidth="1.5" fill="none" strokeDasharray="4 3" markerStart="url(#arrow-slate)" markerEnd="url(#arrow-slate)"/>
          <path d="M 784 -22 L 784 38" stroke="#64748b" strokeWidth="1.5" fill="none" strokeDasharray="4 3" markerStart="url(#arrow-slate)" markerEnd="url(#arrow-slate)"/>
          <text x="670" y="20" fontSize="9" fontFamily="Geist Mono, monospace" fill="#64748b" textAnchor="middle" fontStyle="italic">request / response</text>
        </g>

        {/* ─── USER / UI (top-left) ─── */}
        <g filter="url(#soft-shadow)">
          <rect x="30" y="80" width="90" height="84" rx="14" fill="white" stroke="#e2e8f0"/>
          <circle cx="75" cy="108" r="11" fill="#cbd5e1"/>
          <path d="M 56 142 Q 75 124 94 142 L 94 152 L 56 152 Z" fill="#cbd5e1"/>
          <text x="75" y="76" textAnchor="middle" fontSize="9" fontFamily="Geist Mono, monospace" fill="#94a3b8">UI traffic</text>
        </g>

        {/* ─── ENVOY POOL (top-right) ─── */}
        <g filter="url(#soft-shadow)">
          <rect x="480" y="40" width="380" height="160" rx="14" fill="white" stroke="#e2e8f0"/>
          <rect x="480" y="40" width="380" height="22" rx="14" fill="#f1f5f9"/>
          <rect x="480" y="54" width="380" height="8" fill="#f1f5f9"/>
          <text x="496" y="56" fontSize="10" fontFamily="Geist Mono, monospace" fill="#475569" fontWeight="600">CLIENT POOL</text>
          <text x="848" y="56" fontSize="9" fontFamily="Geist Mono, monospace" fill="#94a3b8" textAnchor="end">data plane · serves traffic</text>

          {pool.map((c, i) => (
            <g key={i}>
              <rect x={c.x} y={c.y} width="46" height="48" rx="6" fill="#ccfbf1" stroke="#5eead4" strokeWidth="0.5"/>
              <text x={c.x+23} y={c.y+19} textAnchor="middle" fontSize="7" fontFamily="Geist Mono, monospace" fill="#0f766e" fontWeight="600">elchi</text>
              <text x={c.x+23} y={c.y+32} textAnchor="middle" fontSize="7" fontFamily="Geist Mono, monospace" fill="#0f766e" fontWeight="600">client</text>
              <rect x={c.x+50} y={c.y} width="58" height="48" rx="6" fill="#fce7f3" stroke="#f9a8d4" strokeWidth="0.5"/>
              <text x={c.x+79} y={c.y+19} textAnchor="middle" fontSize="7" fontFamily="Geist Mono, monospace" fill="#9d174d" fontWeight="600">envoy</text>
              <text x={c.x+79} y={c.y+32} textAnchor="middle" fontSize="7" fontFamily="Geist Mono, monospace" fill="#9d174d">{c.ver}</text>
            </g>
          ))}
        </g>

        {/* ─── CENTRAL PROXY ─── */}
        <g filter="url(#soft-shadow)">
          <rect x="40" y="245" width="640" height="78" rx="14" fill="white" stroke="#ec4899" strokeWidth="1.5"/>
          <rect x="40" y="245" width="640" height="22" rx="14" fill="#fce7f3"/>
          <rect x="40" y="259" width="640" height="8" fill="#fce7f3"/>
          <text x="56" y="261" fontSize="11" fontFamily="Geist Mono, monospace" fill="#9d174d" fontWeight="700">CENTRAL PROXY</text>
          <text x="664" y="261" fontSize="9" fontFamily="Geist Mono, monospace" fill="#9d174d" textAnchor="end">single ingress · Envoy</text>
          <g transform="translate(56, 282)">
            <circle cx="5" cy="6" r="3" fill="#ec4899" className="blink"/>
            <text x="14" y="9" fontSize="11" fontFamily="Geist, sans-serif" fill="#334155">version + nodeid header routing</text>
          </g>
          <g transform="translate(56, 302)">
            <circle cx="5" cy="6" r="3" fill="#ec4899" className="blink" style={{animationDelay:'.4s'}}/>
            <text x="14" y="9" fontSize="11" fontFamily="Geist, sans-serif" fill="#334155">routes UI · REST · xDS · ext_proc</text>
          </g>
        </g>

        {/* ─── REGISTRY (right of Central Proxy, External Process) ─── */}
        <g filter="url(#soft-shadow)">
          <rect x="750" y="240" width="130" height="90" rx="14" fill="white" stroke="#22d3ee" strokeWidth="1.5"/>
          <rect x="750" y="240" width="130" height="22" rx="14" fill="#cffafe"/>
          <rect x="750" y="254" width="130" height="8" fill="#cffafe"/>
          <text x="762" y="256" fontSize="10" fontFamily="Geist Mono, monospace" fill="#0e7490" fontWeight="600">REGISTRY</text>
          <text x="869" y="256" fontSize="8" fontFamily="Geist Mono, monospace" fill="#0e7490" textAnchor="end">:9090</text>
          <g transform="translate(762, 274)">
            <circle cx="5" cy="5" r="2.5" fill="#06b6d4" className="blink"/>
            <text x="13" y="8" fontSize="10" fontFamily="Geist, sans-serif" fill="#334155">client → ctrl map</text>
          </g>
          <g transform="translate(762, 292)">
            <circle cx="5" cy="5" r="2.5" fill="#06b6d4" className="blink" style={{animationDelay:'.3s'}}/>
            <text x="13" y="8" fontSize="10" fontFamily="Geist, sans-serif" fill="#334155">node → cp map</text>
          </g>
          <g transform="translate(762, 310)">
            <circle cx="5" cy="5" r="2.5" fill="#06b6d4" className="blink" style={{animationDelay:'.6s'}}/>
            <text x="13" y="8" fontSize="10" fontFamily="Geist, sans-serif" fill="#334155">ext_proc rules</text>
          </g>
        </g>

        {/* ─── CONTROLLER (bottom-left) ─── */}
        <g filter="url(#soft-shadow)">
          <rect x="80" y="380" width="240" height="100" rx="14" fill="white" stroke="#8b5cf6" strokeWidth="1.5"/>
          <rect x="80" y="380" width="240" height="22" rx="14" fill="#ede9fe"/>
          <rect x="80" y="394" width="240" height="8" fill="#ede9fe"/>
          <text x="96" y="396" fontSize="10" fontFamily="Geist Mono, monospace" fill="#6d28d9" fontWeight="600">CONTROLLER</text>
          <text x="304" y="396" fontSize="9" fontFamily="Geist Mono, monospace" fill="#6d28d9" textAnchor="end">REST · gRPC</text>
          <g transform="translate(96, 416)">
            <circle cx="5" cy="5" r="2.5" fill="#8b5cf6" className="blink"/>
            <text x="14" y="8" fontSize="11" fontFamily="Geist, sans-serif" fill="#334155">UI · client commands</text>
          </g>
          <g transform="translate(96, 436)">
            <circle cx="5" cy="5" r="2.5" fill="#8b5cf6" className="blink" style={{animationDelay:'.3s'}}/>
            <text x="14" y="8" fontSize="11" fontFamily="Geist, sans-serif" fill="#334155">xDS resources · JWT/RBAC</text>
          </g>
          <text x="96" y="468" fontSize="9" fontFamily="Geist Mono, monospace" fill="#94a3b8">controller-1 · -2 · …</text>
        </g>

        {/* ─── CONTROL-PLANE with versioned sub-boxes ─── */}
        <g filter="url(#soft-shadow)">
          <rect x="340" y="380" width="340" height="100" rx="14" fill="white" stroke="#3b82f6" strokeWidth="1.5"/>
          <rect x="340" y="380" width="340" height="22" rx="14" fill="#dbeafe"/>
          <rect x="340" y="394" width="340" height="8" fill="#dbeafe"/>
          <text x="356" y="396" fontSize="10" fontFamily="Geist Mono, monospace" fill="#1d4ed8" fontWeight="600">CONTROL-PLANE</text>
          <text x="664" y="396" fontSize="9" fontFamily="Geist Mono, monospace" fill="#1d4ed8" textAnchor="end">xDS · ADS · VHDS</text>
          <g transform="translate(356, 414)">
            <rect width="148" height="56" rx="8" fill="#eff6ff" stroke="#bfdbfe"/>
            <text x="12" y="20" fontSize="11" fontFamily="Geist Mono, monospace" fill="#1d4ed8" fontWeight="600">v1.35.3</text>
            <circle cx="136" cy="16" r="3" fill="#3b82f6" className="blink"/>
            <text x="12" y="38" fontSize="9" fontFamily="Geist, sans-serif" fill="#475569">snapshot cache</text>
            <text x="12" y="50" fontSize="8" fontFamily="Geist Mono, monospace" fill="#94a3b8">:18000</text>
          </g>
          <g transform="translate(516, 414)">
            <rect width="148" height="56" rx="8" fill="#eff6ff" stroke="#bfdbfe"/>
            <text x="12" y="20" fontSize="11" fontFamily="Geist Mono, monospace" fill="#1d4ed8" fontWeight="600">v1.36.2</text>
            <circle cx="136" cy="16" r="3" fill="#3b82f6" className="blink" style={{animationDelay:'.5s'}}/>
            <text x="12" y="38" fontSize="9" fontFamily="Geist, sans-serif" fill="#475569">snapshot cache</text>
            <text x="12" y="50" fontSize="8" fontFamily="Geist Mono, monospace" fill="#94a3b8">:18000</text>
          </g>
        </g>

        {/* ─── MongoDB ─── */}
        <g filter="url(#soft-shadow)">
          <rect x="720" y="395" width="160" height="74" rx="12" fill="white" stroke="#cbd5e1"/>
          <rect x="720" y="395" width="160" height="22" rx="12" fill="#f1f5f9"/>
          <rect x="720" y="409" width="160" height="8" fill="#f1f5f9"/>
          <text x="736" y="411" fontSize="10" fontFamily="Geist Mono, monospace" fill="#475569" fontWeight="600">MongoDB</text>
          <text x="864" y="411" fontSize="9" fontFamily="Geist Mono, monospace" fill="#94a3b8" textAnchor="end">store</text>
          <text x="736" y="436" fontSize="10" fontFamily="Geist, sans-serif" fill="#64748b">configs · users</text>
          <text x="736" y="452" fontSize="10" fontFamily="Geist, sans-serif" fill="#64748b">projects · audit</text>
        </g>

        {/* ─── Edge labels ─── */}
        <text x="86" y="220" fontSize="9" fontFamily="Geist Mono, monospace" fill="#f59e0b" fontWeight="500">HTTPS</text>
        <text x="568" y="225" fontSize="9" fontFamily="Geist Mono, monospace" fill="#10b981" fontWeight="500">xDS / gRPC</text>
        <text x="712" y="296" fontSize="9" fontFamily="Geist Mono, monospace" fill="#0e7490" fontWeight="600" textAnchor="middle">ext_proc</text>
        <text x="210" y="350" fontSize="9" fontFamily="Geist Mono, monospace" fill="#8b5cf6" fontWeight="500">REST</text>
        <text x="520" y="350" fontSize="9" fontFamily="Geist Mono, monospace" fill="#3b82f6" fontWeight="500">xDS</text>
      </svg>
    </div>
  );
}

function Packet({ path, duration = '2s', delay = '0s', color = '#3b82f6' }) {
  // SVG <circle> animated along path via SMIL animateMotion
  return (
    <g>
      <circle r="4" fill={color} filter="url(#glow)">
        <animateMotion dur={duration} repeatCount="indefinite" begin={delay} path={path} rotate="auto"/>
        <animate attributeName="opacity" values="0;1;1;1;0" keyTimes="0;0.1;0.5;0.9;1" dur={duration} repeatCount="indefinite" begin={delay}/>
      </circle>
    </g>
  );
}

/* ============================================================
   MINIMAL VARIANT — circular orbital
   ============================================================ */
function ArchOrbit() {
  return (
    <div className="arch-diagram arch-orbit">
      <svg viewBox="0 0 600 600" className="arch-svg" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="orb-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#dbeafe" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#dbeafe" stopOpacity="0"/>
          </radialGradient>
          <filter id="glow2">
            <feGaussianBlur stdDeviation="3"/>
            <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>

        <circle cx="300" cy="300" r="240" fill="url(#orb-grad)"/>

        {/* Orbital rings */}
        <circle cx="300" cy="300" r="100" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 4"/>
        <circle cx="300" cy="300" r="180" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 4"/>
        <circle cx="300" cy="300" r="240" fill="none" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="2 4"/>

        {/* Center: Envoy */}
        <g>
          <circle cx="300" cy="300" r="42" fill="#0f172a"/>
          <circle cx="300" cy="300" r="42" fill="none" stroke="#10b981" strokeWidth="2">
            <animate attributeName="r" values="42;48;42" dur="2.5s" repeatCount="indefinite"/>
            <animate attributeName="stroke-opacity" values="1;0;1" dur="2.5s" repeatCount="indefinite"/>
          </circle>
          <text x="300" y="298" textAnchor="middle" fontSize="13" fontWeight="600" fill="white" fontFamily="Geist, sans-serif">Envoy</text>
          <text x="300" y="315" textAnchor="middle" fontSize="9" fill="#10b981" fontFamily="Geist Mono, monospace">PROXY</text>
        </g>

        {/* Inner orbit: Control-plane */}
        <g style={{ transformOrigin: '300px 300px', animation: 'rotate-cw 18s linear infinite' }}>
          <g transform="translate(400, 300)">
            <circle r="22" fill="white" stroke="#3b82f6" strokeWidth="1.5" filter="url(#glow2)"/>
            <text textAnchor="middle" y="3" fontSize="9" fontFamily="Geist Mono, monospace" fill="#1d4ed8" fontWeight="600">CTRL-PLANE</text>
          </g>
        </g>

        {/* Mid orbit: Controller */}
        <g style={{ transformOrigin: '300px 300px', animation: 'rotate-cw 30s linear infinite reverse' }}>
          <g transform="translate(120, 300)">
            <circle r="26" fill="white" stroke="#8b5cf6" strokeWidth="1.5" filter="url(#glow2)"/>
            <text textAnchor="middle" y="3" fontSize="9" fontFamily="Geist Mono, monospace" fill="#6d28d9" fontWeight="600">CONTROLLER</text>
          </g>
        </g>

        {/* Outer orbit: Registry */}
        <g style={{ transformOrigin: '300px 300px', animation: 'rotate-cw 45s linear infinite' }}>
          <g transform="translate(300, 60)">
            <circle r="24" fill="white" stroke="#06b6d4" strokeWidth="1.5" filter="url(#glow2)"/>
            <text textAnchor="middle" y="3" fontSize="9" fontFamily="Geist Mono, monospace" fill="#0e7490" fontWeight="600">REGISTRY</text>
          </g>
          <g transform="translate(540, 300)">
            <circle r="14" fill="white" stroke="#cbd5e1"/>
            <text textAnchor="middle" y="3" fontSize="8" fontFamily="Geist Mono, monospace" fill="#64748b">K8s</text>
          </g>
          <g transform="translate(60, 300)">
            <circle r="14" fill="white" stroke="#cbd5e1"/>
            <text textAnchor="middle" y="3" fontSize="8" fontFamily="Geist Mono, monospace" fill="#64748b">Mongo</text>
          </g>
          <g transform="translate(300, 540)">
            <circle r="14" fill="white" stroke="#cbd5e1"/>
            <text textAnchor="middle" y="3" fontSize="8" fontFamily="Geist Mono, monospace" fill="#64748b">Agent</text>
          </g>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================
   TERMINAL VARIANT — animated xDS config stream
   ============================================================ */
function ArchTerminal() {
  const [lines, setLines] = useState([]);
  const allLines = useMemo(() => [
    { t: 'cmd', text: '$ elchi connect --version=1.34' },
    { t: 'log', text: '› registering with registry @ :9090' },
    { t: 'ok',  text: '✓ assigned controller-prod-3 (v1.34)' },
    { t: 'log', text: '› requesting xDS subscription' },
    { t: 'log', text: '  CDS: 12 clusters' },
    { t: 'log', text: '  LDS: 4 listeners' },
    { t: 'log', text: '  RDS: 28 routes' },
    { t: 'log', text: '  EDS: 87 endpoints (k8s auto-discovery)' },
    { t: 'ok',  text: '✓ snapshot v419 applied — 0 errors' },
    { t: 'evt', text: '⚡ config drift detected → revalidating…' },
    { t: 'ok',  text: '✓ live · 1.2k req/s · p99 14ms' },
  ], []);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      setLines(prev => {
        if (i >= allLines.length) {
          clearInterval(interval);
          return prev;
        }
        const next = [...prev, allLines[i]];
        i++;
        return next;
      });
    }, 480);
    return () => clearInterval(interval);
  }, [allLines]);

  return (
    <div className="arch-terminal">
      <div className="term-head">
        <div className="term-dots">
          <span></span><span></span><span></span>
        </div>
        <div className="term-title">elchi-cli — connecting to control plane</div>
        <div className="term-meta mono">live</div>
      </div>
      <div className="term-body">
        {lines.map((l, idx) => (
          <div key={idx} className={`term-line term-${l.t}`}>{l.text}</div>
        ))}
        <div className="term-cursor"></div>
      </div>
      <div className="term-foot">
        <span className="pill" style={{background:'#dcfce7',color:'#15803d',borderColor:'#bbf7d0'}}>
          <span style={{width:6,height:6,borderRadius:'50%',background:'#22c55e'}}></span>
          Demo connected
        </span>
        <span className="mono" style={{fontSize:11,color:'#94a3b8'}}>
          xDS / gRPC · ADS · VHDS
        </span>
      </div>
    </div>
  );
}

export { ArchDiagram, ArchOrbit, ArchTerminal };
