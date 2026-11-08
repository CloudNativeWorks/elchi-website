// The brand film, self-hosted (public/videos/sale-night.mp4, poster sale-night.webp).
// Hand-written on purpose: videos-data.js is generated from the YouTube channel. Once the film is
// on the channel, add its id as `yt` here; the player keeps playing the self-hosted file.
// Source project: ../elchi-video (HyperFrames).
export const FILM = {
  slug: 'sale-night',
  cat: 'start',
  src: '/videos/sale-night.mp4',
  title: 'Sale Night: one night with Elchi',
  en: 'One sale night at an online shop, hour by hour: a server goes down, a bot wave hits checkout, a new release goes out, a forgotten endpoint turns up and the proxy is upgraded under full traffic. Elchi handles each one, and nobody notices a thing.',
  tr: 'Bir online mağazanın indirim gecesi, saat saat: bir sunucu düşüyor, checkout\'a bot dalgası geliyor, yeni sürüm yayına çıkıyor, unutulmuş bir uç nokta ortaya çıkıyor ve proxy tam trafik altında yükseltiliyor. Hepsini Elchi karşılıyor ve kimse bir şey fark etmiyor.',
  duration: '1:04',
  seconds: 64,
  date: '2026-11-07',
};

// The launch film (YouTube only, not made by ai-video-factory, so not in videos-data.js).
// Thumbnail: public/videos/launch.webp (from the YouTube thumbnail).
export const LAUNCH = {
  slug: 'launch',
  yt: 'OzN9LNj2iD0',
  cat: 'start',
  title: 'Elchi Launch: Route, Protect and Fail Over from One Control Plane',
  en: 'Manage traffic at scale. Elchi is a visual control plane for Envoy: build, validate, publish, observe and protect your whole fleet from one place, with no hand-written xDS config.',
  tr: 'Trafiği ölçekte yönetin. Elchi, Envoy için görsel bir kontrol düzlemidir: tüm filonuzu tek yerden kurun, doğrulayın, yayına alın, izleyin ve koruyun; elle xDS yazmadan.',
  duration: '0:53',
  seconds: 53,
  date: '2026-11-08T00:53:11-08:00',
};

// Hand-written videos placed into the generated list: [video, slug it goes in front of].
export const EXTRA = [[FILM, 'what-is-elchi'], [LAUNCH, 'what-is-elchi']];
// "Start here" on the videos page and "Watch the film" on the home page.
export const FEATURED_SLUG = 'explainer';
// the home button's label only (the full entry is in videos-data.js, loaded when the player opens)
export const HOME_FILM = { slug: FEATURED_SLUG, duration: '2:43' };
