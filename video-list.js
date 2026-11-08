// The full video list: the generated channel list (videos-data.js) with the hand-written
// videos (film-data.js) placed in it. The featured video leads the page, so it is not in the grid.
import { VIDEOS } from './videos-data.js';
import { EXTRA, FEATURED_SLUG } from './film-data.js';

export const ALL_VIDEOS = (() => {
  const out = [...VIDEOS];
  for (const [v, before] of EXTRA) {
    if (out.some((x) => x.slug === v.slug)) continue;
    const i = out.findIndex((x) => x.slug === before);
    out.splice(i < 0 ? out.length : i, 0, v);
  }
  return out;
})();
export const FEATURED = ALL_VIDEOS.find((v) => v.slug === FEATURED_SLUG);
export const GRID_VIDEOS = ALL_VIDEOS.filter((v) => v !== FEATURED);
