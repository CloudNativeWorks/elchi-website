/**
 * Doc card icon: Lucide line icons (lucide.dev, ISC) in the brand color instead
 * of Docusaurus's fallback emoji (🗃 category, 📄 page, 🔗 external link).
 * An emoji the author put at the start of a sidebar label is still shown as is.
 */
import React from 'react';
import clsx from 'clsx';
import {ThemeClassNames} from '@docusaurus/theme-common';
import isInternalUrl from '@docusaurus/isInternalUrl';
import styles from './styles.module.css';

const FALLBACK = new Set(['🗃', '🗃️', '📄', '📄️', '🔗']);

const PATHS = {
  // folder
  category: (
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  ),
  // file-text
  page: (
    <>
      <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
      <path d="M14 2v4a2 2 0 0 0 2 2h4" />
      <path d="M10 9H8" />
      <path d="M16 13H8" />
      <path d="M16 17H8" />
    </>
  ),
  // external-link
  external: (
    <>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </>
  ),
};

function kind(item) {
  if (item.type === 'category') return 'category';
  return isInternalUrl(item.href) ? 'page' : 'external';
}

export default function DocCardHeadingIcon({item, icon}) {
  const k = kind(item);
  return (
    <span
      className={clsx(ThemeClassNames.docs.docCard.icon, styles.cardTitleIcon)}>
      {FALLBACK.has(icon) ? (
        <svg
          className={styles.svg}
          data-kind={k}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true">
          {PATHS[k]}
        </svg>
      ) : (
        icon
      )}
    </span>
  );
}
