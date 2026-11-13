import React from 'react';
import Head from '@docusaurus/Head';
import Content from '@theme-original/DocItem/Content';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DocVideos, {DocVideosLink, videosFor} from '@site/src/components/DocVideos';

const ORG = {
  '@type': 'Organization',
  '@id': 'https://www.elchi.io/#organization',
  name: 'CloudNativeWorks',
  url: 'https://www.elchi.io/',
};

// TechArticle JSON-LD for the how-to guides (docs/guides/*). Deliberately not
// HowTo: Google no longer shows HowTo rich results, and these pages are
// explanations with steps, not step-only recipes.
function TechArticleJsonLd({metadata, frontMatter}) {
  const {siteConfig} = useDocusaurusContext();
  const url = `${siteConfig.url}${metadata.permalink}`;
  const data = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${url}#article`,
    headline: metadata.title,
    description: metadata.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    image: `${siteConfig.url}${siteConfig.baseUrl}img/og-docs.png`,
    author: ORG,
    publisher: ORG,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteConfig.url}${siteConfig.baseUrl}`,
      name: 'Elchi Docs',
      url: `${siteConfig.url}${siteConfig.baseUrl}`,
    },
    about: {'@type': 'SoftwareApplication', name: 'Envoy Proxy', url: 'https://www.envoyproxy.io/'},
  };
  if (metadata.lastUpdatedAt) data.dateModified = new Date(metadata.lastUpdatedAt).toISOString();
  if (frontMatter.keywords) data.keywords = frontMatter.keywords;
  return (
    <Head>
      <script type="application/ld+json">{JSON.stringify(data)}</script>
    </Head>
  );
}

// Wraps the stock doc content (swizzle "wrap", no copy of Docusaurus code): pages listed in
// src/data/doc-videos.js get a "Video tutorial" link on top and the players at the end;
// guides get TechArticle structured data.
export default function ContentWrapper(props) {
  const {metadata, frontMatter} = useDoc();
  const videos = videosFor(metadata.source);
  const isGuide = metadata.source.startsWith('@site/docs/guides/');
  return (
    <>
      {isGuide && <TechArticleJsonLd metadata={metadata} frontMatter={frontMatter} />}
      <DocVideosLink videos={videos} />
      <Content {...props} />
      <DocVideos videos={videos} />
    </>
  );
}
