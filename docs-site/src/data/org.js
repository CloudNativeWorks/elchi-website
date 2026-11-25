// The publisher/author node shared by every docs and blog JSON-LD block. The @id is
// the Organization node on the marketing site (www.elchi.io/#organization), so the
// docs, the blog and the marketing pages describe one entity. url is the apex
// domain: www.cloudnativeworks.com answers 301 to it.
export const ORG = {
  '@type': 'Organization',
  '@id': 'https://www.elchi.io/#organization',
  name: 'CloudNativeWorks',
  url: 'https://cloudnativeworks.com',
  logo: 'https://www.elchi.io/icon-512.png',
};

// The blog's author (blog/authors.yml `safa`): a named Person whose sameAs ties the byline to
// the same GitHub and LinkedIn profiles, working for the Organization, which publishes.
export const AUTHOR = {
  '@type': 'Person',
  name: 'Safa Pehlivan',
  jobTitle: 'Developer',
  url: 'https://www.linkedin.com/in/sefa-pehlivan-b023544a/',
  image: 'https://github.com/sphlvn3.png',
  sameAs: ['https://github.com/sphlvn3', 'https://www.linkedin.com/in/sefa-pehlivan-b023544a/'],
  worksFor: {'@id': ORG['@id']},
};

// Docusaurus' blog structured data builds the author from authors.yml with no sameAs or
// jobTitle and no publisher; replace it with AUTHOR and add ORG as the publisher.
export function withOrgAuthor(data) {
  const fix = (post) => ({...post, author: AUTHOR, publisher: ORG});
  if (data['@type'] === 'BlogPosting') return fix(data);
  if (Array.isArray(data.blogPost)) return {...data, publisher: ORG, blogPost: data.blogPost.map(fix)};
  return data;
}
