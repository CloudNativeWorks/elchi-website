import React from 'react';
import Head from '@docusaurus/Head';
import Content from '@theme-original/DocItem/Content';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {useBaseUrlUtils} from '@docusaurus/useBaseUrl';
import DocVideos, {DocVideosLink, videosFor} from '@site/src/components/DocVideos';
import {ORG} from '@site/src/data/org';

const ENVOY = {'@type': 'SoftwareApplication', name: 'Envoy Proxy', url: 'https://www.envoyproxy.io/'};
const ELCHI = {'@id': 'https://www.elchi.io/#software'};

// TechArticle JSON-LD for every doc page. Deliberately not HowTo: Google no longer
// shows HowTo rich results, and the guides are explanations with steps, not
// step-only recipes. The how-to guides (docs/guides/*) are about Envoy itself; the
// rest of the docs are about Elchi.
function TechArticleJsonLd({metadata, frontMatter, isGuide}) {
  const {siteConfig} = useDocusaurusContext();
  const {withBaseUrl} = useBaseUrlUtils();
  const url = `${siteConfig.url}${metadata.permalink}`;
  const image = withBaseUrl(frontMatter.image ?? 'img/og-docs.png', {absolute: true});
  const data = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': `${url}#article`,
    headline: metadata.title,
    description: metadata.description,
    url,
    mainEntityOfPage: url,
    inLanguage: 'en',
    image,
    author: ORG,
    publisher: ORG,
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteConfig.url}${siteConfig.baseUrl}`,
      name: 'Elchi Docs',
      url: `${siteConfig.url}${siteConfig.baseUrl}`,
    },
    about: isGuide ? ENVOY : ELCHI,
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
// every doc gets TechArticle structured data.
export default function ContentWrapper(props) {
  const {metadata, frontMatter} = useDoc();
  const videos = videosFor(metadata.source);
  const isGuide = metadata.source.startsWith('@site/docs/guides/');
  return (
    <>
      <TechArticleJsonLd metadata={metadata} frontMatter={frontMatter} isGuide={isGuide} />
      <DocVideosLink videos={videos} />
      <Content {...props} />
      <DocVideos videos={videos} />
    </>
  );
}
