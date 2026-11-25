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

// Docusaurus' blog structured data types every author as a schema.org Person
// (plugin-content-blog/src/client/structuredDataUtils.ts). Elchi's only blog author is
// the team (blog/authors.yml), so the author is the Organization itself.
export function withOrgAuthor(data) {
  const fix = (post) => ({...post, author: ORG, publisher: ORG});
  if (data['@type'] === 'BlogPosting') return fix(data);
  if (Array.isArray(data.blogPost)) return {...data, publisher: ORG, blogPost: data.blogPost.map(fix)};
  return data;
}
