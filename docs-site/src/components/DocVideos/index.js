import React, {useState} from 'react';
import VIDEOS from '@site/src/data/videos.json';
import {DOC_VIDEOS} from '@site/src/data/doc-videos';
import styles from './styles.module.css';

// Video tutorials of a doc page. Click-to-play: until the visitor presses play the page shows
// only our own thumbnail (served by the marketing site at /videos/<slug>.webp — same origin
// in production), so no request goes to YouTube and no cookie is set. The player then
// loads from youtube-nocookie.com.
const BY_SLUG = Object.fromEntries(VIDEOS.map((v) => [v.slug, v]));
export const SECTION_ID = 'video-tutorials';

/** the doc's videos (key = path under docs/ without the extension) */
export function videosFor(source) {
  const key = String(source || '').replace(/^@site\/docs\//, '').replace(/\.mdx?$/, '');
  return (DOC_VIDEOS[key] || []).map((s) => BY_SLUG[s]).filter(Boolean);
}

function PlayIcon({size = 22}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

function Video({v}) {
  const [on, setOn] = useState(false);
  return (
    <figure className={styles.video} id={`video-${v.slug}`}>
      <div className={styles.frame}>
        {on ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v.yt}?autoplay=1&rel=0&modestbranding=1`}
            title={v.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            allowFullScreen
          />
        ) : (
          <button type="button" className={styles.thumb} onClick={() => setOn(true)} aria-label={`Play: ${v.title}`}>
            <img src={`/videos/${v.slug}.webp`} alt="" loading="lazy" decoding="async" width="960" height="540" />
            <span className={styles.play}><PlayIcon /></span>
            <span className={styles.dur}>{v.duration}</span>
          </button>
        )}
      </div>
      <figcaption className={styles.caption}>
        <span>{v.title}</span>
        <a href={`https://www.youtube.com/watch?v=${v.yt}`} target="_blank" rel="noopener noreferrer">YouTube ↗</a>
      </figcaption>
    </figure>
  );
}

/** small link above the page: jumps to the videos below */
export function DocVideosLink({videos}) {
  if (!videos.length) return null;
  const v = videos[0];
  return (
    <a className={styles.link} href={`#${SECTION_ID}`}>
      <PlayIcon size={14} />
      {videos.length === 1 ? `Video tutorial · ${v.duration}` : `${videos.length} video tutorials`}
    </a>
  );
}

export default function DocVideos({videos}) {
  if (!videos.length) return null;
  return (
    <section className={styles.section} id={SECTION_ID} aria-labelledby={`${SECTION_ID}-title`}>
      <h2 id={`${SECTION_ID}-title`}>{videos.length === 1 ? 'Video tutorial' : 'Video tutorials'}</h2>
      <p className={styles.note}>
        Short, hands-on videos showing this feature working for real. English audio, English and Turkish subtitles.{' '}
        <a href="/videos.html">All video tutorials →</a>
      </p>
      <div className={videos.length === 1 ? styles.one : styles.grid}>
        {videos.map((v) => <Video key={v.slug} v={v} />)}
      </div>
    </section>
  );
}
