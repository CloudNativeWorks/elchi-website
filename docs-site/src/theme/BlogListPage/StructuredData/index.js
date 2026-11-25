import React from 'react';
import Head from '@docusaurus/Head';
import {useBlogListPageStructuredData} from '@docusaurus/plugin-content-blog/client';
import {withOrgAuthor} from '@site/src/data/org';

// Swizzled (eject, 10 lines): the stock Blog JSON-LD with each post's author enriched
// (jobTitle, sameAs) and CloudNativeWorks as publisher. See src/data/org.js.
export default function BlogListPageStructuredData(props) {
  const structuredData = withOrgAuthor(useBlogListPageStructuredData(props));
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Head>
  );
}
