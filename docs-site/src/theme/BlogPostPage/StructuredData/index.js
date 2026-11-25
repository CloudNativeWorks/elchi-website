import React from 'react';
import Head from '@docusaurus/Head';
import {useBlogPostStructuredData} from '@docusaurus/plugin-content-blog/client';
import {withOrgAuthor} from '@site/src/data/org';

// Swizzled (eject, 10 lines): the stock BlogPosting JSON-LD with the author enriched
// (jobTitle, sameAs) and CloudNativeWorks as publisher. See src/data/org.js.
export default function BlogPostStructuredData() {
  const structuredData = withOrgAuthor(useBlogPostStructuredData());
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(structuredData)}</script>
    </Head>
  );
}
