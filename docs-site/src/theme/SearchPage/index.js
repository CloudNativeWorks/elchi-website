import React from 'react';
import Head from '@docusaurus/Head';
import Original from '@theme-original/SearchPage';

// Swizzle "wrap": @easyops-cn/docusaurus-search-local emits
// <meta property="robots" content="noindex, follow">, which robots parsers ignore
// (the attribute must be name=). Add the valid tag; scripts/postbuild.mjs strips the
// invalid one from the static HTML.
export default function SearchPageWrapper(props) {
  return (
    <>
      <Head>
        <meta name="robots" content="noindex, follow" />
      </Head>
      <Original {...props} />
    </>
  );
}
