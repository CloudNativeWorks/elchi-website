import { useState } from 'react';
import { Icon } from './docs-shared.jsx';

// ============== SIDEBAR NAV DATA ==============
const NAV = [
  {
    title: 'Getting Started',
    color: 'blue',
    items: [
      { id: 'introduction', label: 'Introduction' },
      { id: 'quickstart',   label: 'Quick Start' },
      { id: 'concepts',     label: 'Core Concepts' },
    ],
  },
  {
    title: 'Elchi Platform',
    color: 'cyan',
    items: [
      { id: 'platform-overview',     label: 'Overview' },
      { id: 'platform-prerequisites',label: 'Prerequisites' },
      { id: 'platform-install',      label: 'Installation' },
      { id: 'platform-config',       label: 'Configuration' },
      { id: 'platform-storage',      label: 'Storage Options' },
      { id: 'platform-production',   label: 'Production Setup' },
      { id: 'platform-security',     label: 'Security' },
    ],
  },
  {
    title: 'Elchi Client',
    color: 'violet',
    items: [
      { id: 'client-overview', label: 'Getting Started' },
      { id: 'client-download', label: 'Download' },
      { id: 'client-install',  label: 'Installation' },
      { id: 'client-config',   label: 'Configuration' },
      { id: 'client-os',       label: 'Supported OS' },
    ],
  },
  {
    title: 'Elchi Discovery',
    color: 'amber',
    items: [
      { id: 'discovery-overview', label: 'Overview' },
      { id: 'discovery-prereq',   label: 'Prerequisites' },
      { id: 'discovery-install',  label: 'Installation' },
      { id: 'discovery-config',   label: 'Configuration' },
    ],
  },
  {
    title: 'Resources',
    color: 'emerald',
    items: [
      { id: 'cli-reference',  label: 'CLI Reference', tag: 'soon' },
      { id: 'api-reference',  label: 'API Reference', tag: 'soon' },
      { id: 'troubleshoot',   label: 'Troubleshooting' },
    ],
  },
];

// ============== SIDEBAR ==============
function Sidebar({ active, setActive }) {
  const [q, setQ] = useState('');
  const filt = (label) => !q || label.toLowerCase().includes(q.toLowerCase());
  return (
    <aside className="docs-side">
      <div className="docs-search">
        <Icon.Search/>
        <input
          placeholder="Search docs..."
          value={q}
          onChange={(e)=>setQ(e.target.value)}
        />
        <kbd>⌘ K</kbd>
      </div>
      {NAV.map((g)=>{
        const items = g.items.filter((i)=>filt(i.label));
        if (items.length===0) return null;
        return (
          <div className="docs-nav-group" key={g.title}>
            <div className="docs-nav-title">
              <span className={`docs-nav-title-dot ${g.color}`}></span>
              {g.title}
            </div>
            <ul className="docs-nav-list">
              {items.map((i)=>(
                <li key={i.id}>
                  <a
                    href={`#${i.id}`}
                    className={active===i.id?'active':''}
                    onClick={(e)=>{
                      e.preventDefault();
                      setActive(i.id);
                      const el = document.getElementById(i.id);
                      if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
                    }}
                  >
                    <span>{i.label}</span>
                    {i.tag && <span className={`docs-nav-tag ${i.tag==='new'?'new':i.tag==='beta'?'beta':''}`}>{i.tag}</span>}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </aside>
  );
}

// ============== TOC RAIL ==============
function TocRail({ active, headings }) {
  return (
    <aside className="docs-toc">
      <div className="docs-toc-head">On this page</div>
      <ul className="docs-toc-list">
        {headings.map((h)=>(
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              className={`${active===h.id?'active':''} ${h.sub?'sub':''}`}
            >
              {h.label}
            </a>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export { NAV, Sidebar, TocRail };
