import React from 'react';
import Head from '@docusaurus/Head';
import Original from '@theme-original/BlogTagsListPage';

// Swizzle "wrap": tag listings (and the blog archive) are link lists with no
// content of their own. They stay crawlable (no robots.txt block, so the
// directive is seen) but are kept out of the index; links are still followed.
export default function BlogTagsListPageWrapper(props) {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <Original {...props} />
    </>
  );
}
