import React from 'react';
import Head from '@docusaurus/Head';
import Original from '@theme-original/Blog/Pages/BlogAuthorsListPage';

// Swizzle "wrap": tag listings (and the blog archive and authors list) are link lists with no
// content of their own. They stay crawlable (no robots.txt block, so the
// directive is seen) but are kept out of the index; links are still followed.
export default function BlogAuthorsListPageWrapper(props) {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <Original {...props} />
    </>
  );
}
