# Elchi documentation site

The documentation at [www.elchi.io/docs](https://www.elchi.io/docs), built with
[Docusaurus](https://docusaurus.io/). The marketing site lives in the parent directory and is a
separate Vite build.

## Develop

```bash
npm install
npm start          # dev server with live reload
npm run build      # production build into build/
npm run serve      # serve the production build locally
```

`npm run build` is the gate that matters: `onBrokenLinks: 'throw'` turns any dead internal link
into a build failure, so run it before pushing.

## Deployment

Deployment is **not** run from a laptop — no `yarn deploy`, no `gh-pages` branch. Pushing to
`main` builds the site in CI and publishes it with the rest of elchi.io.

## Version numbers in the docs

The UI/API badges in the navbar are resolved at build time from the public release manifest,
[`archive.elchi.io/index.json`](https://archive.elchi.io/index.json) — never from the component
repositories' releases API, which is private and answers 404 outside the org. See
`archiveVersions()` in `docusaurus.config.ts`.

Version numbers written into the prose (install commands, image tags, Envoy variants) are plain
text and have to be bumped by hand when a release is mirrored.
