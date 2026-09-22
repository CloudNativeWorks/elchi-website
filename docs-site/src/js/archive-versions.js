// Keeps the navbar version badges current between docs deploys.
//
// docusaurus.config.ts resolves the versions at BUILD time, which is correct for
// the first paint but freezes them: a component mirrored into the archive after
// the last docs deploy leaves the badge showing the previous release (the nav
// read UI v1.5.21 for hours after v1.5.22 was published). archive.elchi.io
// serves index.json with `access-control-allow-origin: *`, so the browser can
// read the same manifest the build read and correct the badge in place.
//
// Failure is silent on purpose: an offline reader, a blocked request or a
// malformed manifest simply keeps the build-time value.

const ARCHIVE_INDEX = 'https://archive.elchi.io/index.json';

let refreshed = false;

function applyVersions(index) {
  const nodes = document.querySelectorAll('.nav-version-tag[data-archive]');
  nodes.forEach((node) => {
    const list = index[node.dataset.archive];
    const version = Array.isArray(list) && list.length > 0 ? list[0]?.version : null;
    if (version && node.textContent !== version) {
      node.textContent = version;
    }
  });
}

function refresh() {
  if (refreshed || typeof document === 'undefined' || typeof fetch !== 'function') return;
  refreshed = true;
  fetch(ARCHIVE_INDEX)
    .then((res) => (res.ok ? res.json() : null))
    .then((index) => {
      if (index && typeof index === 'object') applyVersions(index);
    })
    .catch(() => {});
}

// The navbar is rendered once per page load; onRouteDidUpdate also covers the
// very first route, and the `refreshed` guard keeps it to one request.
export function onRouteDidUpdate() {
  refresh();
}
