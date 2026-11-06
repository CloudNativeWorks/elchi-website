import React from 'react';
import Content from '@theme-original/DocItem/Content';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import DocVideos, {DocVideosLink, videosFor} from '@site/src/components/DocVideos';

// Wraps the stock doc content (swizzle "wrap", no copy of Docusaurus code): pages listed in
// src/data/doc-videos.js get a "Video tutorial" link on top and the players at the end.
export default function ContentWrapper(props) {
  const {metadata} = useDoc();
  const videos = videosFor(metadata.source);
  return (
    <>
      <DocVideosLink videos={videos} />
      <Content {...props} />
      <DocVideos videos={videos} />
    </>
  );
}
